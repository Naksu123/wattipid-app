import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './styles';

export default function GlassCard({ children, style, gradient = false, noPadding = false }) {
  if (gradient) {
    return (
      <LinearGradient
        colors={['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.75)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, noPadding && styles.noPadding, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}
