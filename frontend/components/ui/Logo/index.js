import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, COLORS } from '../../../styles/theme';
import s from './styles';

/**
 * Reusable Wattipid Logo Component
 * @param {Object} props
 * @param {number} props.size - Size/Width of the logo (default 180 for image)
 * @param {boolean} props.useImage - Whether to use the uploaded logo image (default true)
 * @param {boolean} props.showText - Whether to show code-based text (default false if useImage is true)
 * @param {boolean} props.showTagline - Whether to show code-based tagline (default false if useImage is true)
 * @param {string} props.variant - 'vertical' or 'horizontal'
 */
export default function Logo({ 
  size = 180, 
  useImage = true,
  showText = false, 
  showTagline = false,
  variant = 'vertical' 
}) {
  const isHorizontal = variant === 'horizontal';
  const logoSource = require('../../../assets/images/Wattipid-icon.png');

  if (useImage) {
    return (
      <View style={[s.container, {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
      }]}>
        <Image 
          source={logoSource} 
          style={[
            s.logoImage, 
            { 
              width: size * 2.0, 
              height: size * 0.65, 
              borderRadius: size * 0.15,
              backgroundColor: '#0F172A'
            }
          ]} 
        />
      </View>
    );
  }

  const circleSize = size * 1.8;
  return (
    <View style={[s.container, isHorizontal && { flexDirection: 'row', alignItems: 'center' }]}>
      <LinearGradient 
        colors={GRADIENTS.primary} 
        style={[
          s.logoCircle, 
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }
        ]}
      >
        <Ionicons name="flash" size={size} color="#fff" />
      </LinearGradient>

      {(showText || showTagline) && (
        <View style={[
          isHorizontal ? { marginLeft: 12, alignItems: 'flex-start' } : { alignItems: 'center' }
        ]}>
          {showText && (
            <Text style={[s.appName, { fontSize: size * 0.7 }, isHorizontal && { marginTop: 0 }]}>
              Wattipid
            </Text>
          )}
          {showTagline && (
            <Text style={[s.tagline, { fontSize: size * 0.28 }]}>
              Smart Energy Monitoring
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
