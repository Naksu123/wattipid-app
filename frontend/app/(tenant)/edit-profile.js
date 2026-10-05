import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import EditProfileModal from '@/components/tenant/EditProfileModal';
import { COLORS } from '@/styles/theme';

export default function EditProfileScreen() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tenant)/settings');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <EditProfileModal
        visible={true}
        onClose={handleClose}
      />
    </View>
  );
}
