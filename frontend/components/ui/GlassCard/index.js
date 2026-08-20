import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '@/styles/theme';
import styles from './styles';

const GlassCard = forwardRef(({ children, style, gradient = false, solid = false, noPadding = false, ...rest }, ref) => {
  if (gradient || solid) {
    return (
      <LinearGradient
        ref={ref}
        colors={solid ? GRADIENTS.card : GRADIENTS.cardGlassPremium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, noPadding && styles.noPadding, style]}
        {...rest}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View ref={ref} style={[styles.card, noPadding && styles.noPadding, style]} {...rest}>
      {children}
    </View>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
