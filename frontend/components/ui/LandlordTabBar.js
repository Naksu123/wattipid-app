import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

const ICONS = {
  'overview': { active: 'home', inactive: 'home-outline' },
  'rooms': { active: 'business', inactive: 'business-outline' },
  'payments': { active: 'wallet', inactive: 'wallet-outline' },
  'penalties': { active: 'alert-circle', inactive: 'alert-circle-outline' },
};

const LABELS = {
  'overview': 'Dashboard',
  'rooms': 'Rooms',
  'payments': 'Payments',
  'penalties': 'Penalties',
};

// Excluded routes from the bottom tab bar (Settings accessed via Dashboard top header)
const HIDDEN_ROUTES = [
  'settings',
  'manage-tips',
  'audit',
  'notifications',
  'manual',
  'payment-settings',
  'user-manual',
];

const TabBarItem = ({ isFocused, onPress, onLongPress, routeName }) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0,
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  const iconConfig = ICONS[routeName] || { active: 'square', inactive: 'square-outline' };
  const iconName = isFocused ? iconConfig.active : iconConfig.inactive;
  const label = LABELS[routeName] || routeName;

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const indicatorOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const indicatorScaleX = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const color = isFocused ? '#10B981' : '#64748B';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.75}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
        <Ionicons name={iconName} size={21} color={color} />
      </Animated.View>
      
      <Text 
        style={[
          styles.label, 
          { 
            color, 
            fontWeight: isFocused ? '700' : '500',
          }
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      
      {/* Active screen indicator: Sleek horizontal pill matching landlord-dashboard.png */}
      <Animated.View 
        style={[
          styles.activeIndicator, 
          { 
            opacity: indicatorOpacity,
            transform: [{ scaleX: indicatorScaleX }],
          }
        ]} 
      />
    </TouchableOpacity>
  );
};

export default function LandlordTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 4 : (Platform.OS === 'ios' ? 24 : 14);

  // Check if current focused route should hide the tab bar
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute?.key];
  if (focusedDescriptor?.options?.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      <View style={styles.blurContainer}>
        {state.routes.map((route, index) => {
          if (HIDDEN_ROUTES.includes(route.name)) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              requestAnimationFrame(() => {
                navigation.navigate({ name: route.name, merge: true });
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarItem
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              routeName={route.name}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  blurContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 64,
    backgroundColor: '#0C1322', // Sleek dark navy matching landlord-dashboard.png
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 4,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  label: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  activeIndicator: {
    width: 14,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#10B981',
    marginTop: 3,
  },
});
