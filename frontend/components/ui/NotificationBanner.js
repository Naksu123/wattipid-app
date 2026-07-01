import React, { useEffect, useCallback } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  Easing,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../styles/components/ui/NotificationBanner.styles';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

export default function NotificationBanner() {
  const { bannerConfig, hideBanner } = useNotification();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const translateY = useSharedValue(-200);
  const translateX = useSharedValue(0);
  const isVisible = useSharedValue(0);

  useEffect(() => {
    if (bannerConfig) {
      translateX.value = 0;
      isVisible.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(insets.top + 12, {
        damping: 18,
        stiffness: 120,
      });

      const timeout = setTimeout(() => {
        dismissBanner();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      isVisible.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(-200, { duration: 300, easing: Easing.in(Easing.ease) });
    }
  }, [bannerConfig, insets.top]);

  const dismissBanner = useCallback(() => {
    'worklet';
    isVisible.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(-200, { duration: 300, easing: Easing.in(Easing.ease) }, (finished) => {
      if (finished) {
        runOnJS(hideBanner)();
      }
    });
  }, [hideBanner, isVisible, translateY]);

  const handlePress = () => {
    dismissBanner();
    try {
      if (bannerConfig?.data?.route) {
        router.navigate(bannerConfig.data.route);
      } else {
        router.navigate('/(tenant)/notifications');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      if (event.translationY < 0) {
        translateY.value = (insets.top + 12) + event.translationY;
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          Math.sign(event.translationX) * width, 
          { duration: 200 }, 
          () => runOnJS(hideBanner)()
        );
      } else if (event.translationY < -40) {
        // Swipe up dismiss
        translateY.value = withTiming(-200, { duration: 250 }, () => runOnJS(hideBanner)());
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(insets.top + 12, { damping: 20, stiffness: 200 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handlePress)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, width / 2],
      [1, 0.3],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value }
      ],
      opacity: isVisible.value * opacity,
    };
  });

  if (!bannerConfig) return null;

  const { title, message, type } = bannerConfig;

  let iconName = 'notifications';
  let bannerColor = '#3B82F6';
  let bgColor = 'rgba(59, 130, 246, 0.15)';
  
  switch (type) {
    case 'info':
      iconName = 'information-circle';
      bannerColor = '#3B82F6';
      bgColor = 'rgba(59, 130, 246, 0.15)';
      break;
    case 'warning':
      iconName = 'warning';
      bannerColor = '#F59E0B'; // Orange for MEDIUM priority
      bgColor = 'rgba(245, 158, 11, 0.15)';
      break;
    case 'critical':
    case 'error':
      iconName = 'alert-circle';
      bannerColor = '#EF4444'; // Red for HIGH priority
      bgColor = 'rgba(239, 68, 68, 0.15)';
      break;
    case 'success':
      iconName = 'checkmark-circle';
      bannerColor = '#10B981';
      bgColor = 'rgba(16, 185, 129, 0.15)';
      break;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.banner, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.appIconWrapper}>
                <Ionicons name="flash" size={10} color="#fff" />
              </View>
              <Text style={styles.appName}>Wattipid</Text>
              <View style={styles.dot} />
              <Text style={styles.timestamp}>Just now</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </View>
          
          {/* Body */}
          <View style={styles.body}>
            <View style={[styles.typeIconContainer, { backgroundColor: bgColor }]}>
              <Ionicons name={iconName} size={20} color={bannerColor} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Text style={styles.message} numberOfLines={2}>{message}</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}


