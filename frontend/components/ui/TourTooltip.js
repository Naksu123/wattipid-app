import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext, TOUR_SCREEN_NAMES, TOUR_STEP_BOUNDARIES, ALL_TOUR_STEPS } from '../../contexts/TourContext';
import { useCopilot } from 'react-native-copilot';

export const CustomTooltip = () => {
  const { goToNext, stop, isLastStep, currentStep } = useCopilot();
  const { 
    isContinuousTour, 
    currentTourScreen, 
    goToNextScreen, 
    stopTour,
    finishTour,
    registerNextStepHandler,
    setCurrentStepOrder
  } = useTourContext();

  const currentScreenBoundary = currentTourScreen ? TOUR_STEP_BOUNDARIES[currentTourScreen] : null;
  const isScreenLastStep = !!isLastStep || (currentScreenBoundary ? currentStep?.order === currentScreenBoundary.last : false);

  const globalStepOrder = currentStep?.order || 1;
  const matchedStepDef = ALL_TOUR_STEPS.find(s => s.order === globalStepOrder || s.targetId === currentStep?.name);
  const stepTitle = matchedStepDef?.title || (currentTourScreen ? TOUR_SCREEN_NAMES[currentTourScreen] : 'Wattipid Guide');

  // Debounce transition lock to prevent double-skipping or rapid click bugs
  const lastPressRef = useRef(0);
  const isLockedRef = useRef(false);

  const handleNextPress = useCallback(() => {
    const now = Date.now();
    if (isLockedRef.current || now - lastPressRef.current < 450) {
      return;
    }
    isLockedRef.current = true;
    lastPressRef.current = now;

    setTimeout(() => {
      isLockedRef.current = false;
    }, 450);

    if (isScreenLastStep) {
      stop(); // clean up current overlay
      if (isContinuousTour) {
        setTimeout(() => goToNextScreen(), 120);
      } else {
        finishTour();
      }
    } else {
      goToNext();
      setCurrentStepOrder(globalStepOrder + 1);
    }
  }, [isScreenLastStep, stop, isContinuousTour, goToNextScreen, finishTour, goToNext, globalStepOrder, setCurrentStepOrder]);

  // Register the single source of truth next handler with TourContext
  useEffect(() => {
    registerNextStepHandler(handleNextPress);
    return () => {
      registerNextStepHandler(null);
    };
  }, [handleNextPress, registerNextStepHandler]);

  const handleSkipPress = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    stop();
    stopTour(true);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.96} 
      onPress={handleNextPress} 
      style={styles.tooltipContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={COLORS.primary} />
          <Text style={styles.title} numberOfLines={1}>{stepTitle}</Text>
        </View>
        
        <View style={styles.macroProgress}>
          <Text style={styles.macroProgressText}>
            Step {globalStepOrder} of 23
          </Text>
        </View>
      </View>
      
      {/* Step Explanation */}
      <Text style={styles.description}>{currentStep?.text || matchedStepDef?.description || ''}</Text>

      {/* Footer with Hint and Skip Button ONLY (NO Next or Back buttons) */}
      <View style={styles.footer}>
        <View style={styles.footerHint}>
          <Ionicons name="finger-print-outline" size={14} color="rgba(255, 255, 255, 0.45)" />
          <Text style={styles.tapHintText}>Tap anywhere to continue</Text>
        </View>

        <TouchableOpacity 
          onPress={handleSkipPress} 
          style={styles.skipButton} 
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip Tour</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  macroProgress: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  macroProgressText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: SPACING.sm,
    marginTop: 2,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tapHintText: {
    color: 'rgba(226, 232, 240, 0.45)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
