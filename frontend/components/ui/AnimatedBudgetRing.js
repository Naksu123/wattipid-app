import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/styles/theme';

export default function AnimatedBudgetRing({
  spent = 0,
  limit = 100,
  size = 180,
  label = 'Budget',
  currency = '₱',
}) {
  const safeSpent = Number(spent || 0);
  const safeLimit = Number(limit || 1);
  const percentage = safeLimit > 0 ? (safeSpent / safeLimit) : 0;
  const visualPercentage = Math.min(Math.max(percentage, 0), 1);
  
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animValue = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(visualPercentage);

  useEffect(() => {
    const listenerId = animValue.addListener(({ value }) => {
      setCurrentProgress(value);
    });

    Animated.timing(animValue, {
      toValue: visualPercentage,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
      animValue.stopAnimation();
    };
  }, [visualPercentage, animValue]);

  const getColor = () => {
    if (percentage < 0.75) return '#10B981'; // Green (NORMAL)
    if (percentage < 0.90) return '#F59E0B'; // Orange (APPROACHING)
    if (percentage <= 1.0) return '#EF4444'; // Red (WARNING)
    return '#8B5CF6'; // Purple (EXCEEDED)
  };

  const safeOffset = circumference * (1 - Math.min(Math.max(currentProgress, 0), 1));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={safeOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.inner, { width: size, height: size }]}>
        <Text style={[styles.spentAmount, { color: getColor() }]}>
          {currency}{safeSpent.toFixed(2)}
        </Text>
        <Text style={styles.limitAmount}>
          of {currency}{safeLimit.toFixed(2)}
        </Text>
        <Text style={[styles.percentage, { color: getColor() }]}>
          {Math.round(percentage * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inner: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.bold,
  },
  limitAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  percentage: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});
