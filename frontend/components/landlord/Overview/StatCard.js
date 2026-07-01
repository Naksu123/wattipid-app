import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/StatCard.styles';

export default function StatCard({ title, value, icon, color = COLORS.primary, prefix = '', suffix = '' }) {
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      // Flash animation on change
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 500, useNativeDriver: true })
      ]).start();
      prevValue.current = value;
    }
  }, [value]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </View>
      <Animated.View style={[styles.valueContainer, { opacity: fadeAnim }]}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {prefix}{value}{suffix}
        </Text>
      </Animated.View>
    </GlassCard>
  );
}


