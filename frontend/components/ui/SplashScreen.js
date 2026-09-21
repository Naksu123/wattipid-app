import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Central Energy Glow Aura */}
      <View style={styles.glowAuraOuter}>
        <View style={styles.glowAuraInner} />
      </View>

      {/* Center Branding Content */}
      <View style={styles.centerContent}>
        <View style={styles.brandRow}>
          <Text style={styles.brandW}>W</Text>
          <Text style={styles.brandRest}>attipid</Text>
        </View>

        <Text style={styles.subBrand}>Smart Submetering</Text>
        <Text style={styles.tagline}>Transparent Energy. Zero Bill Shocks.</Text>

        <View style={styles.platformBadge}>
          <Ionicons name="flash" size={14} color="#10B981" />
          <Text style={styles.platformText}>IoT Energy Platform</Text>
        </View>
      </View>

      {/* Bottom Loading Status & Version */}
      <View style={styles.bottomFooter}>
        <View style={styles.connectingRow}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.connectingText}>Connecting to cloud...</Text>
        </View>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C15',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAuraOuter: {
    position: 'absolute',
    width: Math.min(width * 0.85, 340),
    height: Math.min(width * 0.85, 340),
    borderRadius: 170,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAuraInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brandW: {
    fontSize: 46,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -1,
  },
  brandRest: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subBrand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 26,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    zIndex: 2,
  },
  connectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  connectingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
});
