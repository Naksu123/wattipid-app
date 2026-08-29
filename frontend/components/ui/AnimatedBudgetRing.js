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
  const safeSpent = isNaN(Number(spent)) ? 0 : Math.max(0, Number(spent));
  const safeLimit = (isNaN(Number(limit)) || Number(limit) <= 0) ? 1 : Math.max(1, Number(limit));
  const percentage = safeLimit > 0 ? (safeSpent / safeLimit) : 0;
  const safePercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  const visualPercentage = Math.min(Math.max(safePercentage, 0), 1);
  
  const strokeWidth = 12;
  const safeSize = isNaN(Number(size)) || Number(size) <= 0 ? 180 : Number(size);
  const radius = Math.max(1, (safeSize - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  
  const animProgress = useRef(new Animated.Value(visualPercentage)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: visualPercentage,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [visualPercentage, animProgress]);

  const getColor = () => {
    if (safePercentage < 0.75) return '#10B981'; // Green (NORMAL)
    if (safePercentage < 0.90) return '#F59E0B'; // Orange (APPROACHING)
    if (safePercentage <= 1.0) return '#EF4444'; // Red (WARNING)
    return '#8B5CF6'; // Purple (EXCEEDED)
  };

  const animatedStrokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { width: safeSize, height: safeSize }]}>
      <Svg width={safeSize} height={safeSize} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={animatedStrokeDashoffset}
        />
      </Svg>
      <View style={[styles.inner, { width: safeSize, height: safeSize }]}>
        <Text style={[styles.spentAmount, { color: getColor() }]}>
          {currency}{safeSpent.toFixed(2)}
        </Text>
        <Text style={styles.limitAmount}>
          of {currency}{safeLimit.toFixed(2)}
        </Text>
        <Text style={[styles.percentage, { color: getColor() }]}>
          {Math.round(safePercentage * 100)}%
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
