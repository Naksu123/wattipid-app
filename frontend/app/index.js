import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Root Entry Point (Visual Only)
 * All navigation logic is now handled exclusively by _layout.js 
 * to prevent redirection loops.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
