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
  dashboard: { first: 1, last: 3, firstStepName: 'dashboard_sensor' },
  analytics: { first: 4, last: 8, firstStepName: 'analytics_periodSelector' },
  tips: { first: 9, last: 11, firstStepName: 'tips_general' },
  budget: { first: 12, last: 14, firstStepName: 'budget_live' },
  billing: { first: 15, last: 18, firstStepName: 'billing_invoice' },
  settings: { first: 19, last: 23, firstStepName: 'settings_profile' }
};

const defaultTourContext = {
  isContinuousTour: false,
  currentTourScreen: null,
  isTourActive: false,
  welcomeModalVisible: false,
  completionModalVisible: false,
  activeUserId: null,
  setWelcomeModalVisible: () => {},
  checkAndPromptOnboarding: async () => {},
  markOnboardingCompleted: async () => {},
  startFullTour: () => {},
  startContinuousTour: () => {},
  startQuickTour: () => {},
  startSingleScreenTour: () => {},
  stopTour: () => {},
  skipTour: () => {},
  finishTour: () => {},
  closeCompletionModal: () => {},
  goToNextScreen: () => {},
  goToPrevScreen: () => {},
  signalScreenReady: () => {},
  isScreenReady: () => false,
  sequenceTotal: 6,
  sequenceCurrentIndex: 0
};

const TourContext = createContext(defaultTourContext);

export const TourProvider = ({ children }) => {
  const [isContinuousTour, setIsContinuousTour] = useState(false);
  const [currentTourScreen, setCurrentTourScreen] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);

  const screenReadySignals = useRef({});
  const nextStepCallbackRef = useRef(null);

  // Single-evaluation guard per user session to prevent duplicate prompts
  const evaluatedUsersRef = useRef(new Set());

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

      // Temporary debug logging
      console.log(`[Onboarding] User ID: ${userId}`);
      console.log(`[Onboarding] Is new user: ${userObj.is_new_user === true}`);
      console.log(`[Onboarding] Onboarding completed: ${userObj.onboarding_completed === true || localCompleted === 'true'}`);
      console.log(`[Onboarding] Legacy account: ${userObj.is_new_user !== true}`);

      // 2. Determine if the user is genuinely a new account eligible for automatic onboarding:
      // An account MUST be explicitly flagged as a new user (is_new_user === true),
      // MUST NOT have completed onboarding in the database,
      // AND MUST NOT have a local completed flag.
      const isCompleted = userObj.onboarding_completed === true || localCompleted === 'true';
      const isGenuinelyNewUser = userObj.is_new_user === true && !isCompleted;

      console.log(`[Onboarding] Automatic tour allowed: ${isGenuinelyNewUser}`);

      if (isGenuinelyNewUser) {
        console.log('[Onboarding] Starting Quick Tour: Showing Welcome Modal');
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
      console.log(`[Onboarding] Saved onboarding completion for user ${uid}`);
    } catch (e) {
      console.warn('[TourContext] markOnboardingCompleted error:', e);
    }
  }, [activeUserId]);

  const startFullTour = useCallback(() => {
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(true);
    setIsTourActive(true);
    setCurrentTourScreen(TOUR_SEQUENCE[0]);
    screenReadySignals.current = {};
    router.replace(`/(tenant)/${TOUR_SEQUENCE[0]}`);
  }, []);

  const startQuickTour = useCallback(() => {
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(false);
    setIsTourActive(true);
    setCurrentTourScreen('dashboard');
    screenReadySignals.current = {};
    router.replace('/(tenant)/dashboard');
  }, []);

  const startSingleScreenTour = useCallback((screenName) => {
    if (!TOUR_SEQUENCE.includes(screenName)) return;
    setWelcomeModalVisible(false);
    setCompletionModalVisible(false);
    setIsContinuousTour(false);
    setIsTourActive(true);
    setCurrentTourScreen(screenName);
    screenReadySignals.current = {};
    router.replace(`/(tenant)/${screenName}`);
  }, []);

  const stopTour = useCallback((markComplete = false) => {
    setIsContinuousTour(false);
    setIsTourActive(false);
    setCurrentTourScreen(null);
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
      setCurrentTourScreen(prevScreen);
      router.replace(`/(tenant)/${prevScreen}`);
    } else {
      stopTour();
    }
  }, [isContinuousTour, currentTourScreen, stopTour]);

  const signalScreenReady = useCallback((screenName) => {
    screenReadySignals.current[screenName] = true;
  }, []);

  const isScreenReady = useCallback((screenName) => {
    return !!screenReadySignals.current[screenName];
  }, []);

  return (
    <TourContext.Provider
      value={{
        isContinuousTour,
        currentTourScreen,
        isTourActive,
        welcomeModalVisible,
        completionModalVisible,
        activeUserId,
        setWelcomeModalVisible,
        checkAndPromptOnboarding,
        markOnboardingCompleted,
        startFullTour,
        startContinuousTour: startFullTour, // Alias for backward compatibility
        startQuickTour,
        startSingleScreenTour,
        stopTour,
        skipTour,
        finishTour,
        closeCompletionModal,
        goToNextScreen,
        goToPrevScreen,
        signalScreenReady,
        isScreenReady,
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
  const { currentTourScreen, isTourActive, signalScreenReady } = useTourContext();
  const copilot = useCopilot();
  const copilotRef = useRef(copilot);
  copilotRef.current = copilot;

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
    const maxAttempts = 15;
    const boundary = TOUR_STEP_BOUNDARIES[screenName];
    const targetStepName = boundary?.firstStepName;

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
