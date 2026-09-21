import { Stack } from 'expo-router';
import { COLORS } from '@/styles/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="tenant-login" />
      <Stack.Screen name="tenant-register" />
      <Stack.Screen name="landlord-login" />
      <Stack.Screen name="landlord-register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
