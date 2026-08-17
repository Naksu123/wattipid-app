import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';

// The exact sequence of screens in the continuous tour
export const TOUR_SEQUENCE = [
  'dashboard',
  'analytics',
  'tips',
  'budget',
  'billing', // using 'billing' instead of 'payment' because the route is /billing/index
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
  dashboard: { first: 1, last: 2, firstStepName: 'sensor' },
  analytics: { first: 3, last: 4, firstStepName: 'periodTabs' },
  tips: { first: 5, last: 6, firstStepName: 'tabs' },
  budget: { first: 7, last: 8, firstStepName: 'overview' },
  billing: { first: 9, last: 10, firstStepName: 'amountDue' },
  settings: { first: 11, last: 12, firstStepName: 'profile' }
};

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  const [isContinuousTour, setIsContinuousTour] = useState(false);
  const [currentTourScreen, setCurrentTourScreen] = useState(null);
  
  // Track if we are actively attempting to mount a tour step
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Track readiness signals from screens
  const screenReadySignals = useRef({});

  const startContinuousTour = useCallback(() => {
    setIsContinuousTour(true);
    setIsTourActive(true);
    setCurrentTourScreen(TOUR_SEQUENCE[0]);
    // reset signals
    screenReadySignals.current = {};
    router.replace(`/(tenant)/${TOUR_SEQUENCE[0]}`);
  }, []);

  const stopTour = useCallback(() => {
    setIsContinuousTour(false);
    setIsTourActive(false);
    setCurrentTourScreen(null);
    screenReadySignals.current = {};
  }, []);

  const goToNextScreen = useCallback(() => {
    if (!isContinuousTour || !currentTourScreen) return stopTour();
    
    const currentIndex = TOUR_SEQUENCE.indexOf(currentTourScreen);
    if (currentIndex < TOUR_SEQUENCE.length - 1) {
      const nextScreen = TOUR_SEQUENCE[currentIndex + 1];
      setCurrentTourScreen(nextScreen);
      // We use push to safely transition, but replacing prevents the user from having 6 screens to 'back' out of.
      // Replacing is cleaner for a continuous wizard-like experience.
      router.replace(`/(tenant)/${nextScreen}`);
    } else {
      stopTour();
    }
  }, [isContinuousTour, currentTourScreen, stopTour]);

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

  // Screens call this to announce they are mounted, data is loaded, and they are ready for the overlay
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
        startContinuousTour,
        stopTour,
        goToNextScreen,
        goToPrevScreen,
        signalScreenReady,
        isScreenReady,
        sequenceTotal: TOUR_SEQUENCE.length,
        sequenceCurrentIndex: currentTourScreen ? TOUR_SEQUENCE.indexOf(currentTourScreen) + 1 : 0
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);

import { useEffect } from 'react';
import { useCopilot } from 'react-native-copilot';

export const useTourAutoStart = (screenName, isScreenLoaded) => {
  const { currentTourScreen, isTourActive, signalScreenReady } = useTourContext();
  const { start } = useCopilot();

  // 1. Signal readiness when the screen data is loaded
  useEffect(() => {
    if (isTourActive && currentTourScreen === screenName && isScreenLoaded) {
      signalScreenReady(screenName);
    }
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded, signalScreenReady]);

  // 2. Start Copilot when everything aligns
  useEffect(() => {
    if (isTourActive && currentTourScreen === screenName && isScreenLoaded) {
      // Small delay to ensure layout is measured and animations are settled
      const timeoutId = setTimeout(() => {
        start();
      }, 700);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive, currentTourScreen, screenName, isScreenLoaded]);
};
