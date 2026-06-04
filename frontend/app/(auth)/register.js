import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { requestTenantAccessCode } from '../../services/emailService';
import { COLORS, GRADIENTS, FONT_WEIGHT } from '@/styles/theme';
import s from '@/styles/auth/register.styles';
import TermsAgreementModal from '../../components/modals/TermsAgreementModal';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState('tenant');

  // Step control for tenant: 'email' | 'form'
  const [tenantStep, setTenantStep] = useState('email');

  // Step 1 fields
  const [emailForCode, setEmailForCode] = useState('');
  const [emailForCodeError, setEmailForCodeError] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [mockCodeHint, setMockCodeHint] = useState(''); // Demo only

  // Step 2 / Landlord fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Terms Modal
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [acceptedTermsId, setAcceptedTermsId] = useState(null);
  const [acceptedDeviceInfo, setAcceptedDeviceInfo] = useState(null);

  // Trigger modal immediately when user lands on Registration screen and is a Tenant
  useEffect(() => {
    if (role === 'tenant' && !acceptedTermsId) {
      setTermsModalVisible(true);
    }
  }, [role, acceptedTermsId]);

  // ─── Step 1: Request access code ───────────────────────────────────────────
  const handleRequestCode = async () => {
    if (!emailForCode.trim()) { setEmailForCodeError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(emailForCode.trim())) { setEmailForCodeError('Enter a valid email'); return; }

    setRequestingCode(true);
    try {
      const result = await requestTenantAccessCode(emailForCode.trim());
      if (result.success) {
        // Pre-fill email in step 2
        setEmail(emailForCode.trim());
        setMockCodeHint(result.mockCode || '');
        setTenantStep('form');
      } else {
        Alert.alert(
          result.expired ? 'Code Expired' : 'Not Found',
          result.expired
            ? 'Invalid or expired access code. Please contact your landlord.'
            : result.message
        );
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setRequestingCode(false);
    }
  };

  // ─── Step 2: Complete registration ─────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (role === 'tenant' && !tenantCode.trim()) e.tenantCode = 'Access code is required';
    if (role === 'landlord' && adminCode !== 'WATTIPID-ADMIN') e.adminCode = 'Invalid admin code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegisterClick = () => {
    if (!validate()) return;
    executeRegistration();
  };

  const executeRegistration = async () => {
    const result = await register(
      name.trim(), email.trim(), password, role,
      role === 'tenant' ? tenantCode.trim() : null,
      acceptedTermsId, null, acceptedDeviceInfo
    );
    if (result.success) {
      if (result.needsVerification) {
        router.push({ pathname: '/(auth)/verify', params: { email: email.trim(), mockCode: result.mockCode || '' } });
      } else {
        router.replace(role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
      }
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

  const handleTermsAccept = (versionId, deviceInfo) => {
    setTermsModalVisible(false);
    setAcceptedTermsId(versionId);
    setAcceptedDeviceInfo(deviceInfo);
  };

  const handleTermsDecline = () => {
    setTermsModalVisible(false);
    router.replace('/(auth)/login');
  };



  // ─── TENANT STEP 1: Enter email to receive access code ─────────────────────
  if (role === 'tenant' && tenantStep === 'email') {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join Wattipid and start monitoring</Text>

          {/* Role Toggle */}
          <View style={s.roleToggle}>
            {['tenant', 'landlord'].map(r => (
              <TouchableOpacity key={r} onPress={() => { setRole(r); setTenantStep('email'); }} activeOpacity={0.7}
                style={[s.roleBtn, role === r && s.roleBtnActive]}>
                <Ionicons name={r === 'tenant' ? 'person-outline' : 'shield-outline'}
                  size={18} color={role === r ? COLORS.primary : COLORS.textMuted} />
                <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>
                  {r === 'tenant' ? 'Tenant' : 'Landlord'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            {/* Step indicator */}
            <View style={s.stepRow}>
              <View style={[s.stepDot, s.stepDotActive]} />
              <View style={s.stepLine} />
              <View style={s.stepDot} />
            </View>
            <Text style={s.stepLabel}>Step 1 of 2 — Get Your Access Code</Text>

            <View style={s.iconBox}>
              <Ionicons name="mail-open-outline" size={40} color={COLORS.primary} />
            </View>

            <Text style={s.stepTitle}>Enter Your Email</Text>
            <Text style={s.stepDesc}>
              Your landlord must provide you with an access code invitation. Enter your email below and we will send you the verification code.
            </Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address</Text>
              <View style={[s.inputWrap, emailForCodeError && s.inputErr]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  value={emailForCode}
                  onChangeText={t => { setEmailForCode(t); setEmailForCodeError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              {emailForCodeError ? <Text style={s.errText}>{emailForCodeError}</Text> : null}
            </View>

            <TouchableOpacity onPress={handleRequestCode} activeOpacity={0.8} disabled={requestingCode} style={s.btnWrap}>
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {requestingCode
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                      <Text style={s.btnText}>Send My Access Code</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={s.infoText}>
                Dont have an invitation? Contact your landlord to send you an access code first.
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.back()} style={s.regBtn}>
            <Text style={s.regText}>Already have an account? <Text style={s.regLink}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Terms Agreement Modal */}
        <TermsAgreementModal 
          visible={termsModalVisible} 
          onAccept={handleTermsAccept} 
          onDecline={handleTermsDecline} 
        />
      </KeyboardAvoidingView>
    );
  }

  // ─── TENANT STEP 2 + LANDLORD: Full registration form ──────────────────────
  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          onPress={() => role === 'tenant' ? setTenantStep('email') : router.back()}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join Wattipid and start monitoring</Text>

        {/* Role Toggle */}
        <View style={s.roleToggle}>
          {['tenant', 'landlord'].map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => { setRole(r); if (r === 'tenant') setTenantStep('email'); }}
              activeOpacity={0.7}
              style={[s.roleBtn, role === r && s.roleBtnActive]}
            >
              <Ionicons name={r === 'tenant' ? 'person-outline' : 'shield-outline'}
                size={18} color={role === r ? COLORS.primary : COLORS.textMuted} />
              <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>
                {r === 'tenant' ? 'Tenant' : 'Landlord'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.card}>
          {/* Step indicator for tenant */}
          {role === 'tenant' && (
            <>
              <View style={s.stepRow}>
                <View style={[s.stepDot, s.stepDotDone]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
                <View style={[s.stepLine, s.stepLineDone]} />
                <View style={[s.stepDot, s.stepDotActive]} />
              </View>
              <Text style={s.stepLabel}>Step 2 of 2 — Complete Your Account</Text>
            </>
          )}



          <InputField icon="person-outline" label="Full Name" value={name} onChangeText={setName}
            error={errors.name} placeholder="Enter your full name" />

          <InputField icon="mail-outline" label="Email Address" value={email} onChangeText={setEmail}
            error={errors.email} placeholder="Enter your email" keyboardType="email-address" />

          <InputField icon="lock-closed-outline" label="Password" value={password} onChangeText={setPassword}
            error={errors.password} placeholder="Create a password" secure showPassword={showPassword}
            extra={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            }
          />

          <InputField icon="lock-closed-outline" label="Confirm Password" value={confirmPassword}
            onChangeText={setConfirmPassword} error={errors.confirmPassword}
            placeholder="Confirm your password" secure showPassword={showPassword}
            extra={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            }
          />

          {role === 'tenant' ? (
            <InputField icon="key-outline" label="Access Code" value={tenantCode}
              onChangeText={setTenantCode} error={errors.tenantCode}
              placeholder="Enter the code from your email" />
          ) : (
            <InputField icon="shield-checkmark-outline" label="Admin Authorization Code"
              value={adminCode} onChangeText={setAdminCode} error={errors.adminCode}
              placeholder="Enter admin code" />
          )}

          {role === 'tenant' && (
            <View style={s.infoBox}>
              <Ionicons name="mail" size={16} color={COLORS.info} />
              <Text style={s.infoText}>An email verification code will also be sent to confirm your account.</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleRegisterClick} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
            <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>
                    {role === 'tenant' ? 'Verify & Create Account' : 'Create Account'}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={s.regBtn}>
          <Text style={s.regText}>Already have an account? <Text style={s.regLink}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputField = ({ icon, label, value, onChangeText, error, placeholder, secure, showPassword, extra, keyboardType }) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputWrap, error && s.inputErr]}>
      <Ionicons name={icon} size={20} color={COLORS.textMuted} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !showPassword}
        autoCapitalize={secure || icon === 'mail-outline' || keyboardType === 'email-address' ? 'none' : 'words'}
        keyboardType={keyboardType || 'default'}
      />
      {extra}
    </View>
    {error && <Text style={s.errText}>{error}</Text>}
  </View>
);