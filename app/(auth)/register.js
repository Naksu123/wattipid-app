import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { requestTenantAccessCode } from '../../services/emailService';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS, GRADIENTS } from '../../constants/theme';

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

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register(
      name.trim(), email.trim(), password, role,
      role === 'tenant' ? tenantCode.trim() : null
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

          {/* Mock code hint for demo */}
          {role === 'tenant' && mockCodeHint ? (
            <View style={s.mockBox}>
              <Ionicons name="mail-open" size={16} color={COLORS.primary} />
              <Text style={s.mockText}>
                Code sent to <Text style={{ fontWeight: FONT_WEIGHT.semibold }}>{emailForCode}</Text>
                {'\n'}
                <Text style={s.mockHint}>[Demo] Your access code: </Text>
                <Text style={s.mockCode}>{mockCodeHint}</Text>
              </Text>
            </View>
          ) : null}

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

          <TouchableOpacity onPress={handleRegister} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
  backBtn: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  roleToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceGlass, borderWidth: 1, borderColor: COLORS.border },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  roleBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium, color: COLORS.textMuted },
  roleBtnTextActive: { color: COLORS.primary },
  card: { backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, ...SHADOWS.md },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  stepDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.surfaceLight, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotDone: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: SPACING.xs },
  stepLineDone: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: SPACING.lg },

  // Step 1 specific
  iconBox: { alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(34,197,94,0.12)', alignSelf: 'center', marginBottom: SPACING.md },
  stepTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  stepDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },

  // Mock code hint
  mockBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(34,197,94,0.08)', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  mockText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },
  mockHint: { color: COLORS.textMuted },
  mockCode: { fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, fontSize: FONT_SIZE.md, letterSpacing: 1 },

  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, gap: SPACING.sm },
  inputErr: { borderColor: COLORS.danger },
  input: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: SPACING.xs },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, backgroundColor: 'rgba(59,130,246,0.08)', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  infoText: { fontSize: FONT_SIZE.xs, color: COLORS.info, flex: 1, lineHeight: 18 },
  btnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btn: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.md + 2, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: '#fff' },
  regBtn: { alignItems: 'center', paddingVertical: SPACING.lg },
  regText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  regLink: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
});

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