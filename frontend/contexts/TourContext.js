import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useCopilot } from 'react-native-copilot';
import Storage from '../services/storage';
import apiClient from '../services/apiClient';

// The exact sequence of screens in the continuous tour
export const TOUR_SEQUENCE = [
  'dashboard',
  'analytics',
  'tips',
  'budget',
  'billing', // using 'billing' because route is /billing/index
  'settings'
];

export const TOUR_SCREEN_NAMES = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  tips: 'Tips',
  budget: 'Budget',
  billing: 'Payment',
  settings: 'Settings'
};

export const TOUR_STEP_BOUNDARIES = {
  dashboard: { first: 1, last: 3, firstStepName: 'dashboard_live_sensor' },
  analytics: { first: 4, last: 8, firstStepName: 'analytics_period_selector' },
  tips: { first: 9, last: 11, firstStepName: 'tips_general' },
  budget: { first: 12, last: 14, firstStepName: 'budget_live' },
  billing: { first: 15, last: 18, firstStepName: 'payment_invoice' },
  settings: { first: 19, last: 23, firstStepName: 'settings_profile' }
};

export const ALL_TOUR_STEPS = [
  // Dashboard (1-3)
  {
    id: 'dashboard_live_sensor',
    screenId: 'dashboard',
    targetId: 'dashboard_live_sensor',
    order: 1,
    title: 'Live Sensor',
    description: 'This section displays your latest electricity monitoring data, including real-time power, voltage, current, and power factor.'
  },
  {
    id: 'dashboard_live_cost',
    screenId: 'dashboard',
    targetId: 'dashboard_live_cost',
    order: 2,
    title: 'Live Cost',
    description: "This section shows your current electricity-related cost and today's energy consumption based on the latest available monitoring data."
  },
  {
    id: 'dashboard_smart_insights',
    screenId: 'dashboard',
    targetId: 'dashboard_smart_insights',
    order: 3,
    title: 'Wattipid Smart Insights',
    description: 'Wattipid Smart Insights provides useful information and recommendations based on your electricity consumption patterns and behavior.'
  },

  // Analytics (4-8)
  {
    id: 'analytics_period_selector',
    screenId: 'analytics',
    targetId: 'analytics_period_selector',
    order: 4,
    title: 'Period Selector',
    description: 'Use these tabs to switch between daily, weekly, monthly, and yearly electricity analytics.'
  },
  {
    id: 'analytics_period_summary',
    screenId: 'analytics',
    targetId: 'analytics_period_summary',
    order: 5,
    title: 'Period Summary',
    description: 'This section summarizes your electricity consumption and cost for the selected period, including the daily average.'
  },
  {
    id: 'analytics_consumption',
    screenId: 'analytics',
    targetId: 'analytics_consumption',
    order: 6,
    title: 'Electricity Consumption',
    description: 'This section visualizes your electricity consumption and lets you review your data through Charts, Breakdown, and History.'
  },
  {
    id: 'analytics_smart_insights',
    screenId: 'analytics',
    targetId: 'analytics_smart_insights',
    order: 7,
    title: 'Wattipid Smart Insights',
    description: 'Smart Insights analyzes your consumption patterns and provides useful recommendations based on your electricity usage.'
  },
  {
    id: 'analytics_generate_report',
    screenId: 'analytics',
    targetId: 'analytics_generate_report',
    order: 8,
    title: 'Generate Report',
    description: 'Generate a report for the selected period to review and keep a record of your electricity consumption.'
  },

  // Tips (9-11)
  {
    id: 'tips_general',
    screenId: 'tips',
    targetId: 'tips_general',
    order: 9,
    title: 'General Tips',
    description: 'This section provides electricity-saving recommendations designed to help you understand and improve your electricity consumption behavior.'
  },
  {
    id: 'tips_of_the_day',
    screenId: 'tips',
    targetId: 'tips_of_the_day',
    order: 10,
    title: 'Tip of the Day',
    description: 'Tip of the Day provides a daily electricity-saving recommendation to help you develop better energy-saving habits.'
  },
  {
    id: 'tips_trending',
    screenId: 'tips',
    targetId: 'tips_trending',
    order: 11,
    title: 'Trending in Dorms',
    description: 'This section presents useful electricity-saving trends or practices among dorm users.'
  },

  // Budget (12-14)
  {
    id: 'budget_live',
    screenId: 'budget',
    targetId: 'budget_live',
    order: 12,
    title: 'Live Budget',
    description: 'Live Budget shows how much of your electricity budget has been used and helps you monitor your current budget status.'
  },
  {
    id: 'budget_breakdown',
    screenId: 'budget',
    targetId: 'budget_breakdown',
    order: 13,
    title: 'Budget Breakdown',
    description: 'Budget Breakdown shows how your electricity budget is being used across the available periods.'
  },
  {
    id: 'budget_comparison',
    screenId: 'budget',
    targetId: 'budget_comparison',
    order: 14,
    title: 'Budget Comparison',
    description: 'Budget Comparison allows you to compare your electricity consumption or budget performance across different periods.'
  },

  // Payment (15-18)
  {
    id: 'payment_invoice',
    screenId: 'billing',
    targetId: 'payment_invoice',
    order: 15,
    title: 'Invoice Number',
    description: 'Invoice Number displays your billing identifier and current payment status.'
  },
  {
    id: 'payment_amount_due',
    screenId: 'billing',
    targetId: 'payment_amount_due',
    order: 16,
    title: 'Amount Due',
    description: 'Amount Due shows your current billing balance, due date, and quick payment options.'
  },
  {
    id: 'payment_history',
    screenId: 'billing',
    targetId: 'payment_history',
    order: 17,
    title: 'Payment History',
    description: 'Billing History lets you review previous billing records, while View PDF opens the detailed billing document.'
  },
  {
    id: 'payment_breakdown',
    screenId: 'billing',
    targetId: 'payment_breakdown',
    order: 18,
    title: 'Billing Breakdown',
    description: 'Billing Breakdown shows the components that make up your bill, including applicable electricity charges, penalties, and other configured charges.'
  },

  // Settings (19-23)
  {
    id: 'settings_profile',
    screenId: 'settings',
    targetId: 'settings_profile',
    order: 19,
    title: 'Profile',
    description: 'Profile lets you view and manage your Wattipid account information.'
  },
  {
    id: 'settings_lease',
    screenId: 'settings',
    targetId: 'settings_lease',
    order: 20,
    title: 'Lease Information',
    description: 'Lease Information contains important information related to your room or rental arrangement.'
  },
  {
    id: 'settings_notifications',
    screenId: 'settings',
    targetId: 'settings_notifications',
    order: 21,
    title: 'Notifications',
    description: 'Notification settings help you manage important Wattipid alerts and updates.'
  },
  {
    id: 'settings_data_management',
    screenId: 'settings',
    targetId: 'settings_data_management',
    order: 22,
    title: 'Data Management',
    description: 'Data Management provides controls for managing your account and related application data.'
  },
  {
    id: 'settings_support',
    screenId: 'settings',
    targetId: 'settings_support',
    order: 23,
    title: 'Support',
    description: 'Support provides help and access to the Wattipid User Manual.'
  }
];

const defaultTourContext = {
  isContinuousTour: false,
  currentTourScreen: null,
  isTourActive: false,
  currentStepOrder: 1,
  totalSteps: 23,
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
  sequenceTotal: 6,
  sequenceCurrentIndex: 0
};

const TourContext = createContext(defaultTourContext);

export const TourProvider = ({ children }) => {
  const [isContinuousTour, setIsContinuousTour] = useState(false);
  const [currentTourScreen, setCurrentTourScreen] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepOrder, setCurrentStepOrder] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isTargetReady, setIsTargetReady] = useState(false);
  const [transitionLocked, setTransitionLocked] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);

  const screenReadySignals = useRef({});
  const nextStepCallbackRef = useRef(null);
  const screenScrollRefs = useRef({});

  // Single-evaluation guard per user session to prevent duplicate prompts
  const evaluatedUsersRef = useRef(new Set());

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
    if (!userId || userObj.role !== 'tenant') return;
    
    setActiveUserId(userId);

    // If already evaluated during this session, do not re-evaluate
    if (evaluatedUsersRef.current.has(userId)) {
      return;
    }
    evaluatedUsersRef.current.add(userId);

    try {
      // 1. Check local storage for this specific user account
      const localCompleted = await Storage.getItem(`onboarding_completed_${userId}`);

      // 2. Determine if the user is genuinely a new account eligible for automatic onboarding:
      // An account MUST be explicitly flagged as a new user (is_new_user === true or 1),
      // MUST NOT have completed onboarding in the database,
      // AND MUST NOT have a local completed flag.
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
        // Ensure local storage is synced for legacy or existing accounts
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
      // 1. Save locally per user ID
      await Storage.setItem(`onboarding_completed_${uid}`, 'true');
      
      // 2. Persist to backend database for permanent sync across devices/logins
      await apiClient.post('/api.php?action=completeOnboarding').catch((err) => {
        console.warn('[TourContext] completeOnboarding backend sync error:', err?.message || err);
      });
    } catch (e) {
      console.warn('[TourContext] markOnboardingCompleted error:', e);
    }
  }, [activeUserId]);

  const startFullTour = useCallback(() => {
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(true);
    setIsTourActive(true);
    setCurrentStepOrder(1);
    setIsNavigating(false);
    setIsScrolling(false);
    setTransitionLocked(false);
    setCurrentTourScreen(TOUR_SEQUENCE[0]);
    screenReadySignals.current = {};
    router.replace(`/(tenant)/${TOUR_SEQUENCE[0]}`);
  }, []);

  const startSingleScreenTour = useCallback((screenName) => {
    if (!TOUR_SEQUENCE.includes(screenName)) return;
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(false);
    setIsTourActive(true);
    const boundary = TOUR_STEP_BOUNDARIES[screenName];
    if (boundary) {
      setCurrentStepOrder(boundary.first);
    }
    setIsNavigating(false);
    setIsScrolling(false);
    setTransitionLocked(false);
    setCurrentTourScreen(screenName);
    screenReadySignals.current = {};
    router.replace(`/(tenant)/${screenName}`);
  }, []);

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
    router.replace('/(tenant)/dashboard');
  }, []);

  const goToNextScreen = useCallback(() => {
    if (!isContinuousTour || !currentTourScreen) {
      return finishTour();
    }

    const currentIndex = TOUR_SEQUENCE.indexOf(currentTourScreen);
    if (currentIndex < TOUR_SEQUENCE.length - 1) {
      const nextScreen = TOUR_SEQUENCE[currentIndex + 1];
      const nextBoundary = TOUR_STEP_BOUNDARIES[nextScreen];
      if (nextBoundary) {
        setCurrentStepOrder(nextBoundary.first);
      }
      setIsNavigating(true);
      setCurrentTourScreen(nextScreen);
      router.replace(`/(tenant)/${nextScreen}`);
    } else {
      // Reached the end of full tour!
      finishTour();
    }
  }, [isContinuousTour, currentTourScreen, finishTour]);

  const goToPrevScreen = useCallback(() => {
    if (!isContinuousTour || !currentTourScreen) return stopTour();

    const currentIndex = TOUR_SEQUENCE.indexOf(currentTourScreen);
    if (currentIndex > 0) {
      const prevScreen = TOUR_SEQUENCE[currentIndex - 1];
      const prevBoundary = TOUR_STEP_BOUNDARIES[prevScreen];
      if (prevBoundary) {
        setCurrentStepOrder(prevBoundary.last);
      }
      setIsNavigating(true);
      setCurrentTourScreen(prevScreen);
      router.replace(`/(tenant)/${prevScreen}`);
    } else {
      stopTour();
    }
  }, [isContinuousTour, currentTourScreen, stopTour]);

  const signalScreenReady = useCallback((screenName) => {
    screenReadySignals.current[screenName] = true;
    setIsTargetReady(true);
    setIsNavigating(false);
  }, []);

  const isScreenReady = useCallback((screenName) => {
    return !!screenReadySignals.current[screenName];
  }, []);

  const currentStepObj = ALL_TOUR_STEPS.find(s => s.order === currentStepOrder) || ALL_TOUR_STEPS[0];

  return (
    <TourContext.Provider
      value={{
        isContinuousTour,
        currentTourScreen,
        isTourActive,
        currentStep: currentStepObj,
        currentStepOrder,
        setCurrentStepOrder,
        totalSteps: 23,
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
        startContinuousTour: startFullTour, // Alias for backward compatibility
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
        sequenceTotal: TOUR_SEQUENCE.length,
        sequenceCurrentIndex: currentTourScreen ? TOUR_SEQUENCE.indexOf(currentTourScreen) + 1 : 0
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  return context || defaultTourContext;
};

export const useTourAutoStart = (screenName, isScreenLoaded, scrollViewRef = null) => {
  const { currentTourScreen, isTourActive, signalScreenReady, registerScrollRef } = useTourContext();
  const copilot = useCopilot();
  const copilotRef = useRef(copilot);
  copilotRef.current = copilot;

  useEffect(() => {
    if (scrollViewRef && scrollViewRef.current) {
      registerScrollRef(screenName, scrollViewRef);
    }
  }, [screenName, scrollViewRef, registerScrollRef]);

  // 1. Signal readiness when screen is loaded
  useEffect(() => {
    if (isTourActive && currentTourScreen === screenName && isScreenLoaded) {
      signalScreenReady(screenName);
    }
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded, signalScreenReady]);

  // 2. Start Copilot overlay when aligned and retry with fresh copilot reference
  useEffect(() => {
    if (!isTourActive || currentTourScreen !== screenName || !isScreenLoaded) {
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 20;
    const boundary = TOUR_STEP_BOUNDARIES[screenName];
    const targetStepName = boundary?.firstStepName;

    // If starting on settings, reset scroll to top immediately
    if (screenName === 'settings' && scrollViewRef?.current?.scrollTo) {
      try {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
        if (scrollViewRef.current._scrollY !== undefined) {
          scrollViewRef.current._scrollY = 0;
        }
      } catch (_e) {}
    }

    const tryStart = () => {
      if (!isMounted) return;
      
      const scrollEl = (scrollViewRef && scrollViewRef.current) ? scrollViewRef.current : null;
      const currentStartFn = copilotRef.current?.start;
      
      if (typeof currentStartFn === 'function') {
        currentStartFn(targetStepName, scrollEl);
      }

      attempts++;
      if (attempts < maxAttempts && !copilotRef.current?.visible) {
        setTimeout(tryStart, 150);
      }
    };

    const timer = setTimeout(tryStart, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded, scrollViewRef]);
};
