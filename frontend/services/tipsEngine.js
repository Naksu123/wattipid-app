/**
 * Wattipid Tips Engine
 * Generates dynamic tips based on real consumption data,
 * detects high consumption, and triggers notifications.
 */
import { getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth, getBudget, getConsumptionComparison, getSetting, setSetting } from './database';
import { tipsService } from './tipsService';

// ============ STATIC TIPS ============
// General, fixed guidelines that never change

export const STATIC_TIPS = [
  // --- LIGHTING ---
  { id: 'l1', icon: 'bulb-outline', category: 'Lighting', title: 'Switch to LED Bulbs', 
    tip: 'Replace old incandescent or "dilaw" bulbs with LEDs. They use 75% less energy and last much longer.',
    reason: 'LEDs convert most energy into light, while old bulbs waste 90% of energy as heat.',
    impact: 'High', priority: 1 },
  { id: 'l2', icon: 'sunny-outline', category: 'Lighting', title: 'Study Near Windows', 
    tip: 'Position your desk near a window to use natural daylight for studying.',
    reason: 'Daylight is free and natural light reduces eye strain compared to artificial lamps.',
    impact: 'Medium', priority: 2 },
  { id: 'l3', icon: 'sparkles-outline', category: 'Lighting', title: 'Clean Your Bulbs', 
    tip: 'Dust off your lamps and bulbs regularly.',
    reason: 'Dust can block up to 20% of light, making you feel like you need more lamps.',
    impact: 'Low', priority: 3 },

  // --- COOLING ---
  { id: 'c1', icon: 'snow-outline', category: 'Cooling', title: 'The 25°C AC Rule', 
    tip: 'Set your aircon to 25°C instead of the lowest setting (like 16°C).',
    reason: 'Every degree lower increases your consumption by about 10%. 25°C is the "sweet spot" for savings.',
    impact: 'High', priority: 0 },
  { id: 'c2', icon: 'timer-outline', category: 'Cooling', title: 'Use the AC Timer', 
    tip: 'Set your AC to turn off 1–2 hours before you plan to wake up.',
    reason: 'The room will stay cool enough until you wake up, saving you hours of electricity every morning.',
    impact: 'High', priority: 1 },
  { id: 'c3', icon: 'leaf-outline', category: 'Cooling', title: 'Fan + AC Combo', 
    tip: 'Use an electric fan to circulate the cool air from your AC.',
    reason: 'A fan helps you feel cooler even if the AC is set at a higher, more efficient temperature.',
    impact: 'Medium', priority: 1 },
  { id: 'c4', icon: 'water-outline', category: 'Cooling', title: 'Clean AC Filters', 
    tip: 'Wash your AC filters at least once a month (or every two weeks if dusty).',
    reason: 'Dirty filters block airflow, forcing the AC motor to work harder and consume more power.',
    impact: 'High', priority: 0 },

  // --- APPLIANCES & COOKING ---
  { id: 'a1', icon: 'restaurant-outline', category: 'Cooking', title: 'Unplug the Rice Cooker', 
    tip: 'Once the rice is cooked, unplug the unit. Avoid using "Warm" mode for hours.',
    reason: 'Rice cookers still use significant power to maintain heat; a towel over the pot keeps it warm for free.',
    impact: 'Medium', priority: 2 },
  { id: 'a2', icon: 'flask-outline', category: 'Appliances', title: 'Boil Only What You Need', 
    tip: 'When using an electric kettle, boil only the amount of water you will actually use.',
    reason: 'Heating water is energy-intensive; boiling a full kettle for one cup is a major waste.',
    impact: 'Medium', priority: 2 },
  { id: 'a3', icon: 'ice-cream-outline', category: 'Appliances', title: 'Don\'t Overcrowd the Fridge', 
    tip: 'Leave space for air to circulate inside your shared refrigerator.',
    reason: 'If air can\'t flow, the fridge has to run longer to keep everything cold.',
    impact: 'Medium', priority: 2 },

  // --- CHARGING & ELECTRONICS ---
  { id: 'e1', icon: 'battery-charging-outline', category: 'Electronics', title: 'Unplug Idle Chargers', 
    tip: 'Unplug phone and laptop chargers when they are not actively charging a device.',
    reason: 'Many chargers consume "phantom power" even when the device isn\'t connected.',
    impact: 'Low', priority: 3 },
  { id: 'e2', icon: 'desktop-outline', category: 'Electronics', title: 'Hibernate Your Laptop', 
    tip: 'Use "Hibernate" instead of "Sleep" if you\'re taking a break for more than 30 minutes.',
    reason: 'Hibernate saves your work to the disk and uses zero power, unlike Sleep mode.',
    impact: 'Medium', priority: 2 },

  // --- DAILY HABITS ---
  { id: 'h1', icon: 'shirt-outline', category: 'Habits', title: 'Iron Clothes in Bulk', 
    tip: 'Iron all your clothes for the week in one session instead of one piece every morning.',
    reason: 'Flat irons use the most energy while heating up; doing it all at once is much more efficient.',
    impact: 'High', priority: 1 },
  { id: 'h2', icon: 'calendar-outline', category: 'Habits', title: 'Take Cold Showers', 
    tip: 'If your dorm has an electric heater, try to avoid using it during hot months.',
    reason: 'Water heaters are among the highest wattage appliances in any home or dorm.',
    impact: 'High', priority: 1 },
  { id: 'h3', icon: 'people-outline', category: 'Shared', title: 'Dorm AC Agreement', 
    tip: 'Coordinate with roommates to only use the AC during specific "shared hours."',
    reason: 'Running one AC for 4 people at once is better than everyone using separate fans all day.',
    impact: 'High', priority: 0 },
];

// ============ DYNAMIC TIP TEMPLATES ============
// These are selected/activated based on consumption analysis

const DYNAMIC_TIP_TEMPLATES = {
  // Budget-related
  budgetExceeded: {
    icon: 'alert-circle', category: 'Budget',
    tip: 'You\'ve exceeded your {period} budget by ₱{amount}. Review your appliance usage and try to reduce consumption for the rest of the {period}.',
    priority: 0,
  },
  budgetNearing: {
    icon: 'warning', category: 'Budget',
    tip: 'You\'re at {pct}% of your {period} budget (₱{spent}/₱{limit}). Consider limiting non-essential appliance use today.',
    priority: 0,
  },
  // Comparison-related
  consumptionUp: {
    icon: 'trending-up', category: 'Consumption',
    tip: 'Your {period} consumption is {pct}% higher than last {period}. Check if any appliances are running unnecessarily.',
    priority: 1,
  },
  consumptionDown: {
    icon: 'trending-down', category: 'Savings',
    tip: 'Great job! Your {period} consumption is {pct}% lower than last {period}. Keep up the good habits! 🎉',
    priority: 2,
  },
  // Power-related
  highPower: {
    icon: 'flash', category: 'Power',
    tip: 'Your current power draw ({power}W) is high. Turn off unused appliances to reduce your consumption rate.',
    priority: 0,
  },
  // Time-related
  peakHourWarning: {
    icon: 'time', category: 'Timing',
    tip: 'You\'re consuming during peak hours. If possible, shift heavy-usage tasks to off-peak hours (10PM-6AM) to save energy.',
    priority: 1,
  },
  // General dynamic
  highDailyUsage: {
    icon: 'battery-dead', category: 'Daily',
    tip: 'Today\'s energy usage ({energy} kWh) is higher than average. Try turning off unused lights and unplugging idle chargers.',
    priority: 0,
  },
  highWeeklyUsage: {
    icon: 'calendar', category: 'Weekly',
    tip: 'This week\'s consumption is elevated. Review which days had the highest usage and adjust your habits accordingly.',
    priority: 1,
  },
  efficientUsage: {
    icon: 'checkmark-circle', category: 'Efficiency',
    tip: 'Your usage pattern is efficient today! Maintaining consistent, low power draw helps keep costs down.',
    priority: 2,
  },
};

// ============ HIGH CONSUMPTION THRESHOLDS ============

const DEFAULT_THRESHOLDS = {
  budgetWarningPct: 80,      // Warn at 80% of budget
  budgetCriticalPct: 100,    // Critical at 100% of budget
  comparisonIncreasePct: 10,  // Increasing Consumption (10%)
  unusualIncreasePct: 30,     // Unusual Consumption Increase (30%)
  decreasingPct: -10,         // Decreasing Consumption (-10%)
  stableRangePct: 5,          // Stable range (+/- 5%)
  highPowerWatts: 1000,       // High power threshold in watts (1kW)
  highDailyKwh: 5,            // High daily usage threshold
};

// ============ SMART TIPS BEHAVIOR MAP ============
const BEHAVIOR_CATEGORY_MAP = {
  INCREASING: ['High Consumption Awareness', 'Consumption Monitoring', 'Electricity Conservation', 'General Energy Saving'],
  DECREASING: ['Consumption Goals', 'Energy Awareness', 'General Energy Saving', 'Energy-Saving Practices'],
  STABLE: ['Consumption Monitoring', 'Energy Awareness', 'Responsible Electricity Use', 'Consumption Goals'],
  UNUSUAL_INCREASE: ['High Consumption Awareness', 'Consumption Monitoring', 'Electricity Conservation'],
  REPEATED_HIGH: ['High Consumption Awareness', 'Electricity Conservation', 'Energy-Saving Practices', 'General Energy Saving'],
  IMPROVING: ['Consumption Goals', 'Energy Awareness', 'Energy-Saving Practices']
};

export async function getThresholds() {
  const saved = await getSetting('consumption_thresholds');
  if (saved) {
    try { return { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) }; }
    catch { return DEFAULT_THRESHOLDS; }
  }
  return DEFAULT_THRESHOLDS;
}

export async function setThresholds(thresholds) {
  await setSetting('consumption_thresholds', JSON.stringify({ ...DEFAULT_THRESHOLDS, ...thresholds }));
}

// ============ DYNAMIC TIP GENERATION ============

function fillTemplate(template, vars) {
  let text = template.tip;
  Object.keys(vars).forEach(key => {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), vars[key]);
  });
  return { ...template, tip: text, isDynamic: true, generatedAt: new Date().toISOString() };
}

/**
 * Generate dynamic tips based on real consumption data.
 * This is the main Smart Tips Engine.
 */
export async function generateDynamicTips(roomId, currentPower = 0) {
  const thresholds = await getThresholds();

  // 1. Fetch consumption data in parallel
  const [today, week, month, dailyComp, weeklyComp, monthlyComp] = await Promise.all([
    getTotalConsumptionToday(roomId),
    getTotalConsumptionWeek(roomId),
    getTotalConsumptionMonth(roomId),
    getConsumptionComparison(roomId, 'daily'),
    getConsumptionComparison(roomId, 'weekly'),
    getConsumptionComparison(roomId, 'monthly'),
  ]);

  // 2. Identify active behaviors
  const activeBehaviors = new Set();
  
  const dChange = dailyComp?.costPctChange || 0;
  const wChange = weeklyComp?.costPctChange || 0;
  const mChange = monthlyComp?.costPctChange || 0;

  // Unusual Increase
  if (dChange >= thresholds.unusualIncreasePct || wChange >= thresholds.unusualIncreasePct) {
    activeBehaviors.add('UNUSUAL_INCREASE');
  }
  
  // Repeated High Consumption
  if (today?.totalEnergy > thresholds.highDailyKwh && wChange >= thresholds.comparisonIncreasePct) {
    activeBehaviors.add('REPEATED_HIGH');
  }

  // Increasing Consumption
  if (dChange >= thresholds.comparisonIncreasePct || wChange >= thresholds.comparisonIncreasePct || mChange >= thresholds.comparisonIncreasePct) {
    activeBehaviors.add('INCREASING');
  }

  // Decreasing Consumption
  if (dChange <= thresholds.decreasingPct || wChange <= thresholds.decreasingPct) {
    activeBehaviors.add('DECREASING');
  }
  
  // Improving Consumption
  if (mChange <= thresholds.decreasingPct) {
    activeBehaviors.add('IMPROVING');
  }

  // Stable Consumption
  if (activeBehaviors.size === 0) {
    if (Math.abs(wChange) <= thresholds.stableRangePct && Math.abs(mChange) <= thresholds.stableRangePct) {
      activeBehaviors.add('STABLE');
    }
  }

  // Fallback
  if (activeBehaviors.size === 0) {
    activeBehaviors.add('STABLE');
  }

  // 3. Map to Recommended Categories
  const recommendedCategories = new Set();
  activeBehaviors.forEach(b => {
    const cats = BEHAVIOR_CATEGORY_MAP[b] || [];
    cats.forEach(c => recommendedCategories.add(c));
  });

  // 4. Fetch 120-tip library
  const allTipsRes = await tipsService.getAllTips();
  let library = [];
  if (allTipsRes.success && allTipsRes.data) {
    library = allTipsRes.data;
  }

  // 5. Filter and Rank
  let relevantTips = library.filter(t => recommendedCategories.has(t.category));
  
  // Fallback if filtering fails or library empty
  if (relevantTips.length === 0) {
    relevantTips = library;
  }
  
  // Shuffle pseudo-randomly
  relevantTips.sort(() => 0.5 - Math.random());
  
  // Return top 3 most relevant tips, flagged as dynamic
  return relevantTips.slice(0, 3).map(t => ({ ...t, isDynamic: true, generatedAt: new Date().toISOString() }));
}

// ============ HIGH CONSUMPTION DETECTION ============

/**
 * Detects high consumption and returns alert details.
 * Returns null if no high consumption detected.
 */
export function detectHighConsumptionSync(currentPower = 0, budget = null, today = null, month = null) {
  const alerts = [];
  
  // Default thresholds to use synchronously
  const thresholds = {
    budgetWarningPct: 80,
    budgetCriticalPct: 100,
    highPowerWatts: 2000
  };

  if (budget) {
    const dailyPct = budget.daily_allowance > 0 ? ((today?.totalCost || 0) / budget.daily_allowance) * 100 : 0;
    const monthlyPct = budget.monthly_budget > 0 ? ((month?.totalCost || 0) / budget.monthly_budget) * 100 : 0;

    if (monthlyPct >= thresholds.budgetCriticalPct) {
      alerts.push({
        type: 'danger',
        title: 'Monthly Budget Exceeded!',
        message: `You've exceeded your monthly budget of ₱${Number(budget.monthly_budget || 0).toFixed(2)}.`,
        severity: 4,
      });
    } else if (monthlyPct >= thresholds.budgetWarningPct) {
      alerts.push({
        type: 'warning',
        title: 'Monthly Budget Warning',
        message: `You're at ${Number(monthlyPct || 0).toFixed(0)}% of your monthly budget.`,
        severity: 2,
      });
    }

    if (dailyPct >= thresholds.budgetCriticalPct && monthlyPct < thresholds.budgetCriticalPct) {
      alerts.push({
        type: 'danger',
        title: 'Daily Budget Exceeded!',
        message: `You've exceeded your daily allowance of ₱${Number(budget.daily_allowance || 0).toFixed(2)}.`,
        severity: 3,
      });
    } else if (dailyPct >= thresholds.budgetWarningPct && monthlyPct < thresholds.budgetWarningPct) {
      alerts.push({
        type: 'warning',
        title: 'Daily Budget Warning',
        message: `You've used ${Number(dailyPct || 0).toFixed(0)}% of your daily allowance.`,
        severity: 1,
      });
    }
  }

  if (currentPower > thresholds.highPowerWatts) {
    alerts.push({
      type: 'warning',
      title: 'Peak Power Usage!',
      message: `Your current draw is ${Number(currentPower || 0).toFixed(0)}W, which is high.`,
      severity: 3,
    });
  }

  if (alerts.length > 0) {
    alerts.sort((a, b) => b.severity - a.severity);
    return alerts[0];
  }
  return null;
}

export async function detectHighConsumption(roomId, currentPower = 0) {
  const thresholds = await getThresholds();
  const alerts = [];

  const [today, month, budget, dailyComp] = await Promise.all([
    getTotalConsumptionToday(roomId),
    getTotalConsumptionMonth(roomId),
    getBudget(roomId),
    getConsumptionComparison(roomId, 'daily'),
  ]);

  // Check 1: Budget exceeded (Daily and Monthly)
  if (budget) {
    const dailyPct = budget.daily_allowance > 0 ? (today.totalCost / budget.daily_allowance) * 100 : 0;
    const monthlyPct = budget.monthly_budget > 0 ? (month.totalCost / budget.monthly_budget) * 100 : 0;

    // Monthly Checks (Higher Priority)
    if (monthlyPct >= thresholds.budgetCriticalPct) {
      alerts.push({
        type: 'danger',
        title: 'Monthly Budget Exceeded!',
        message: `You've exceeded your monthly budget of ₱${Number(budget.monthly_budget || 0).toFixed(2)}. Current total: ₱${Number(month.totalCost || 0).toFixed(2)}.`,
        tip: 'Your monthly spending limit has been reached. Please minimize all electrical usage to avoid additional costs.',
        severity: 4,
      });
    } else if (monthlyPct >= thresholds.budgetWarningPct) {
      alerts.push({
        type: 'warning',
        title: 'Monthly Budget Warning',
        message: `You're at ${Number(monthlyPct || 0).toFixed(0)}% of your monthly budget (₱${Number(month.totalCost || 0).toFixed(2)} / ₱${Number(budget.monthly_budget || 0).toFixed(2)}).`,
        tip: 'You are nearing your monthly limit. Monitor your usage closely for the remainder of the month.',
        severity: 2,
      });
    }

    // Daily Checks
    if (dailyPct >= thresholds.budgetCriticalPct && monthlyPct < thresholds.budgetCriticalPct) {
      alerts.push({
        type: 'danger',
        title: 'Daily Budget Exceeded!',
        message: `You've exceeded your daily allowance of ₱${Number(budget.daily_allowance || 0).toFixed(2)}. Today's spending: ₱${Number(today.totalCost || 0).toFixed(2)}.`,
        tip: 'Try to keep usage at a minimum for the rest of the day.',
        severity: 3,
      });
    } else if (dailyPct >= thresholds.budgetWarningPct && monthlyPct < thresholds.budgetWarningPct) {
      alerts.push({
        type: 'warning',
        title: 'Daily Budget Warning',
        message: `You've used ${Number(dailyPct || 0).toFixed(0)}% of your daily allowance.`,
        tip: 'Consider switching off non-essential appliances.',
        severity: 1,
      });
    }
  }

  // Check 2: significantly higher than previous period
  if (dailyComp && dailyComp.previous.totalCost > 0 && dailyComp.costPctChange >= thresholds.comparisonIncreasePct) {
    alerts.push({
      type: 'warning',
      title: 'High Consumption Trend',
      message: `Today's usage is ${Number(dailyComp.costPctChange || 0).toFixed(0)}% higher than yesterday.`,
      tip: 'Check if you left any appliances on by mistake.',
      severity: 2,
    });
  }

  // Check 3: High instantaneous power (Peak)
  if (currentPower > thresholds.highPowerWatts) {
    alerts.push({
      type: 'warning',
      title: 'Peak Power Usage!',
      message: `Your current draw is ${Number(currentPower || 0).toFixed(0)}W, which is high for your room.`,
      tip: 'Try to limit running multiple heavy appliances (like AC and kettle) at the same time.',
      severity: 2,
    });
  }

  // Check 4: High daily energy
  if (today.totalEnergy > thresholds.highDailyKwh) {
    alerts.push({
      type: 'danger',
      title: 'Excessive Energy Use',
      message: `Today's usage (${Number(today.totalEnergy || 0).toFixed(2)} kWh) is above your normal threshold.`,
      tip: 'Audit your appliances to see what is consuming the most power.',
      severity: 3,
    });
  }

  // Return highest severity alert, or null
  if (alerts.length === 0) return null;
  alerts.sort((a, b) => b.severity - a.severity);
  return alerts[0];
}

// ============ DAILY TIP OF THE DAY ============

/**
 * Gets the "tip of the day" — rotates daily from static tips.
 * Uses the day-of-year to pick a different tip each day.
 */
export function getDailyStaticTip() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const index = dayOfYear % STATIC_TIPS.length;
  return STATIC_TIPS[index];
}

/**
 * Get a contextual pop-up tip based on consumption pattern.
 * Used for the dashboard smart tip display.
 */
export function getSmartPopupTip(currentPower, todayEnergy, budget) {
  const hour = new Date().getHours();
  const power = Number(currentPower || 0);

  // 1. High Power Alert (General)
  if (power > 1500) {
    return {
      icon: 'flash', color: '#EF4444',
      title: 'High Power Alert',
      message: `Your total consumption is quite high right now (${power.toFixed(0)}W). Consider lowering usage if possible to avoid spikes.`,
    };
  }

  // 2. Budget Alert
  if (budget && todayEnergy > 0) {
    const dailyPct = budget.daily_allowance > 0 ? (todayEnergy / budget.daily_allowance) * 100 : 0;
    if (dailyPct >= 90) {
      return {
        icon: 'wallet', color: '#F59E0B',
        title: 'Budget Alert',
        message: 'You\'re approaching your daily budget limit. Reduce overall power usage to stay within budget.',
      };
    }
  }

  // 3. Nighttime Ghost Load / Unintended Usage
  if ((hour >= 22 || hour <= 5) && power > 300) {
    return {
      icon: 'moon', color: '#8B5CF6',
      title: 'Late Night Usage',
      message: `You are pulling ${power.toFixed(0)}W late at night. Ensure nothing was left on by mistake before going to sleep.`,
    };
  }

  // 4. Midday Optimization (if load is moderately high)
  if (hour >= 12 && hour <= 14 && power > 500) {
    return {
      icon: 'sunny', color: '#22C55E',
      title: 'Daylight Savings',
      message: 'Your power draw is high during peak daylight. If applicable, try utilizing natural light and ventilation to save energy!',
    };
  }

  // 5. Normal Nighttime Tip
  if (hour >= 22 || hour <= 5) {
    return {
      icon: 'moon', color: '#3B82F6',
      title: 'Nighttime Tip',
      message: 'Going to sleep? Make sure to turn off all lights and unplug chargers to save overnight.',
    };
  }

  // Fallback to static rotation
  return getDailyStaticTip();
}
