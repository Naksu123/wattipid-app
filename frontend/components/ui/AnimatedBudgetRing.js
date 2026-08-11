import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/styles/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AnimatedBudgetRing({
  spent = 0,
  limit = 100,
  size = 180,
  label = 'Budget',
  currency = '₱',
}) {
  const percentage = limit > 0 ? (spent / limit) : 0;
  // Cap visual percentage at 100% so the ring doesn't overlap itself
  const visualPercentage = Math.min(percentage, 1);
  
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animation Values
  const animatedDashoffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    const targetOffset = circumference * (1 - visualPercentage);
    Animated.timing(animatedDashoffset, {
      toValue: targetOffset,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, // Svg circle dashoffset can be animated natively in some environments, but even if it falls back to JS it's smooth
    }).start();
  }, [visualPercentage, circumference, animatedDashoffset]);

  const getColor = () => {
    if (percentage < 0.75) return '#10B981'; // Green (NORMAL)
    if (percentage < 0.90) return '#F59E0B'; // Orange (APPROACHING)
    if (percentage <= 1.0) return '#EF4444'; // Red (WARNING)
    return '#E11D48'; // Crimson/Rose (EXCEEDED)
  };

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
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={animatedDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.inner, { width: size, height: size }]}>
        <Text style={[styles.spentAmount, { color: getColor() }]}>
          {currency}{Number(spent || 0).toFixed(2)}
        </Text>
        <Text style={styles.limitAmount}>
          of {currency}{Number(limit || 0).toFixed(2)}
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
