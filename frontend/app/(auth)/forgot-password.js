import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from '@/styles/theme';
import { apiCall } from '../../services/api';
import AlertModal from '../../components/modals/AlertModal';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiCall('requestPasswordReset', { email });
      showAlert('Check Your Email', 'If this email is registered, you will receive a reset code.', 'success');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiCall('verifyResetOTP', { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiCall('resetPassword', { email, otp, password });
      showAlert('Success', 'Your password has been reset successfully.', 'success');
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={s.header}>
          <View style={s.iconCircle}>
            <Ionicons name="key-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={s.title}>Account Recovery</Text>
          <Text style={s.subtitle}>
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Create a new secure password for your account."}
          </Text>
        </View>

        <View style={s.card}>
          {step === 1 && (
            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address</Text>
              <View style={[s.inputWrap, error && s.inputErr]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="name@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.inputGroup}>
              <Text style={s.label}>Verification Code</Text>
              <View style={[s.inputWrap, error && s.inputErr]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  letterSpacing={10}
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <>
              <View style={s.inputGroup}>
                <Text style={s.label}>New Password</Text>
                <View style={[s.inputWrap, error && s.inputErr]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Confirm New Password</Text>
                <View style={[s.inputWrap, error && s.inputErr]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder="Repeat password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}

          {error ? <Text style={s.errText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={step === 1 ? handleRequestOTP : step === 2 ? handleVerifyOTP : handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>
                {step === 1 ? "Send Reset Code" : step === 2 ? "Verify Code" : "Reset Password"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {step === 2 && (
          <TouchableOpacity style={s.resendBtn} onPress={handleRequestOTP} disabled={loading}>
            <Text style={s.resendText}>Didn't receive code? <Text style={s.resendLink}>Resend</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onAcknowledge={() => setAlert({ ...alert, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, marginBottom: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(33,150,243,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.xl },
  card: { backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, ...SHADOWS.md },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 52, gap: SPACING.sm },
  inputErr: { borderColor: COLORS.danger },
  input: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginBottom: SPACING.md, textAlign: 'center' },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: '#fff' },
  resendBtn: { marginTop: SPACING.xl, alignItems: 'center' },
  resendText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  resendLink: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
});
