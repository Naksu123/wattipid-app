import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '../../contexts/NetworkContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

export default function NetworkStatusBar() {
  const { isConnected, isInternetReachable, isSlow } = useNetwork();
  const [slideAnim] = useState(new Animated.Value(-50));
  
  const isOffline = !isConnected || !isInternetReachable;

  useEffect(() => {
    if (isOffline || isSlow) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, isSlow]);

  if (!isOffline && !isSlow) return null;

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ translateY: slideAnim }] },
      isOffline ? styles.offlineContainer : styles.slowContainer
    ]}>
      <MaterialCommunityIcons 
        name={isOffline ? "wifi-off" : "wifi-strength-2"} 
        size={16} 
        color="#FFF" 
      />
      <Text style={styles.text}>
        {isOffline 
          ? "You're offline. Some features may be unavailable." 
          : "Slow connection detected. We're trying to reconnect."}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    paddingTop: 45, // Account for notch/status bar in Expo
  },
  offlineContainer: {
    backgroundColor: '#dc2626', // Red
  },
  slowContainer: {
    backgroundColor: '#d97706', // Amber/Orange
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  }
});
