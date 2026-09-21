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
import { verifyAccessCodeAPI } from '../../services/database';
import TermsAgreementModal from '../../components/modals/TermsAgreementModal';

export default function TenantRegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { showModal } = useModal();

  // Tenant multi-step: 'code' (Step 1: Verify Invitation) -> 'details' (Step 2: Account info)
  const [step, setStep] = useState('code');

  // Step 1: Submeter Invitation verification
  const [emailForCode, setEmailForCode] = useState('');
  const [accessCodeForVerify, setAccessCodeForVerify] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeErrors, setCodeErrors] = useState({});

  // Step 2: Tenant credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Terms Agreement
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true); // Default true matching registration.png
  const [acceptedTermsId, setAcceptedTermsId] = useState(1);
  const [acceptedDeviceInfo, setAcceptedDeviceInfo] = useState(null);

  // Step 1 Validation & Code Verification
  const handleVerifyAccessCode = async () => {
    const errs = {};
    if (!emailForCode.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(emailForCode.trim())) errs.email = 'Enter a valid email address';
    if (!accessCodeForVerify.trim()) errs.code = 'Access code is required';

    if (Object.keys(errs).length > 0) {
      setCodeErrors(errs);
      return;
    }

    setVerifyingCode(true);
    setCodeErrors({});
    try {
      const result = await verifyAccessCodeAPI(emailForCode.trim(), accessCodeForVerify.trim());
      if (result.success) {
        setEmail(emailForCode.trim());
        setTenantCode(accessCodeForVerify.trim().toUpperCase());
        setStep('details');
      } else {
        let title = 'Verification Failed';
        let msg = result.message || 'Invalid access code.';
        const code = result.error_code;

        if (code === 'ACCESS_CODE_EXPIRED' || msg.includes('expired')) {
          title = 'Access Code Expired';
          msg = 'Your Access Code has expired.\n\nFor security purposes, expired Access Codes cannot be reused.\n\nPlease contact your landlord to generate a new invitation.';
        } else if (code === 'INVITATION_ALREADY_USED' || msg.toLowerCase().includes('already')) {
          title = 'Registration Already Completed';
          msg = 'This invitation has already been used to create an account.\n\nPlease sign in using your existing account or use the Forgot Password feature if needed.';
        } else if (code === 'INVITATION_CANCELLED' || msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('replaced')) {
          title = 'Invitation Superseded';
          msg = 'This invitation was superseded by a newer access code or cancelled by your landlord.\n\nPlease check your inbox for the latest code or ask your landlord to resend it.';
        } else if (code === 'INVITATION_NOT_FOUND' || msg.includes('No invitation') || msg.includes('not found')) {
          title = 'Invitation Not Found';
          msg = 'No active invitation was found for this email address.\n\nPlease verify your email address or contact your landlord.';
        } else if (code === 'INVALID_ACCESS_CODE' || msg.includes('incorrect') || msg.toLowerCase().includes('invalid')) {
          title = 'Verification Failed';
          msg = 'The Access Code you entered is incorrect.\n\nPlease check the 6-digit access code sent to your email and try again.';
        }

        showModal({ type: 'error', title, message: msg, primaryButtonText: 'Try Again' });
      }
    } catch (e) {
      showModal({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to verify access code right now. Please check your network connection and try again.'
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  // Step 2 Form Validation & Submission
  const validateForm = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!tenantCode.trim()) errs.tenantCode = 'Access code is required';
    if (!acceptedTerms) {
      errs.terms = 'Please accept the Terms of Service & Privacy Policy to continue';
      setTermsModalVisible(true);
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    const result = await register(
      name.trim(),
      email.trim(),
      password,
      'tenant',
      tenantCode.trim(),
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
        router.replace('/(tenant)/dashboard');
      }
    } else {
      showModal({
        type: 'error',
        title: 'Registration Failed',
        message: result.message || 'Failed to complete tenant account registration.'
      });
    }
  };

  const handleTermsAccept = (versionId, deviceInfo) => {
    setTermsModalVisible(false);
    setAcceptedTerms(true);
    setAcceptedTermsId(versionId || 1);
    setAcceptedDeviceInfo(deviceInfo);
    if (formErrors.terms) {
      setFormErrors((prev) => ({ ...prev, terms: null }));
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
          {/* Top Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (step === 'details') {
                  setStep('code');
                } else {
                  router.push('/(auth)/tenant-login');
                }
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.roleBadge}>
              <Ionicons name="home-outline" size={13} color="#10B981" />
              <Text style={styles.roleBadgeText}>TENANT REGISTRATION</Text>
            </View>
          </View>

          {/* Header Title */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Create Your Tenant Account</Text>
            <Text style={styles.subtitle}>
              {step === 'code' 
                ? 'Enter your assigned invitation code to link your account to your room submeter.'
                : 'Complete your profile details to activate your smart energy dashboard.'}
            </Text>

            {/* Step Indicator */}
            <View style={styles.stepTrack}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Text style={styles.stepDotNum}>1</Text>
              </View>
              <View style={[styles.stepLine, step === 'details' && styles.stepLineActive]} />
              <View style={[styles.stepDot, step === 'details' && styles.stepDotActive]}>
                <Text style={[styles.stepDotNum, step !== 'details' && styles.stepDotNumInactive]}>2</Text>
              </View>
            </View>
          </View>

          {/* STEP 1: Verify Invitation */}
          {step === 'code' ? (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>1. VERIFY SUBMETER INVITATION</Text>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL INVITED BY LANDLORD</Text>
                <View style={[styles.inputWrap, codeErrors.email && styles.inputWrapError]}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. tenant.alex@gmail.com"
                    placeholderTextColor="#475569"
                    value={emailForCode}
                    onChangeText={(val) => {
                      setEmailForCode(val);
                      if (codeErrors.email) setCodeErrors((prev) => ({ ...prev, email: null }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {codeErrors.email && <Text style={styles.errorText}>{codeErrors.email}</Text>}
              </View>

              {/* Access Code Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-CHARACTER ACCESS CODE</Text>
                <View style={[styles.inputWrap, codeErrors.code && styles.inputWrapError]}>
                  <Ionicons name="key-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. WTP280"
                    placeholderTextColor="#475569"
                    value={accessCodeForVerify}
                    onChangeText={(val) => {
                      setAccessCodeForVerify(val);
                      if (codeErrors.code) setCodeErrors((prev) => ({ ...prev, code: null }));
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                {codeErrors.code && <Text style={styles.errorText}>{codeErrors.code}</Text>}
                <Text style={styles.helperText}>
                  Provided by your property landlord via email or rental agreement.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn}
                activeOpacity={0.88}
                disabled={verifyingCode}
                onPress={handleVerifyAccessCode}
              >
                {verifyingCode ? (
                  <ActivityIndicator color="#062E1F" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Verify Code & Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#062E1F" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: Profile Details */
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>2. TENANT CREDENTIALS</Text>

              {/* Linked Submeter Pill */}
              <View style={styles.linkedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.linkedBadgeText}>
                  Submeter Linked: Code {tenantCode} ({email})
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={[styles.inputWrap, formErrors.name && styles.inputWrapError]}>
                  <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex Johnson"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                    }}
                  />
                </View>
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CREATE PASSWORD</Text>
                <View style={[styles.inputWrap, formErrors.password && styles.inputWrapError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: null }));
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrap, formErrors.confirmPassword && styles.inputWrapError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#475569"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {formErrors.confirmPassword && <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>}
              </View>

              {/* Terms of Service & Privacy Policy Agreement */}
              <View style={[styles.termsContainer, formErrors.terms && styles.termsContainerError]}>
                <View style={styles.termsAgreementRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      const nextVal = !acceptedTerms;
                      setAcceptedTerms(nextVal);
                      if (nextVal) {
                        if (!acceptedTermsId) setAcceptedTermsId(1);
                        if (formErrors.terms) setFormErrors((prev) => ({ ...prev, terms: null }));
                      }
                    }}
                  >
                    {acceptedTerms && <Ionicons name="checkmark" size={14} color="#062E1F" />}
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
                    <Ionicons name="document-text-outline" size={13} color="#10B981" />
                    <Text style={styles.viewTermsBtnText}>Review</Text>
                  </TouchableOpacity>
                </View>

                {acceptedTerms ? (
                  <View style={styles.termsAcceptedPill}>
                    <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                    <Text style={styles.termsAcceptedPillText}>Terms of Service & Privacy Policy Accepted</Text>
                  </View>
                ) : null}

                {formErrors.terms && (
                  <Text style={styles.termsErrorText}>{formErrors.terms}</Text>
                )}
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn}
                activeOpacity={0.88}
                disabled={isLoading}
                onPress={handleRegister}
              >
                {isLoading ? (
                  <ActivityIndicator color="#062E1F" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Complete Tenant Registration</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Sign In Link */}
          <TouchableOpacity 
            style={styles.signInRow}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/tenant-login')}
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
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
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepDotActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#062E1F',
  },
  stepDotNumInactive: {
    color: '#94A3B8',
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  card: {
    backgroundColor: '#0E1626',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  linkedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    color: '#10B981',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  viewTermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  viewTermsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  termsAcceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.15)',
  },
  termsAcceptedPillText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  termsErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 15,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#062E1F',
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
    color: '#10B981',
    fontWeight: '700',
  },
});
