import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Legacy Login Dispatcher
 * Routes legacy /(auth)/login calls directly to the dedicated Tenant or Landlord login screen.
 */
export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params?.role;

  useEffect(() => {
    if (role === 'landlord') {
      router.replace('/(auth)/landlord-login');
    } else {
      router.replace('/(auth)/tenant-login');
    }
  }, [role, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
