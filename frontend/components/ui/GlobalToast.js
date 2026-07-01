import React, { useState, useEffect } from 'react';
import { View, Text, DeviceEventEmitter, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '@/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../styles/components/ui/GlobalToast.styles';

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


