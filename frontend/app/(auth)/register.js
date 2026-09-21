import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Legacy Register Dispatcher
 * Routes legacy /(auth)/register calls directly to the dedicated Tenant or Landlord registration screen.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params?.role;

  useEffect(() => {
    if (role === 'landlord') {
      router.replace('/(auth)/landlord-register');
    } else {
      router.replace('/(auth)/tenant-register');
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