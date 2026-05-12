import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '@/styles/theme';
import styles from './styles';

export default function GlassCard({ children, style, gradient = false, solid = false, noPadding = false }) {
  if (gradient || solid) {
    return (
      <LinearGradient
        colors={solid ? GRADIENTS.card : GRADIENTS.cardGlassPremium}
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
