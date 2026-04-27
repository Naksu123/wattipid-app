import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../constants/theme';

export default function BudgetProgressRing({
  spent = 0,
  limit = 100,
  size = 140,
  label = 'Daily Budget',
  currency = '₱',
}) {
  const percentage = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  const getColor = () => {
    if (percentage < 0.7) return COLORS.primary;
    if (percentage < 0.9) return COLORS.warning;
    return COLORS.danger;
  };

  const getStatusText = () => {
    if (percentage < 0.7) return 'On Track';
    if (percentage < 0.9) return 'Caution';
    return 'Over Limit!';
  };

  const remaining = Math.max(limit - spent, 0);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.surfaceLight}
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
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.inner, { width: size, height: size }]}>
        <Text style={[styles.remaining, { color: getColor() }]}>
          {currency}{Number(remaining || 0).toFixed(0)}
        </Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detail}>
        {currency}{Number(spent || 0).toFixed(2)} / {currency}{Number(limit || 0).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remaining: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.sm,
  },
  detail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
