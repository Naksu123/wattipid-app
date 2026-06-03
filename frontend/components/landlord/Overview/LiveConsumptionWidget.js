import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS, RADIUS, FONT_WEIGHT } from '@/styles/theme';

export default function LiveConsumptionWidget({ todayEnergyKwh, livePeakPowerW }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous pulse for the live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <GlassCard gradient style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={22} color={COLORS.warning} />
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>Live Electricity Monitor</Text>
        </View>
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [1, 0] }) }]} />
          <View style={styles.coreDot} />
          <Text style={styles.liveText}>SYNCING</Text>
        </View>
      </View>

      <View style={styles.dataRow}>
        <View style={styles.dataBlock}>
          <Text style={styles.label}>TODAY'S USAGE</Text>
          <Text style={styles.value}>{todayEnergyKwh?.toFixed(2) || '0.00'} <Text style={styles.unit}>kWh</Text></Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dataBlock}>
          <Text style={styles.label}>5-MIN PEAK LOAD</Text>
          <Text style={styles.value}>{livePeakPowerW?.toFixed(1) || '0.0'} <Text style={styles.unit}>W</Text></Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)', // warning color
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: FONT_WEIGHT.heavy,
    color: '#fff',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  dot: {
    position: 'absolute',
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  unit: {
    fontSize: 16,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.bold,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  }
});
