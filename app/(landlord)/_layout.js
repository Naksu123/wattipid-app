import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../../constants/theme';

export default function LandlordLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1,
        height: 65, paddingBottom: 8, paddingTop: 6,
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
    }}>
      <Tabs.Screen name="overview" options={{ title: 'Overview',
        tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen name="rooms" options={{ title: 'Rooms',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings',
        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
