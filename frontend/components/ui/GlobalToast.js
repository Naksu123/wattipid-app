import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '@/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GlobalToast() {
  const [toast, setToast] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('showToast', (data) => {
      setToast(data);
      if (data.duration !== 'infinite') {
        setTimeout(() => {
          setToast(null);
        }, data.duration || 3000);
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const bgColor = isError ? COLORS.danger : COLORS.success;
  const icon = isError ? 'alert-circle' : 'checkmark-circle';

  return (
    <Animated.View 
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.container, 
        { top: insets.top + 10, backgroundColor: bgColor }
      ]}
    >
      <Ionicons name={icon} size={20} color={COLORS.white} />
      <Text style={styles.message}>{toast.message}</Text>
      {toast.duration === 'infinite' && (
        <TouchableOpacity onPress={() => setToast(null)}>
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  }
});
