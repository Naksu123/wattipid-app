/**
 * Wattipid Tips Engine
 * Generates dynamic tips based on real consumption data,
 * detects high consumption, and triggers notifications.
 */
import { getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth, getBudget, getConsumptionComparison, getSetting, setSetting } from './database';

// ============ STATIC TIPS ============
// General, fixed guidelines that never change

export const STATIC_TIPS = [
  { id: 's1', icon: 'bulb-outline', tip: 'Switch to LED bulbs — they use 75% less energy than incandescent bulbs.', category: 'Lighting', priority: 1 },
  { id: 's2', icon: 'phone-portrait-outline', tip: 'Unplug chargers when not in use to avoid phantom power drain.', category: 'Devices', priority: 1 },
  { id: 's3', icon: 'snow-outline', tip: 'Set your AC to 25°C for the best balance of comfort and efficiency.', category: 'Cooling', priority: 2 },
  { id: 's4', icon: 'sunny-outline', tip: 'Use natural daylight when studying during daytime hours.', category: 'Lighting', priority: 1 },
  { id: 's5', icon: 'time-outline', tip: 'Run high-wattage appliances during off-peak hours (10PM–6AM).', category: 'Timing', priority: 2 },
  { id: 's6', icon: 'desktop-outline', tip: 'Turn off monitors during study breaks to save energy.', category: 'Devices', priority: 1 },
  { id: 's7', icon: 'water-outline', tip: 'Use cold water for laundry — heating water uses significant energy.', category: 'Water', priority: 3 },
  { id: 's8', icon: 'leaf-outline', tip: 'Open windows for ventilation instead of running fans when breezy.', category: 'Cooling', priority: 2 },
  { id: 's9', icon: 'power-outline', tip: 'Use power strips to easily switch off multiple devices at once.', category: 'Devices', priority: 2 },
  { id: 's10', icon: 'thermometer-outline', tip: 'Keep your fridge at 3–5°C and freezer at -18°C for optimal efficiency.', category: 'Appliances', priority: 3 },
  { id: 's11', icon: 'shirt-outline', tip: 'Air-dry clothes instead of using a dryer whenever possible.', category: 'Appliances', priority: 2 },
  { id: 's12', icon: 'wifi-outline', tip: 'Turn off your Wi-Fi router at night to save standby power.', category: 'Devices', priority: 3 },
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
  comparisonIncreasePct: 20,  // Flag if 20% higher than previous period
  highPowerWatts: 1000,       // High power threshold in watts (1kW)
  highDailyKwh: 5,            // High daily usage threshold
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
 * This is the main intelligence function.
 */
export async function generateDynamicTips(roomId, currentPower = 0) {
  const tips = [];
  const thresholds = await getThresholds();

  // Fetch all needed data in parallel
  const [today, week, month, budget, dailyComp, weeklyComp, monthlyComp] = await Promise.all([
    getTotalConsumptionToday(roomId),
    getTotalConsumptionWeek(roomId),
    getTotalConsumptionMonth(roomId),
    getBudget(roomId),
    getConsumptionComparison(roomId, 'daily'),
    getConsumptionComparison(roomId, 'weekly'),
    getConsumptionComparison(roomId, 'monthly'),
  ]);

  // --- Budget-based tips ---
  if (budget) {
    const dailyPct = budget.daily_allowance > 0 ? (today.totalCost / budget.daily_allowance) * 100 : 0;
    const monthlyPct = budget.monthly_budget > 0 ? (month.totalCost / budget.monthly_budget) * 100 : 0;

    if (dailyPct >= thresholds.budgetCriticalPct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.budgetExceeded, {
        period: 'daily', amount: Number(today.totalCost - budget.daily_allowance || 0).toFixed(2),
      }));
    } else if (dailyPct >= thresholds.budgetWarningPct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.budgetNearing, {
        period: 'daily', pct: Number(dailyPct || 0).toFixed(0), spent: Number(today.totalCost || 0).toFixed(2), limit: Number(budget.daily_allowance || 0).toFixed(2),
      }));
    }

    if (monthlyPct >= thresholds.budgetCriticalPct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.budgetExceeded, {
        period: 'monthly', amount: Number(month.totalCost - budget.monthly_budget || 0).toFixed(2),
      }));
    } else if (monthlyPct >= thresholds.budgetWarningPct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.budgetNearing, {
        period: 'monthly', pct: Number(monthlyPct || 0).toFixed(0), spent: Number(month.totalCost || 0).toFixed(2), limit: Number(budget.monthly_budget || 0).toFixed(2),
      }));
    }
  }

  // --- Comparison-based tips ---
  if (dailyComp && dailyComp.previous.totalCost > 0) {
    if (dailyComp.costPctChange >= thresholds.comparisonIncreasePct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.consumptionUp, {
        period: 'daily', pct: Number(dailyComp.costPctChange || 0).toFixed(0),
      }));
    } else if (dailyComp.costPctChange <= -10) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.consumptionDown, {
        period: 'daily', pct: Math.abs(Number(dailyComp.costPctChange || 0)).toFixed(0),
      }));
    }
  }

  if (weeklyComp && weeklyComp.previous.totalCost > 0) {
    if (weeklyComp.costPctChange >= thresholds.comparisonIncreasePct) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.consumptionUp, {
        period: 'weekly', pct: Number(weeklyComp.costPctChange || 0).toFixed(0),
      }));
    } else if (weeklyComp.costPctChange <= -10) {
      tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.consumptionDown, {
        period: 'weekly', pct: Math.abs(Number(weeklyComp.costPctChange || 0)).toFixed(0),
      }));
    }
  }

  // --- Power-based tips ---
  if (currentPower > thresholds.highPowerWatts) {
    tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.highPower, {
      power: Number(currentPower || 0).toFixed(0),
    }));
  }

  // --- Daily energy check ---
  if (today.totalEnergy > thresholds.highDailyKwh) {
    tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.highDailyUsage, {
      energy: Number(today.totalEnergy || 0).toFixed(2),
    }));
  }

  // --- Time-based tips (peak hours 6AM-10PM) ---
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17 && currentPower > 800) {
    tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.peakHourWarning, {}));
  }

  // --- If everything looks good ---
  if (tips.length === 0 && today.totalEnergy > 0) {
    tips.push(fillTemplate(DYNAMIC_TIP_TEMPLATES.efficientUsage, {}));
  }

  // Sort by priority (0 = most urgent)
  tips.sort((a, b) => a.priority - b.priority);

  return tips;
}

// ============ HIGH CONSUMPTION DETECTION ============

/**
 * Detects high consumption and returns alert details.
 * Returns null if no high consumption detected.
 */
export async function detectHighConsumption(roomId, currentPower = 0) {
  const thresholds = await getThresholds();
  const alerts = [];

  const [today, budget, dailyComp] = await Promise.all([
    getTotalConsumptionToday(roomId),
    getBudget(roomId),
    getConsumptionComparison(roomId, 'daily'),
  ]);

  // Check 1: Budget exceeded
  if (budget) {
    const dailyPct = budget.daily_allowance > 0 ? (today.totalCost / budget.daily_allowance) * 100 : 0;
    if (dailyPct >= thresholds.budgetCriticalPct) {
      alerts.push({
        type: 'danger',
        title: 'Budget Exceeded!',
        message: `You've exceeded your daily budget of ₱${Number(budget.daily_allowance || 0).toFixed(2)}. Current spending: ₱${Number(today.totalCost || 0).toFixed(2)}.`,
        tip: 'Turn off all non-essential appliances immediately. Unplug idle chargers and switch off extra lights to prevent further overspending.',
        severity: 3,
      });
    } else if (dailyPct >= thresholds.budgetWarningPct) {
      alerts.push({
        type: 'warning',
        title: 'Budget Warning',
        message: `You're at ${Number(dailyPct || 0).toFixed(0)}% of your daily budget (₱${Number(today.totalCost || 0).toFixed(2)} / ₱${Number(budget.daily_allowance || 0).toFixed(2)}).`,
        tip: 'Consider reducing your power usage. Turn off lights you don\'t need, and avoid running high-wattage appliances until tomorrow.',
        severity: 2,
      });
    }
  }

  // Check 2: Significantly higher than previous period
  if (dailyComp && dailyComp.previous.totalCost > 0 && dailyComp.costPctChange >= thresholds.comparisonIncreasePct) {
    alerts.push({
      type: 'warning',
      title: 'High Consumption Detected',
      message: `Today's consumption is ${Number(dailyComp.costPctChange || 0).toFixed(0)}% higher than yesterday.`,
      tip: 'Your usage is unusually high today. Check if any appliances were left running and try to minimize power consumption for the rest of the day.',
      severity: 2,
    });
  }

  // Check 3: High instantaneous power
  if (currentPower > thresholds.highPowerWatts) {
    alerts.push({
      type: 'warning',
      title: 'High Power Draw',
      message: `Your current power draw is ${Number(currentPower || 0).toFixed(0)}W, which is above the ${thresholds.highPowerWatts}W threshold.`,
      tip: 'Multiple high-wattage appliances may be running. Turn off appliances you\'re not actively using to reduce your power draw.',
      severity: 1,
    });
  }

  // Check 4: High daily energy
  if (today.totalEnergy > thresholds.highDailyKwh) {
    alerts.push({
      type: 'danger',
      title: 'Excessive Daily Usage',
      message: `Today's total energy usage (${Number(today.totalEnergy || 0).toFixed(2)} kWh) exceeds the ${thresholds.highDailyKwh} kWh threshold.`,
      tip: 'Your energy consumption today is very high. Audit your running devices — AC units, heaters, and old refrigerators are common culprits.',
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
  if (currentPower > 1500) {
    return {
      icon: 'flash', color: '#EF4444',
      title: 'High Power Alert',
      message: `Your consumption is high right now (${Number(currentPower || 0).toFixed(0)}W). Try turning off unused appliances to save energy.`,
    };
  }
  if (budget && todayEnergy > 0) {
    const dailyPct = budget.daily_allowance > 0 ? (todayEnergy / budget.daily_allowance) * 100 : 0;
    if (dailyPct >= 90) {
      return {
        icon: 'wallet', color: '#F59E0B',
        title: 'Budget Alert',
        message: 'You\'re approaching your daily budget limit. Reduce power usage to stay within budget.',
      };
    }
  }
  const hour = new Date().getHours();
  if (hour >= 12 && hour <= 14) {
    return {
      icon: 'sunny', color: '#22C55E',
      title: 'Midday Tip',
      message: 'It\'s peak sunlight — open your curtains and use natural light instead of lamps!',
    };
  }
  if (hour >= 22 || hour <= 5) {
    return {
      icon: 'moon', color: '#3B82F6',
      title: 'Nighttime Tip',
      message: 'Going to sleep? Make sure to turn off all lights and unplug chargers to save overnight.',
    };
  }
  return getDailyStaticTip();
}
