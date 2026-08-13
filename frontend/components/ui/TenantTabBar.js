import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

const ICONS = {
  'dashboard': 'speedometer-outline',
  'analytics': 'bar-chart-outline',
  'tips': 'bulb-outline',
  'budget': 'wallet-outline',
  'billing/index': 'card-outline',
  'settings': 'settings-outline',
};

const LABELS = {
  'dashboard': 'Dashboard',
  'analytics': 'Analytics',
  'tips': 'Tips',
  'budget': 'Budget',
  'billing/index': 'Payment',
  'settings': 'Settings',
};

// Excluded routes
const HIDDEN_ROUTES = ['notifications', 'edit-profile', 'pdf-viewer', 'billing-history', 'payment'];

const TabBarItem = ({ isFocused, onPress, onLongPress, routeName }) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const iconName = ICONS[routeName] || 'square-outline';
  const label = LABELS[routeName] || routeName;

  // Interpolations
  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  const dotOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const dotScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  const color = isFocused ? COLORS.primary : COLORS.textMuted;
  
  // Replace the outline with filled icon when active if possible
  const activeIconName = isFocused ? iconName.replace('-outline', '') : iconName;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
        <Ionicons name={activeIconName} size={22} color={color} />
      </Animated.View>
      
      <Text 
        style={[styles.label, { color, fontWeight: isFocused ? '600' : '500' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      
      <Animated.View 
        style={[
          styles.indicatorDot, 
          { 
            opacity: dotOpacity,
            transform: [{ scale: dotScale }] 
          }
        ]} 
      />
    </TouchableOpacity>
  );
};

export default function TenantTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
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
              navigation.navigate({ name: route.name, merge: true });
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
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  blurContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.96)', // Deep premium dark background
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    // Soft shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingBottom: 4, // push content slightly up to balance the dot
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 6,
  }
});
