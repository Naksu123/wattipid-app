import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@/styles/theme';
import styles from './styles';
import AnimatedNumber from '../AnimatedNumber';

export default function PowerGauge({ value = 0, maxValue = 2000, unit = 'W', label = 'Power', size = 180 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Cap percentage for the ring visual at 100%
  const percentage = Math.min(Math.max((Number(value) || 0) / (Number(maxValue) || 2000), 0), 1);
  
  const animValue = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(percentage);

  useEffect(() => {
    const listenerId = animValue.addListener(({ value: val }) => {
      setCurrentProgress(val);
    });

    Animated.timing(animValue, {
      toValue: percentage,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
      animValue.stopAnimation();
    };
  }, [percentage, animValue]);

  const getColor = () => {
    if (percentage < 0.5) return COLORS.primary; // Green
    if (percentage < 0.8) return COLORS.warning; // Orange
    return COLORS.danger; // Red
  };

  const safeOffset = circumference * (1 - Math.min(Math.max(currentProgress, 0), 1));

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
