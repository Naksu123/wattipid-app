import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import styles from './styles';
import AnimatedNumber from '../AnimatedNumber';

export default function PowerGauge({ 
  value = 0, 
  maxValue = 2000, 
  unit = 'W', 
  label = 'Power', 
  size = 260,
  isOffline = false,
  statusText = null
}) {
  const strokeWidth = 14;
  const width = size;
  const height = Math.round(size * 0.58);
  const radius = (width - strokeWidth * 2) / 2;
  const centerX = width / 2;
  const centerY = height - 10;
  
  // 180-degree semi-circle arc length = PI * radius
  const arcLength = Math.PI * radius;
  
  // Cap percentage for the ring visual at 100%
  const numericVal = Number(value) || 0;
  const percentage = Math.min(Math.max(numericVal / (Number(maxValue) || 2000), 0), 1);
  
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

  // Arc path from left (centerX - radius) to right (centerX + radius)
  const x1 = centerX - radius;
  const y1 = centerY;
  const x2 = centerX + radius;
  const y2 = centerY;
  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

  const safeOffset = arcLength * (1 - Math.min(Math.max(currentProgress, 0), 1));

  // Determine display status (no icons as requested)
  let subStatus = statusText;
  if (!subStatus) {
    if (isOffline) {
      subStatus = 'Offline';
    } else if (numericVal > 15) {
      subStatus = 'Power Active';
    } else {
      subStatus = 'Standby';
    }
  }

  const isPowerActive = !isOffline && numericVal > 15;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="activeArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#059669" />
            <Stop offset="50%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>
        </Defs>

        {/* Background Track Arc */}
        <Path
          d={arcPath}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Active Gauge Arc */}
        {!isOffline && numericVal > 0 && (
          <Path
            d={arcPath}
            stroke="url(#activeArcGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arcLength}`}
            strokeDashoffset={safeOffset}
          />
        )}
      </Svg>

      {/* Centered Wattage Reading and Status Badge */}
      <View style={[styles.centerContainer, { top: centerY - radius * 0.72 }]}>
        <View style={styles.valueRow}>
          <AnimatedNumber 
            value={numericVal} 
            formatter={(v) => Math.round(v).toLocaleString()} 
            style={styles.wattValue} 
          />
          <Text style={styles.wattUnit}> {unit}</Text>
        </View>

        {/* Sub-badge: Text only, NO icons */}
        <View style={[styles.subBadge, isOffline ? styles.subBadgeOffline : (isPowerActive ? styles.subBadgeActive : styles.subBadgeStandby)]}>
          <Text style={[styles.subBadgeText, isOffline ? styles.subBadgeTextOffline : (isPowerActive ? styles.subBadgeTextActive : styles.subBadgeTextStandby)]}>
            {subStatus}
          </Text>
        </View>
      </View>
    </View>
  );
}
