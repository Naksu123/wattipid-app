import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext, TOUR_SCREEN_NAMES, TOUR_STEP_BOUNDARIES } from '../../contexts/TourContext';

export const CustomTooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
}) => {
  const { 
    isContinuousTour, 
    currentTourScreen, 
    goToNextScreen, 
    goToPrevScreen, 
    stopTour,
    sequenceCurrentIndex,
    sequenceTotal 
  } = useTourContext();

  const currentScreenBoundary = currentTourScreen ? TOUR_STEP_BOUNDARIES[currentTourScreen] : null;
  const isScreenFirstStep = currentScreenBoundary ? currentStep?.order === currentScreenBoundary.first : isFirstStep;
  const isScreenLastStep = currentScreenBoundary ? currentStep?.order === currentScreenBoundary.last : isLastStep;

  const handleNextPress = () => {
    if (isScreenLastStep) {
      handleStop(); // clean up current overlay
      if (isContinuousTour) {
        // give it a brief moment to unmount before routing to prevent visual jump
        setTimeout(() => goToNextScreen(), 100);
      } else {
        stopTour();
      }
    } else {
      handleNext();
    }
  };

  const handlePrevPress = () => {
    if (isScreenFirstStep) {
      handleStop();
      if (isContinuousTour && sequenceCurrentIndex > 1) {
        setTimeout(() => goToPrevScreen(), 100);
      }
    } else {
      handlePrev();
    }
  };

  const handleSkipPress = () => {
    handleStop();
    stopTour();
  };

  // Determine button text
  let nextText = 'Next';
  if (isScreenLastStep) {
    nextText = isContinuousTour && sequenceCurrentIndex < sequenceTotal ? 'Next Screen' : 'Finish';
  }

  let showPrevBtn = !isScreenFirstStep;
  // If we are in continuous tour and not on the first screen, show Prev even on first step of screen
  if (isContinuousTour && isScreenFirstStep && sequenceCurrentIndex > 1) {
    showPrevBtn = true;
  }

  return (
    <View style={styles.tooltipContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Feature Tour</Text>
        </View>
        
        {isContinuousTour && currentTourScreen && (
          <View style={styles.macroProgress}>
            <Text style={styles.macroProgressText}>
              {TOUR_SCREEN_NAMES[currentTourScreen]} • {sequenceCurrentIndex}/{sequenceTotal}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.description}>{currentStep?.text}</Text>
      
      <View style={styles.footer}>
        <View style={styles.stepCounter}>
          <Text style={styles.stepText}>Step {currentStep?.order}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleSkipPress} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip Tour</Text>
          </TouchableOpacity>
          
          <View style={styles.navButtons}>
            {showPrevBtn && (
              <TouchableOpacity onPress={handlePrevPress} style={styles.prevButton}>
                <Ionicons name="arrow-back" size={16} color={COLORS.textPrimary} />
                <Text style={styles.prevText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleNextPress} style={styles.nextButton}>
              <Text style={styles.nextText}>{nextText}</Text>
              <Ionicons name={isScreenLastStep && nextText === 'Finish' ? "checkmark" : "arrow-forward"} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
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
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  macroProgressText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: SPACING.md,
  },
  stepCounter: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skipButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
  },
  prevText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  nextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
