import React, { useState, useEffect, useRef } from 'react';
import { Text, DeviceEventEmitter, TouchableOpacity, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../styles/components/ui/GlobalToast.styles';

const getStatusConfig = (type) => {
  switch (type) {
    case 'error':
      return {
        icon: 'alert-circle',
        iconColor: '#EF4444',
        badgeBg: 'rgba(239, 68, 68, 0.14)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      };
    case 'warning':
      return {
        icon: 'warning',
        iconColor: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.14)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
      };
    case 'info':
      return {
        icon: 'information-circle',
        iconColor: '#38BDF8',
        badgeBg: 'rgba(56, 189, 248, 0.14)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
      };
    case 'success':
    default:
      return {
        icon: 'checkmark-circle',
        iconColor: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.14)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      };
  }
};

export default function GlobalToast() {
  const [toast, setToast] = useState(null);
  const insets = useSafeAreaInsets();
  const timerRef = useRef(null);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('showToast', (data) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setToast(data);

      if (data?.duration !== 'infinite') {
        timerRef.current = setTimeout(() => {
          setToast(null);
          timerRef.current = null;
        }, data?.duration || 3000);
      }
    });

    return () => {
      listener.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  const statusConfig = getStatusConfig(toast.type);

  // Responsive top positioning for Android (respects status bar height) and iOS
  const topOffset = Platform.select({
    ios: Math.max(insets.top + 6, 44),
    android: (RNStatusBar.currentHeight || insets.top || 24) + 10,
    default: 20,
  });

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18).stiffness(160).mass(0.6)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.wrapper, { top: topOffset }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setToast(null)}
        style={styles.touchable}
      >
        <View style={[styles.card, { borderColor: statusConfig.borderColor }]}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 25} tint="dark" style={styles.blurContainer}>
            <View style={[styles.iconBadge, { backgroundColor: statusConfig.badgeBg }]}>
              <Ionicons name={statusConfig.icon} size={16} color={statusConfig.iconColor} />
            </View>

            <Text style={styles.message} numberOfLines={3} ellipsizeMode="tail">
              {toast.message}
            </Text>

            {toast.duration === 'infinite' && (
              <TouchableOpacity
                onPress={() => setToast(null)}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color="rgba(249, 250, 251, 0.7)" />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
