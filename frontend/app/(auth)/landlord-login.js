import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import TermsAgreementModal from '../../components/modals/TermsAgreementModal';
import { acceptTerms } from '../../services/termsApi';

export default function LandlordLoginScreen() {
  const router = useRouter();
  const { login, logout, isLoading } = useAuth();
  const { showModal } = useModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Terms Update Handling
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Admin email is required';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (result?.success) {
      const role = result?.user?.role || 'landlord';
      
      if (result.requiresTerms) {
        setPendingRole(role);
        setTermsModalVisible(true);
      } else {
        router.replace(role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
      }
    } else {
      if (result?.message === 'Account not verified') {
        showModal({
          type: 'warning',
          title: 'Account Not Verified',
          message: 'Your administrator email has not been verified yet.',
          primaryButtonText: 'Verify Now',
          onPrimaryPress: () => router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } }),
          secondaryButtonText: 'Cancel'
        });
      } else {
        showModal({ type: 'error', title: 'Sign In Failed', message: result?.message || 'Server returned an invalid response.' });
      }
    }
  };

  const handleTermsAccept = async (versionId, deviceInfo) => {
    try {
      const result = await acceptTerms(versionId, null, deviceInfo);
      if (result.success) {
        setTermsModalVisible(false);
        router.replace(pendingRole === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
      } else {
        showModal({ type: 'error', title: 'Error', message: 'Failed to record terms acceptance. Please try again.' });
      }
    } catch (e) {
      showModal({ type: 'error', title: 'Error', message: 'Network error while accepting terms.' });
    }
  };

  const handleTermsDecline = () => {
    setTermsModalVisible(false);
    logout();
    showModal({ type: 'warning', title: 'Terms Required', message: 'You cannot access the landlord dashboard without accepting the updated Terms and Conditions.' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Button and Portal Badge */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/welcome')}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.roleBadge}>
              <Ionicons name="business-outline" size={13} color="#60A5FA" />
              <Text style={styles.roleBadgeText}>LANDLORD PORTAL</Text>
            </View>
          </View>

          {/* Header Block */}
          <View style={styles.headerBlock}>
            <View style={styles.landlordIconAura}>
              <Ionicons name="business-outline" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Welcome Back, Landlord</Text>
            <Text style={styles.subtitle}>
              Sign in to manage property rooms, monitor smart submeters, and review tenant billing.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PROPERTY ADMIN EMAIL</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. landlord.admin@gmail.com"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ADMIN PASSWORD</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter administrator password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={18} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotRow}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { role: 'landlord' } })}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Sign In Button */}
            <TouchableOpacity 
              style={styles.primaryBtn}
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={handleLogin}
            >
              {isLoading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In as Landlord</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Administrative Privilege Info Box */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#60A5FA" />
            <Text style={styles.infoBannerText}>
              Property administration privileges allow real-time submeter control, tenant invitation management, and tariff configuration.
            </Text>
          </View>

          {/* Bottom Action to Register */}
          <TouchableOpacity 
            style={styles.registerRow}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/landlord-register')}
          >
            <Text style={styles.registerText}>
              Don&apos;t have an account? <Text style={styles.registerLink}>Create Landlord Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsAgreementModal 
        visible={termsModalVisible} 
        onAccept={handleTermsAccept} 
        onDecline={handleTermsDecline} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070C15',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.6,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  landlordIconAura: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: '#0E1626',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F1D',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  registerRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  registerLink: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});
