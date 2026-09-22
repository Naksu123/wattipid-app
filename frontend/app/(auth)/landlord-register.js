import React, { useState, useEffect } from 'react';
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

export default function LandlordRegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { showModal } = useModal();

  // Registration Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Terms Agreement
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedTermsId, setAcceptedTermsId] = useState(1);
  const [acceptedDeviceInfo, setAcceptedDeviceInfo] = useState(null);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!adminCode.trim()) e.adminCode = 'Administrator passcode is required';
    else if (adminCode.trim().toUpperCase() !== 'WATTIPID-ADMIN') {
      e.adminCode = 'Invalid admin authorization passcode';
    }
    if (!acceptedTerms) {
      e.terms = 'Please accept the Terms of Service & Privacy Policy to continue';
      setTermsModalVisible(true);
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register(
      name.trim(),
      email.trim(),
      password,
      'landlord',
      null,
      acceptedTermsId,
      null,
      acceptedDeviceInfo
    );

    if (result.success) {
      if (result.needsVerification) {
        router.push({
          pathname: '/(auth)/verify',
          params: { email: email.trim(), mockCode: result.mockCode || '' }
        });
      } else {
        router.replace('/(landlord)/overview');
      }
    } else {
      showModal({
        type: 'error',
        title: 'Registration Failed',
        message: result.message || 'Failed to complete landlord account registration.'
      });
    }
  };

  const handleTermsAccept = (versionId, deviceInfo) => {
    setTermsModalVisible(false);
    setAcceptedTerms(true);
    setAcceptedTermsId(versionId || 1);
    setAcceptedDeviceInfo(deviceInfo);
    if (errors.terms) {
      setErrors((prev) => ({ ...prev, terms: null }));
    }
  };

  const handleTermsClose = () => {
    setTermsModalVisible(false);
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
              onPress={() => router.push('/(auth)/landlord-login')}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.roleBadge}>
              <Ionicons name="business-outline" size={13} color="#60A5FA" />
              <Text style={styles.roleBadgeText}>LANDLORD REGISTRATION</Text>
            </View>
          </View>

          {/* Header Block */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Create Your Landlord Account</Text>
            <Text style={styles.subtitle}>
              Set up property administration credentials to manage room submeters, track consumption, and verify tenant payments.
            </Text>
          </View>

          {/* Registration Form Card */}
          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PROPERTY OWNER / ADMIN NAME</Text>
              <View style={[styles.inputWrap, errors.name && styles.inputWrapError]}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maria Santos"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ADMINISTRATOR EMAIL</Text>
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

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CREATE PASSWORD</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputWrap, errors.confirmPassword && styles.inputWrapError]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#475569"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Admin Passcode */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ADMIN AUTHORIZATION PASSCODE</Text>
              <View style={[styles.inputWrap, errors.adminCode && styles.inputWrapError]}>
                <Ionicons name="key-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter authorization passcode"
                  placeholderTextColor="#475569"
                  value={adminCode}
                  onChangeText={(val) => {
                    setAdminCode(val);
                    if (errors.adminCode) setErrors((prev) => ({ ...prev, adminCode: null }));
                  }}
                  autoCapitalize="characters"
                />
              </View>
              {errors.adminCode && <Text style={styles.errorText}>{errors.adminCode}</Text>}
              <Text style={styles.helperText}>
                Requires landlord master authorization code.
              </Text>
            </View>

            {/* Terms of Service & Privacy Policy Agreement */}
            <View style={[styles.termsContainer, errors.terms && styles.termsContainerError]}>
              <View style={styles.termsAgreementRow}>
                <TouchableOpacity
                  style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const nextVal = !acceptedTerms;
                    setAcceptedTerms(nextVal);
                    if (nextVal) {
                      if (!acceptedTermsId) setAcceptedTermsId(1);
                      if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
                    }
                  }}
                >
                  {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.termsTextWrap}>
                  <Text style={styles.termsAgreementText}>
                    I agree to the{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => setTermsModalVisible(true)}
                    >
                      Terms of Service
                    </Text>
                    {' '}&{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => setTermsModalVisible(true)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewTermsBtn}
                  activeOpacity={0.8}
                  onPress={() => setTermsModalVisible(true)}
                >
                  <Ionicons name="document-text-outline" size={13} color="#60A5FA" />
                  <Text style={styles.viewTermsBtnText}>Review</Text>
                </TouchableOpacity>
              </View>

              {acceptedTerms ? (
                <View style={styles.termsAcceptedPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#60A5FA" />
                  <Text style={styles.termsAcceptedPillText}>Terms of Service & Privacy Policy Accepted</Text>
                </View>
              ) : null}

              {errors.terms && (
                <Text style={styles.termsErrorText}>{errors.terms}</Text>
              )}
            </View>

            {/* Primary Submit */}
            <TouchableOpacity 
              style={styles.primaryBtn}
              activeOpacity={0.88}
              disabled={isLoading}
              onPress={handleRegister}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Landlord Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Sign In Link */}
          <TouchableOpacity 
            style={styles.signInRow}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/landlord-login')}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Terms & Conditions Modal */}
      <TermsAgreementModal 
        visible={termsModalVisible} 
        onAccept={handleTermsAccept} 
        onClose={handleTermsClose}
        onDecline={handleTermsClose}
        isLoginMode={false} 
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
    marginBottom: 20,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
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
    marginBottom: 16,
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
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 2,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 4,
  },
  termsContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  termsContainerError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  termsAgreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#0A0F1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termsTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  termsAgreementText: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  termsLink: {
    color: '#60A5FA',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  viewTermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  viewTermsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  termsAcceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.15)',
  },
  termsAcceptedPillText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
  termsErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
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
  signInRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  signInLink: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});
