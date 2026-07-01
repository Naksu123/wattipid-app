import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/LiveConsumptionWidget.styles';

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


