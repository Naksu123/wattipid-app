import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import { COLORS } from '@/styles/theme';
import styles from './styles';
import AnimatedNumber from '../AnimatedNumber';

export default function PowerGauge({ value = 0, maxValue = 2000, unit = 'W', label = 'Power', size = 180 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Cap percentage for the ring visual at 100%
  const percentage = Math.min(value / maxValue, 1);
  
  const animatedDashoffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    const targetOffset = circumference * (1 - percentage);
    Animated.timing(animatedDashoffset, {
      toValue: targetOffset,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [percentage, circumference, animatedDashoffset]);

  const getColor = () => {
    if (percentage < 0.5) return COLORS.primary; // Green
    if (percentage < 0.8) return COLORS.warning; // Orange
    return COLORS.danger; // Red
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
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
      <View style={[styles.valueContainer, { width: size, height: size }]}>
        <AnimatedNumber 
          value={value} 
          formatter={(v) => String(Math.round(v))} 
          style={[styles.value, { color: getColor() }]} 
        />
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}
