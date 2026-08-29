import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext, TOUR_SCREEN_NAMES, TOUR_STEP_BOUNDARIES } from '../../contexts/TourContext';
import { useCopilot } from 'react-native-copilot';

export const CustomTooltip = () => {
  const { goToNext, stop, isLastStep, currentStep } = useCopilot();
  const { 
    isContinuousTour, 
    currentTourScreen, 
    goToNextScreen, 
    stopTour,
    finishTour,
    registerNextStepHandler
  } = useTourContext();

  const currentScreenBoundary = currentTourScreen ? TOUR_STEP_BOUNDARIES[currentTourScreen] : null;
  const isScreenLastStep = !!isLastStep || (currentScreenBoundary ? currentStep?.order === currentScreenBoundary.last : false);

  const currentStepNum = currentScreenBoundary
    ? Math.max(1, (currentStep?.order || currentScreenBoundary.first) - currentScreenBoundary.first + 1)
    : (currentStep?.order || 1);
  const totalScreenSteps = currentScreenBoundary
    ? (currentScreenBoundary.last - currentScreenBoundary.first + 1)
    : 1;

  // Debounce transition lock to prevent double-skipping or rapid click bugs
  const lastPressRef = useRef(0);

  const handleNextPress = useCallback(() => {
    const now = Date.now();
    if (now - lastPressRef.current < 450) {
      return;
    }
    lastPressRef.current = now;

    if (isScreenLastStep) {
      stop(); // clean up current overlay
      if (isContinuousTour) {
        // slight delay to prevent transition glitch
        setTimeout(() => goToNextScreen(), 120);
      } else {
        // Finished a single-feature tour
        finishTour();
      }
    } else {
      goToNext();
    }
  }, [isScreenLastStep, stop, isContinuousTour, goToNextScreen, finishTour, goToNext]);

  // Register the single source of truth next handler with TourContext
  useEffect(() => {
    registerNextStepHandler(handleNextPress);
    return () => {
      registerNextStepHandler(null);
    };
  }, [handleNextPress, registerNextStepHandler]);

  const handleSkipPress = () => {
    stop();
    stopTour(true);
  };

  const screenTitle = currentTourScreen ? TOUR_SCREEN_NAMES[currentTourScreen] : 'Feature Guide';

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
          <Text style={styles.title}>{screenTitle}</Text>
        </View>
        
        <View style={styles.macroProgress}>
          <Text style={styles.macroProgressText}>
            Step {currentStepNum} of {totalScreenSteps}
          </Text>
        </View>
      </View>
      
      {/* Step Explanation */}
      <Text style={styles.description}>{currentStep?.text || ''}</Text>

      {/* Subtle Tap to Continue Hint */}
      <View style={styles.tapHintRow}>
        <Ionicons name="finger-print-outline" size={13} color="rgba(255, 255, 255, 0.45)" />
        <Text style={styles.tapHintText}>Tap anywhere to continue</Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkipPress} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip Tour</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextPress} style={styles.nextButton} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {isScreenLastStep ? (isContinuousTour ? 'Next Screen →' : 'Done ✓') : 'Next →'}
          </Text>
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
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: SPACING.sm,
    paddingVertical: 2,
  },
  tapHintText: {
    color: 'rgba(226, 232, 240, 0.45)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: SPACING.sm,
  },
  stepCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  nextButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
});
