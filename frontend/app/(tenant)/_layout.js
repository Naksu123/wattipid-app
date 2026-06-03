import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, FONT_SIZE } from '@/styles/theme';
import NotificationBadge from '../../components/ui/NotificationBadge';
import { getUnreadNotificationCount } from '../../services/notificationApi';

export default function TenantLayout() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (e) {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Tabs screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.background },
        tabBarBackground: () => (
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: 'rgba(15, 23, 42, 0.94)', 
                borderRadius: 32,
                overflow: 'hidden' 
              }
            ]} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 15,
          left: 15,
          right: 15,
          height: 65, 
          paddingBottom: 0, 
          paddingTop: 0,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          elevation: 5, // Add shadow for Android
          backgroundColor: 'transparent',
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4 },
      }}>
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} /> }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
        <Tabs.Screen name="tips" options={{ title: 'Tips',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="budget" options={{ title: 'Budget',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="payment" options={{ title: 'Payment',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
        
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="edit-profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>

      {/* Global Notification Bell */}
      {!pathname.includes('/notifications') && (
        <TouchableOpacity 
          style={styles.globalBell} 
          activeOpacity={0.8}
          onPress={() => {
            router.navigate('/(tenant)/notifications');
          }}
        >
          <View>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            <NotificationBadge count={unreadCount} />
          </View>
        </TouchableOpacity>
      )}
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
