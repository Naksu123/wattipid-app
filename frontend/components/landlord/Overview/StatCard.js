import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS, RADIUS, FONT_WEIGHT } from '@/styles/theme';

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

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%', // Ensures 2 columns with gap
    minHeight: 110,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Subtle dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  valueContainer: {
    marginTop: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
  }
});
