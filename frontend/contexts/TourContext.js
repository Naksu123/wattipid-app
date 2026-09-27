import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useCopilot } from 'react-native-copilot';
import Storage from '../services/storage';
import apiClient from '../services/apiClient';

// Sequences for Tenant and Landlord tours
export const TENANT_TOUR_SEQUENCE = [
  'dashboard',
  'analytics',
  'tips',
  'budget',
  'billing',
  'settings'
];

export const LANDLORD_TOUR_SEQUENCE = [
  'overview',
  'rooms',
  'payments',
  'penalties',
  'audit',
  'notifications',
  'settings'
];

// Screen display titles
export const TOUR_SCREEN_NAMES = {
  // Tenant
  dashboard: 'Home Dashboard',
  analytics: 'Energy Analytics',
  tips: 'Energy-Saving Tips',
  budget: 'Smart Budgeting',
  billing: 'Payment & Billing',
  settings: 'Account Settings',
  // Landlord
  overview: 'Landlord Overview',
  rooms: 'Room Management',
  payments: 'Payments Dashboard',
  penalties: 'Penalty Center',
  audit: 'Audit & Reports',
  notifications: 'Notifications',
};

// Step boundaries for Tenant tour (28 total steps)
export const TENANT_STEP_BOUNDARIES = {
  dashboard: { first: 1, last: 5, firstStepName: 'dashboard_live_sensor' },
  analytics: { first: 6, last: 10, firstStepName: 'analytics_period_selector' },
  tips: { first: 11, last: 14, firstStepName: 'tips_smart_insights' },
  budget: { first: 15, last: 18, firstStepName: 'budget_live' },
  billing: { first: 19, last: 22, firstStepName: 'payment_invoice' },
  settings: { first: 23, last: 28, firstStepName: 'settings_profile' }
};

// Step boundaries for Landlord tour (15 total steps)
export const LANDLORD_STEP_BOUNDARIES = {
  overview: { first: 1, last: 4, firstStepName: 'landlord_live_monitor' },
  rooms: { first: 5, last: 6, firstStepName: 'landlord_rooms_header' },
  payments: { first: 7, last: 8, firstStepName: 'landlord_payments_summary' },
  penalties: { first: 9, last: 10, firstStepName: 'landlord_penalties_summary' },
  audit: { first: 11, last: 11, firstStepName: 'landlord_audit_logs' },
  notifications: { first: 12, last: 12, firstStepName: 'landlord_notifications_center' },
  settings: { first: 13, last: 15, firstStepName: 'landlord_settings_profile' }
};

// All Tenant Tour Steps (28 steps)
export const ALL_TENANT_TOUR_STEPS = [
  // ── Dashboard (1-5) ──
  {
    id: 'dashboard_live_sensor',
    screenId: 'dashboard',
    targetId: 'dashboard_live_sensor',
    order: 1,
    title: 'Live Power Sensor',
    description: 'Displays real-time power (W), voltage, current, and power factor monitored directly from your IoT submeter.'
  },
  {
    id: 'dashboard_live_cost',
    screenId: 'dashboard',
    targetId: 'dashboard_live_cost',
    order: 2,
    title: 'Live Cost Summary',
    description: "Summarizes today's electricity cost and your active billing cycle usage based on live submeter readings."
  },
  {
    id: 'dashboard_budget_tracking',
    screenId: 'dashboard',
    targetId: 'dashboard_budget_tracking',
    order: 3,
    title: 'Daily Budget Tracking',
    description: "Tracks today's energy spending against your daily allowance to help you stay within your designated budget."
  },
  {
    id: 'dashboard_smart_insights',
    screenId: 'dashboard',
    targetId: 'dashboard_smart_insights',
    order: 4,
    title: 'Wattipid Smart Insights',
    description: 'Provides intelligent advice and observations tailored to your ongoing electricity usage patterns.'
  },
  {
    id: 'dashboard_settings_entry',
    screenId: 'dashboard',
    targetId: 'dashboard_settings_entry',
    order: 5,
    title: 'Settings & Notifications',
    description: 'Settings and notifications are located right here beside your profile in the top header, accessible anytime.'
  },

  // ── Analytics (6-10) ──
  {
    id: 'analytics_period_selector',
    screenId: 'analytics',
    targetId: 'analytics_period_selector',
    order: 6,
    title: 'Period Selector',
    description: 'Switch between Daily, Weekly, Monthly, and Yearly analytics to examine your electricity consumption trends.'
  },
  {
    id: 'analytics_consumption',
    screenId: 'analytics',
    targetId: 'analytics_consumption',
    order: 7,
    title: 'Consumption Chart',
    description: 'Visualizes your consumption across intervals with peak highlights. Tap the toggle to switch between kWh and ₱.'
  },
  {
    id: 'analytics_period_summary',
    screenId: 'analytics',
    targetId: 'analytics_period_summary',
    order: 8,
    title: 'Period Comparison',
    description: 'Compares current consumption against the previous cycle, showing percentage changes and cost variance.'
  },
  {
    id: 'analytics_smart_insights',
    screenId: 'analytics',
    targetId: 'analytics_smart_insights',
    order: 9,
    title: 'Forecasted Bill & Insights',
    description: 'Forecasts your end-of-month bill based on current usage pace, comparing it against your designated budget.'
  },
  {
    id: 'analytics_generate_report',
    screenId: 'analytics',
    targetId: 'analytics_generate_report',
    order: 10,
    title: 'Generate PDF Report',
    description: 'Export an official PDF report of your electricity consumption for the selected period to save or review.'
  },

  // ── Tips (11-14) ──
  {
    id: 'tips_smart_insights',
    screenId: 'tips',
    targetId: 'tips_smart_insights',
    order: 11,
    title: 'Smart Insights',
    description: 'Provides personalized tips generated from your real-time submeter data to help optimize your daily habits.'
  },
  {
    id: 'tips_of_the_day',
    screenId: 'tips',
    targetId: 'tips_of_the_day',
    order: 12,
    title: 'Tip of the Day',
    description: 'Features a fresh daily electricity-saving recommendation to help build sustainable energy conservation habits.'
  },
  {
    id: 'tips_general',
    screenId: 'tips',
    targetId: 'tips_general',
    order: 13,
    title: 'Energy-Saving Tips',
    description: 'Explore categorized energy-saving tips across lighting, appliances, cooling, and dorm lifestyle practices.'
  },
  {
    id: 'tips_trending',
    screenId: 'tips',
    targetId: 'tips_trending',
    order: 14,
    title: 'Trending in Dorms',
    description: 'Discover top-voted energy conservation practices popular among other dormitory residents.'
  },

  // ── Budget (15-18) ──
  {
    id: 'budget_live',
    screenId: 'budget',
    targetId: 'budget_live',
    order: 15,
    title: 'Live Budget Gauge',
    description: 'Shows live budget utilization across daily, weekly, and monthly periods with clear status indicators.'
  },
  {
    id: 'budget_edit',
    screenId: 'budget',
    targetId: 'budget_edit',
    order: 16,
    title: 'Edit Budget Limits',
    description: 'Tap here to configure or adjust your monthly spending budget and automatic daily allowance limits.'
  },
  {
    id: 'budget_breakdown',
    screenId: 'budget',
    targetId: 'budget_breakdown',
    order: 17,
    title: 'Budget Breakdown',
    description: 'Shows your preset budget allowance minus current cost used to provide your exact remaining funds.'
  },
  {
    id: 'budget_comparison',
    screenId: 'budget',
    targetId: 'budget_comparison',
    order: 18,
    title: 'Budget Comparison',
    description: 'Compare current spending and consumption against previous days, weeks, or months to spot efficiency gains.'
  },

  // ── Payment / Billing (19-22) ──
  {
    id: 'payment_invoice',
    screenId: 'billing',
    targetId: 'payment_invoice',
    order: 19,
    title: 'Statement Invoice',
    description: 'Displays your official statement invoice identifier, active cycle dates, and current settlement status.'
  },
  {
    id: 'payment_amount_due',
    screenId: 'billing',
    targetId: 'payment_amount_due',
    order: 20,
    title: 'Total Outstanding & Pay',
    description: 'Shows your current total balance due and provides a direct button to submit your payment proof.'
  },
  {
    id: 'payment_history',
    screenId: 'billing',
    targetId: 'payment_history',
    order: 21,
    title: 'Billing History & PDF',
    description: 'Review previous payment receipts and open or export your official billing statement as a PDF.'
  },
  {
    id: 'payment_breakdown',
    screenId: 'billing',
    targetId: 'payment_breakdown',
    order: 22,
    title: 'Billing Breakdown',
    description: 'Itemizes current cycle electricity charges, room rent, penalty fees, and any applied discounts.'
  },

  // ── Settings (23-28) ──
  {
    id: 'settings_profile',
    screenId: 'settings',
    targetId: 'settings_profile',
    order: 23,
    title: 'Tenant Profile',
    description: 'View and update your personal information, room assignment, and contact details.'
  },
  {
    id: 'settings_lease',
    screenId: 'settings',
    targetId: 'settings_lease',
    order: 24,
    title: 'Lease Information',
    description: 'Review details regarding your assigned room, floor, lease start date, and active account status.'
  },
  {
    id: 'settings_notifications',
    screenId: 'settings',
    targetId: 'settings_notifications',
    order: 25,
    title: 'Notification Preferences',
    description: 'Customize alerts for budget limits, high consumption warnings, and upcoming billing due dates.'
  },
  {
    id: 'settings_data_management',
    screenId: 'settings',
    targetId: 'settings_data_management',
    order: 26,
    title: 'Data Management',
    description: 'Manage local data cache and view server API connectivity.'
  },
  {
    id: 'settings_support',
    screenId: 'settings',
    targetId: 'settings_support',
    order: 27,
    title: 'User Manual & Support',
    description: 'Access the complete User Manual, feature guides, or replay this interactive walkthrough anytime.'
  },
  {
    id: 'settings_logout',
    screenId: 'settings',
    targetId: 'settings_logout',
    order: 28,
    title: 'Sign Out Account',
    description: 'Securely sign out of your Wattipid tenant session when finished.'
  }
];

// All Landlord Tour Steps (15 steps)
export const ALL_LANDLORD_TOUR_STEPS = [
  // ── Landlord Overview (1-4) ──
  {
    id: 'landlord_live_monitor',
    screenId: 'overview',
    targetId: 'landlord_live_monitor',
    order: 1,
    title: 'Live Electricity Monitor',
    description: "Monitors overall dormitory energy usage (kWh), live 5-minute peak load, and building electrical capacity."
  },
  {
    id: 'landlord_revenue_summary',
    screenId: 'overview',
    targetId: 'landlord_revenue_summary',
    order: 2,
    title: 'Revenue & Tenant Summary',
    description: 'Summarizes monthly collected revenue, outstanding balances, and total enrolled tenant count.'
  },
  {
    id: 'landlord_occupancy_grid',
    screenId: 'overview',
    targetId: 'landlord_occupancy_grid',
    order: 3,
    title: 'Room Occupancy & Alerts',
    description: 'Provides occupied, available, and maintenance room counts, plus direct alerts for pending verifications.'
  },
  {
    id: 'landlord_header_nav',
    screenId: 'overview',
    targetId: 'landlord_header_nav',
    order: 4,
    title: 'Settings & Notifications',
    description: 'Access the Landlord Control Panel and system notification center directly from the top header.'
  },

  // ── Rooms (5-6) ──
  {
    id: 'landlord_rooms_header',
    screenId: 'rooms',
    targetId: 'landlord_rooms_header',
    order: 5,
    title: 'Room Search & Add Unit',
    description: 'Search units, filter by status (Occupied, Vacant, Maintenance), or tap Add to create a new room.'
  },
  {
    id: 'landlord_room_card',
    screenId: 'rooms',
    targetId: 'landlord_room_card',
    order: 6,
    title: 'Room Cards & Controls',
    description: 'View room power usage, manage tenants, send invitation access codes, or export monthly room PDF reports.'
  },

  // ── Payments (7-8) ──
  {
    id: 'landlord_payments_summary',
    screenId: 'payments',
    targetId: 'landlord_payments_summary',
    order: 7,
    title: 'Payments Dashboard',
    description: 'Review pending payments, verified receipts, and overdue statements using quick status filters.'
  },
  {
    id: 'landlord_pending_verifications',
    screenId: 'payments',
    targetId: 'landlord_pending_verifications',
    order: 8,
    title: 'Payment Verification Workflow',
    description: 'Inspect submitted tenant payments and deposit receipts, then verify or reject submissions with one tap.'
  },

  // ── Penalties (9-10) ──
  {
    id: 'landlord_penalties_summary',
    screenId: 'penalties',
    targetId: 'landlord_penalties_summary',
    order: 9,
    title: 'Penalties & Overdue Overview',
    description: 'Summarizes overdue units, unsettled invoices, active late fees, and total outstanding balances.'
  },
  {
    id: 'landlord_penalties_list',
    screenId: 'penalties',
    targetId: 'landlord_penalties_list',
    order: 10,
    title: 'Overdue Accounts & Reminders',
    description: 'Inspect days overdue, review calculated late penalties, and send reminder notifications to tenants.'
  },

  // ── Audit / Reports (11) ──
  {
    id: 'landlord_audit_logs',
    screenId: 'audit',
    targetId: 'landlord_audit_logs',
    order: 11,
    title: 'Audit Logs & Records',
    description: 'Review compliance logs, billing records, payment verification histories, and system events.'
  },

  // ── Notifications (12) ──
  {
    id: 'landlord_notifications_center',
    screenId: 'notifications',
    targetId: 'landlord_notifications_center',
    order: 12,
    title: 'Notification Center',
    description: 'Receive real-time alerts when tenants submit payments, and tap notifications to jump directly to verification.'
  },

  // ── Settings (13-15) ──
  {
    id: 'landlord_settings_profile',
    screenId: 'settings',
    targetId: 'landlord_settings_profile',
    order: 13,
    title: 'Administrator Profile',
    description: 'Manage landlord administrator credentials, name, and contact information.'
  },
  {
    id: 'landlord_facility_tools',
    screenId: 'settings',
    targetId: 'landlord_facility_tools',
    order: 14,
    title: 'Facility Configuration',
    description: 'Configure electricity billing rates (₱/kWh), penalty grace periods, and dorm energy tips.'
  },
  {
    id: 'landlord_system_config',
    screenId: 'settings',
    targetId: 'landlord_system_config',
    order: 15,
    title: 'System Manual & Tools',
    description: 'Access app guides, hardware wiring documentation, or replay this interactive landlord walkthrough anytime.'
  }
];

// Backward-compatible exports
export const TOUR_SEQUENCE = TENANT_TOUR_SEQUENCE;
export const TOUR_STEP_BOUNDARIES = TENANT_STEP_BOUNDARIES;
export const ALL_TOUR_STEPS = ALL_TENANT_TOUR_STEPS;

const defaultTourContext = {
  tourRole: 'tenant',
  isContinuousTour: false,
  currentTourScreen: null,
  isTourActive: false,
  currentStepOrder: 1,
  totalSteps: 28,
  currentScreen: null,
  currentTargetId: null,
  isNavigating: false,
  isScrolling: false,
  isTargetReady: false,
  transitionLocked: false,
  welcomeModalVisible: false,
  completionModalVisible: false,
  activeUserId: null,
  setWelcomeModalVisible: () => {},
  checkAndPromptOnboarding: async () => {},
  markOnboardingCompleted: async () => {},
  startFullTour: () => {},
  startContinuousTour: () => {},
  startSingleScreenTour: () => {},
  stopTour: () => {},
  skipTour: () => {},
  finishTour: () => {},
  closeCompletionModal: () => {},
  goToNextScreen: () => {},
  goToPrevScreen: () => {},
  signalScreenReady: () => {},
  isScreenReady: () => false,
  registerScrollRef: () => {},
  getScrollRef: () => null,
  registerNextStepHandler: () => {},
  handleTourOverlayPress: () => {},
  activeTourSteps: ALL_TENANT_TOUR_STEPS,
  activeTourBoundaries: TENANT_STEP_BOUNDARIES,
  sequenceTotal: 6,
  sequenceCurrentIndex: 0
};

const TourContext = createContext(defaultTourContext);

export const TourProvider = ({ children }) => {
  const [tourRole, setTourRole] = useState('tenant'); // 'tenant' | 'landlord'
  const [isContinuousTour, setIsContinuousTour] = useState(false);
  const [currentTourScreen, setCurrentTourScreen] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepOrder, setCurrentStepOrder] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const isTargetReady = true;
  const [transitionLocked, setTransitionLocked] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);

  const screenReadySignals = useRef({});
  const nextStepCallbackRef = useRef(null);
  const screenScrollRefs = useRef({});

  // Single-evaluation guard per user session to prevent duplicate prompts
  const evaluatedUsersRef = useRef(new Set());

  // Derive active steps and boundaries based on role
  const activeSequence = tourRole === 'landlord' ? LANDLORD_TOUR_SEQUENCE : TENANT_TOUR_SEQUENCE;
  const activeTourSteps = tourRole === 'landlord' ? ALL_LANDLORD_TOUR_STEPS : ALL_TENANT_TOUR_STEPS;
  const activeTourBoundaries = tourRole === 'landlord' ? LANDLORD_STEP_BOUNDARIES : TENANT_STEP_BOUNDARIES;
  const totalSteps = activeTourSteps.length;

  const registerScrollRef = useCallback((screenName, ref) => {
    if (screenName && ref) {
      screenScrollRefs.current[screenName] = ref;
    }
  }, []);

  const getScrollRef = useCallback((screenName) => {
    return screenScrollRefs.current[screenName] || null;
  }, []);

  const registerNextStepHandler = useCallback((fn) => {
    nextStepCallbackRef.current = fn;
  }, []);

  const handleTourOverlayPress = useCallback(() => {
    if (typeof nextStepCallbackRef.current === 'function') {
      nextStepCallbackRef.current();
    }
  }, []);

  // Check if user genuinely needs first-time onboarding
  const checkAndPromptOnboarding = useCallback(async (userOrId) => {
    if (!userOrId) return;
    
    // Normalize user object vs ID
    const userObj = typeof userOrId === 'object' ? userOrId : { id: userOrId, role: 'tenant' };
    const userId = userObj.id;
    const role = userObj.role === 'landlord' ? 'landlord' : 'tenant';
    
    setActiveUserId(userId);
    setTourRole(role);

    // If already evaluated during this session, do not re-evaluate
    if (evaluatedUsersRef.current.has(userId)) {
      return;
    }
    evaluatedUsersRef.current.add(userId);

    try {
      // 1. Check local storage for this specific user account
      const localCompleted = await Storage.getItem(`onboarding_completed_${userId}`);

      // 2. Determine if the user is genuinely a new account eligible for automatic onboarding:
      const isCompleted = userObj.onboarding_completed === true || 
                          userObj.onboarding_completed === 1 || 
                          userObj.onboarding_completed === '1' || 
                          localCompleted === 'true';
                          
      const isNewUserFlag = userObj.is_new_user === true || 
                            userObj.is_new_user === 1 || 
                            userObj.is_new_user === '1';

      const isGenuinelyNewUser = isNewUserFlag && !isCompleted;

      if (isGenuinelyNewUser) {
        setWelcomeModalVisible(true);
      } else {
        if (localCompleted !== 'true') {
          await Storage.setItem(`onboarding_completed_${userId}`, 'true');
        }
        setWelcomeModalVisible(false);
      }
    } catch (e) {
      console.warn('[TourContext] checkAndPromptOnboarding error:', e);
    }
  }, []);

  const markOnboardingCompleted = useCallback(async (userId) => {
    const uid = userId || activeUserId;
    if (!uid) return;
    try {
      await Storage.setItem(`onboarding_completed_${uid}`, 'true');
      await apiClient.post('/api.php?action=completeOnboarding').catch((err) => {
        console.warn('[TourContext] completeOnboarding backend sync error:', err?.message || err);
      });
    } catch (e) {
      console.warn('[TourContext] markOnboardingCompleted error:', e);
    }
  }, [activeUserId]);

  const startFullTour = useCallback((role = null) => {
    const effectiveRole = role || tourRole || 'tenant';
    setTourRole(effectiveRole);
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(true);
    setIsTourActive(true);
    setCurrentStepOrder(1);
    setIsNavigating(false);
    setIsScrolling(false);
    setTransitionLocked(false);
    
    const seq = effectiveRole === 'landlord' ? LANDLORD_TOUR_SEQUENCE : TENANT_TOUR_SEQUENCE;
    const firstScreen = seq[0];
    setCurrentTourScreen(firstScreen);
    screenReadySignals.current = {};
    
    const basePath = effectiveRole === 'landlord' ? '/(landlord)' : '/(tenant)';
    router.replace(`${basePath}/${firstScreen}`);
  }, [tourRole]);

  const startSingleScreenTour = useCallback((screenName, role = null) => {
    const effectiveRole = role || tourRole || 'tenant';
    setTourRole(effectiveRole);
    const seq = effectiveRole === 'landlord' ? LANDLORD_TOUR_SEQUENCE : TENANT_TOUR_SEQUENCE;
    const boundaries = effectiveRole === 'landlord' ? LANDLORD_STEP_BOUNDARIES : TENANT_STEP_BOUNDARIES;
    
    if (!seq.includes(screenName)) return;
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(false);
    setIsTourActive(true);
    
    const boundary = boundaries[screenName];
    if (boundary) {
      setCurrentStepOrder(boundary.first);
    }
    setIsNavigating(false);
    setIsScrolling(false);
    setTransitionLocked(false);
    setCurrentTourScreen(screenName);
    screenReadySignals.current = {};
    
    const basePath = effectiveRole === 'landlord' ? '/(landlord)' : '/(tenant)';
    const navPath = (effectiveRole === 'tenant' && screenName === 'billing') ? `${basePath}/billing` : `${basePath}/${screenName}`;
    router.replace(navPath);
  }, [tourRole]);

  const stopTour = useCallback((markComplete = false) => {
    setIsContinuousTour(false);
    setIsTourActive(false);
    setCurrentTourScreen(null);
    setIsNavigating(false);
    setIsScrolling(false);
    setTransitionLocked(false);
    screenReadySignals.current = {};
    if (markComplete && activeUserId) {
      markOnboardingCompleted(activeUserId);
    }
  }, [activeUserId, markOnboardingCompleted]);

  const skipTour = useCallback(() => {
    setWelcomeModalVisible(false);
    stopTour(true);
  }, [stopTour]);

  const finishTour = useCallback(() => {
    stopTour(true);
    setCompletionModalVisible(true);
  }, [stopTour]);

  const closeCompletionModal = useCallback(() => {
    setCompletionModalVisible(false);
    const returnPath = tourRole === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard';
    router.replace(returnPath);
  }, [tourRole]);

  const goToNextScreen = useCallback(() => {
    if (!isContinuousTour || !currentTourScreen) {
      return finishTour();
    }

    const seq = tourRole === 'landlord' ? LANDLORD_TOUR_SEQUENCE : TENANT_TOUR_SEQUENCE;
    const boundaries = tourRole === 'landlord' ? LANDLORD_STEP_BOUNDARIES : TENANT_STEP_BOUNDARIES;
    const basePath = tourRole === 'landlord' ? '/(landlord)' : '/(tenant)';
    
    const currentIndex = seq.indexOf(currentTourScreen);
    if (currentIndex < seq.length - 1) {
      const nextScreen = seq[currentIndex + 1];
      const nextBoundary = boundaries[nextScreen];
      if (nextBoundary) {
        setCurrentStepOrder(nextBoundary.first);
      }
      setIsNavigating(true);
      setCurrentTourScreen(nextScreen);
      
      const navPath = (tourRole === 'tenant' && nextScreen === 'billing') ? `${basePath}/billing` : `${basePath}/${nextScreen}`;
      router.replace(navPath);
    } else {
      // Reached the end of full tour!
      finishTour();
    }
  }, [isContinuousTour, currentTourScreen, tourRole, finishTour]);

  const goToPrevScreen = useCallback(() => {
    if (!isContinuousTour || !currentTourScreen) return stopTour();

    const seq = tourRole === 'landlord' ? LANDLORD_TOUR_SEQUENCE : TENANT_TOUR_SEQUENCE;
    const boundaries = tourRole === 'landlord' ? LANDLORD_STEP_BOUNDARIES : TENANT_STEP_BOUNDARIES;
    const basePath = tourRole === 'landlord' ? '/(landlord)' : '/(tenant)';

    const currentIndex = seq.indexOf(currentTourScreen);
    if (currentIndex > 0) {
      const prevScreen = seq[currentIndex - 1];
      const prevBoundary = boundaries[prevScreen];
      if (prevBoundary) {
        setCurrentStepOrder(prevBoundary.last);
      }
      setIsNavigating(true);
      setCurrentTourScreen(prevScreen);
      
      const navPath = (tourRole === 'tenant' && prevScreen === 'billing') ? `${basePath}/billing` : `${basePath}/${prevScreen}`;
      router.replace(navPath);
    } else {
      stopTour();
    }
  }, [isContinuousTour, currentTourScreen, tourRole, stopTour]);

  const signalScreenReady = useCallback((screenName) => {
    screenReadySignals.current[screenName] = true;
    setIsNavigating(prev => (prev ? false : prev));
  }, []);

  const isScreenReady = useCallback((screenName) => {
    return !!screenReadySignals.current[screenName];
  }, []);

  const currentStepObj = activeTourSteps.find(s => s.order === currentStepOrder) || activeTourSteps[0];

  const contextValue = React.useMemo(() => ({
    tourRole,
    setTourRole,
    isContinuousTour,
    currentTourScreen,
    isTourActive,
    currentStep: currentStepObj,
    currentStepOrder,
    setCurrentStepOrder,
    totalSteps,
    currentScreen: currentTourScreen,
    currentTargetId: currentStepObj?.targetId,
    isNavigating,
    setIsNavigating,
    isScrolling,
    setIsScrolling,
    isTargetReady,
    transitionLocked,
    setTransitionLocked,
    welcomeModalVisible,
    completionModalVisible,
    activeUserId,
    setWelcomeModalVisible,
    checkAndPromptOnboarding,
    markOnboardingCompleted,
    startFullTour,
    startContinuousTour: startFullTour,
    startSingleScreenTour,
    stopTour,
    skipTour,
    finishTour,
    closeCompletionModal,
    goToNextScreen,
    goToPrevScreen,
    signalScreenReady,
    isScreenReady,
    registerScrollRef,
    getScrollRef,
    registerNextStepHandler,
    handleTourOverlayPress,
    activeTourSteps,
    activeTourBoundaries,
    sequenceTotal: activeSequence.length,
    sequenceCurrentIndex: currentTourScreen ? activeSequence.indexOf(currentTourScreen) + 1 : 0
  }), [
    tourRole,
    setTourRole,
    isContinuousTour,
    currentTourScreen,
    isTourActive,
    currentStepObj,
    currentStepOrder,
    setCurrentStepOrder,
    totalSteps,
    isNavigating,
    setIsNavigating,
    isScrolling,
    setIsScrolling,
    isTargetReady,
    transitionLocked,
    setTransitionLocked,
    welcomeModalVisible,
    completionModalVisible,
    activeUserId,
    setWelcomeModalVisible,
    checkAndPromptOnboarding,
    markOnboardingCompleted,
    startFullTour,
    startSingleScreenTour,
    stopTour,
    skipTour,
    finishTour,
    closeCompletionModal,
    goToNextScreen,
    goToPrevScreen,
    signalScreenReady,
    isScreenReady,
    registerScrollRef,
    getScrollRef,
    registerNextStepHandler,
    handleTourOverlayPress,
    activeTourSteps,
    activeTourBoundaries,
    activeSequence
  ]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  return context || defaultTourContext;
};

export const useTourAutoStart = (screenName, isScreenLoaded, scrollViewRef = null, role = null) => {
  const { 
    currentTourScreen, 
    isTourActive, 
    signalScreenReady, 
    registerScrollRef, 
    tourRole,
    setTourRole,
    activeTourBoundaries 
  } = useTourContext();
  
  const copilot = useCopilot();
  const copilotRef = useRef(copilot);
  copilotRef.current = copilot;

  const hasStartedScreenRef = useRef(null);

  // Sync role if explicitly provided and tour is active
  useEffect(() => {
    if (role && role !== tourRole && isTourActive) {
      setTourRole(role);
    }
  }, [role, tourRole, isTourActive, setTourRole]);

  useEffect(() => {
    if (scrollViewRef && scrollViewRef.current) {
      // If flatlist, ensure scrollTo exists so Copilot can scroll it smoothly
      if (!scrollViewRef.current.scrollTo && typeof scrollViewRef.current.scrollToOffset === 'function') {
        scrollViewRef.current.scrollTo = ({ y, animated = true }) => {
          scrollViewRef.current.scrollToOffset({ offset: y, animated });
        };
      }
      registerScrollRef(screenName, scrollViewRef);
    }
  }, [screenName, scrollViewRef, registerScrollRef]);

  // 1. Signal readiness when screen is loaded
  useEffect(() => {
    if (isTourActive && currentTourScreen === screenName && isScreenLoaded) {
      signalScreenReady(screenName);
    }
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded, signalScreenReady]);

  // 2. Start Copilot overlay once when screen is loaded
  useEffect(() => {
    if (!isTourActive || currentTourScreen !== screenName) {
      hasStartedScreenRef.current = null;
      return;
    }

    if (!isScreenLoaded) {
      return;
    }

    if (hasStartedScreenRef.current === screenName) {
      return;
    }
    hasStartedScreenRef.current = screenName;

    let isMounted = true;
    
    // Determine boundaries for current screen
    const boundary = activeTourBoundaries[screenName] || 
                     (tourRole === 'landlord' ? LANDLORD_STEP_BOUNDARIES[screenName] : TENANT_STEP_BOUNDARIES[screenName]);
    const targetStepName = boundary?.firstStepName;

    // Reset scroll to top immediately if scroll ref is available
    if (scrollViewRef?.current?.scrollTo) {
      try {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
        if (scrollViewRef.current._scrollY !== undefined) {
          scrollViewRef.current._scrollY = 0;
        }
      } catch (_e) {}
    }

    const timer = setTimeout(() => {
      if (!isMounted) return;
      const scrollEl = (scrollViewRef && scrollViewRef.current) ? scrollViewRef.current : null;
      const currentStartFn = copilotRef.current?.start;
      
      if (typeof currentStartFn === 'function') {
        currentStartFn(targetStepName, scrollEl);
      }
    }, 240);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded, scrollViewRef, activeTourBoundaries, tourRole]);
};
