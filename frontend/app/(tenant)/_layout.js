import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, FONT_SIZE } from '@/styles/theme';
import { useSync } from '@/contexts/SyncContext';
import { ConsumptionProvider } from '@/contexts/ConsumptionContext';
import TenantTabBar from '@/components/ui/TenantTabBar';

export default function TenantLayout() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useSync();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ConsumptionProvider>
      <Tabs 
        tabBar={(props) => <TenantTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Tabs.Screen name="tips" options={{ title: 'Tips' }} />
        <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
        <Tabs.Screen name="billing/index" options={{ title: 'Payment' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="edit-profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="pdf-viewer" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="billing-history" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="payment" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
      </ConsumptionProvider>

    </View>
  );
}

const styles = StyleSheet.create({
  globalBell: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 20) + 15,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  }
});
