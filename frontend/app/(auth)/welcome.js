import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '@/styles/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('tenant'); // 'tenant' | 'landlord'

  const handleGetStarted = () => {
    if (selectedRole === 'landlord') {
      router.push('/(auth)/landlord-login');
    } else {
      router.push('/(auth)/tenant-login');
    }
  };

  const handleSignIn = () => {
    if (selectedRole === 'landlord') {
      router.push('/(auth)/landlord-login');
    } else {
      router.push('/(auth)/tenant-login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header with Wattipid Logo */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image 
              source={require('../../assets/images/Wattipid-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.subtitle}>Choose how you use Wattipid.</Text>
        </View>

        {/* Dedicated Role Selection Cards */}
        <View style={styles.cardsWrap}>
          {/* Tenant Option Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'tenant' ? styles.roleCardSelectedTenant : styles.roleCardUnselected
            ]}
            activeOpacity={0.85}
            onPress={() => setSelectedRole('tenant')}
          >
            <View style={[
              styles.iconBox,
              selectedRole === 'tenant' ? styles.iconBoxSelectedTenant : styles.iconBoxUnselected
            ]}>
              <Ionicons 
                name="home-outline" 
                size={26} 
                color={selectedRole === 'tenant' ? '#10B981' : '#64748B'} 
              />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, selectedRole === 'tenant' && styles.cardTitleActive]}>
                  I am a Tenant
                </Text>
                {selectedRole === 'tenant' && (
                  <View style={styles.activePillTenant}>
                    <Text style={styles.activePillTextTenant}>Active Choice</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDesc}>
                Track your electricity consumption, manage your budget, and keep up with your bills.
              </Text>
            </View>

            <View style={[
              styles.radioIndicator,
              selectedRole === 'tenant' && styles.radioIndicatorSelectedTenant
            ]}>
              {selectedRole === 'tenant' && <View style={styles.radioDotTenant} />}
            </View>
          </TouchableOpacity>

          {/* Landlord Option Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'landlord' ? styles.roleCardSelectedLandlord : styles.roleCardUnselected
            ]}
            activeOpacity={0.85}
            onPress={() => setSelectedRole('landlord')}
          >
            <View style={[
              styles.iconBox,
              selectedRole === 'landlord' ? styles.iconBoxSelectedLandlord : styles.iconBoxUnselected
            ]}>
              <Ionicons 
                name="business-outline" 
                size={26} 
                color={selectedRole === 'landlord' ? '#3B82F6' : '#64748B'} 
              />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, selectedRole === 'landlord' && styles.cardTitleActive]}>
                  I am a Landlord
                </Text>
                {selectedRole === 'landlord' && (
                  <View style={styles.activePillLandlord}>
                    <Text style={styles.activePillTextLandlord}>Active Choice</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDesc}>
                Manage rooms, monitor electricity usage, and review tenant payments.
              </Text>
            </View>

            <View style={[
              styles.radioIndicator,
              selectedRole === 'landlord' && styles.radioIndicatorSelectedLandlord
            ]}>
              {selectedRole === 'landlord' && <View style={styles.radioDotLandlord} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Controls Section */}
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#062E1F" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInRow}
            activeOpacity={0.8}
            onPress={handleSignIn}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070C15',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  logoWrap: {
    width: 155,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
  },
  cardsWrap: {
    gap: 16,
    marginVertical: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  roleCardUnselected: {
    backgroundColor: '#0E1626',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  roleCardSelectedTenant: {
    backgroundColor: '#122329',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  roleCardSelectedLandlord: {
    backgroundColor: '#0F2137',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBoxSelectedTenant: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  iconBoxSelectedLandlord: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  cardTitleActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activePillTenant: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  activePillTextTenant: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  activePillLandlord: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  activePillTextLandlord: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelectedTenant: {
    borderColor: '#10B981',
  },
  radioIndicatorSelectedLandlord: {
    borderColor: '#3B82F6',
  },
  radioDotTenant: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  radioDotLandlord: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  actionWrap: {
    marginTop: 20,
    gap: 14,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#062E1F',
    letterSpacing: 0.3,
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  signInText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  signInLink: {
    color: '#10B981',
    fontWeight: '700',
  },
});
