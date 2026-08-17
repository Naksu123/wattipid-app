import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import LandlordTabBar from '@/components/ui/LandlordTabBar';

export default function LandlordLayout() {
  return (
    <Tabs 
      tabBar={(props) => <LandlordTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen name="overview" options={{ title: 'Overview' }} />
      <Tabs.Screen name="rooms" options={{ title: 'Rooms' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
      <Tabs.Screen name="penalties" options={{ title: 'Penalties' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="manage-tips" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="audit" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="manual" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="payment-settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="user-manual" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
