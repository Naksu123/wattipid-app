import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS, GRADIENTS } from '../../constants/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const { email, mockCode } = useLocalSearchParams();
  const { verifyEmail, resendVerificationCode, isLoading } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds
  const [codeExpired, setCodeExpired] = useState(false);
  const inputRefs = useRef([]);

  // 5-minute countdown timer for code validity
  useEffect(() => {
    if (countdown > 0 && !codeExpired) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCodeExpired(true);
    }
  }, [countdown, codeExpired]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (codeExpired) {
      Alert.alert(
        'Code Expired',
        'This verification code has expired (valid for 5 minutes only).\n\nPlease contact your landlord to request a new verification code.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await verifyEmail(email, fullCode);
    if (result.success) {
      Alert.alert('Success', 'Email verified! Welcome to Wattipid.', [
        { text: 'OK', onPress: () => router.replace('/(tenant)/dashboard') },
      ]);
    } else {
      // Show specific message based on status
      if (result.status === 'expired') {
        setCodeExpired(true);
        Alert.alert(
          'Code Expired',
          'This verification code has expired.\n\nPlease contact your landlord to request a new code. The system does not auto-generate new codes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Verification Failed', result.message);
      }
    }
  };

  const handleResendCode = async () => {
    const result = await resendVerificationCode(email);
    if (result.success) {
      // Reset timer and state
      setCountdown(300);
      setCodeExpired(false);
      setCode(['', '', '', '', '', '']);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.\n\n' +
        (result.mockCode ? `[Demo] Code: ${result.mockCode}` : ''));
    } else {
      Alert.alert('Error', result.message || 'Failed to resend code.');
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={s.iconWrap}>
          <LinearGradient colors={codeExpired ? GRADIENTS.danger : GRADIENTS.primary} style={s.iconCircle}>
            <Ionicons name={codeExpired ? 'time' : 'mail-open'} size={40} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={s.title}>{codeExpired ? 'Code Expired' : 'Verify Your Email'}</Text>
        <Text style={s.subtitle}>{codeExpired ? 'Contact your landlord for a new code' : 'We sent a 6-digit code to'}</Text>
        {!codeExpired && <Text style={s.email}>{email}</Text>}

        {/* Timer */}
        {!codeExpired ? (
          <View style={s.timerBox}>
            <Ionicons name="time-outline" size={16} color={countdown <= 60 ? COLORS.danger : COLORS.primary} />
            <Text style={[s.timerText, countdown <= 60 && { color: COLORS.danger }]}>
              Code expires in {formatCountdown(countdown)}
            </Text>
          </View>
        ) : (
          <View style={s.expiredBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
            <Text style={s.expiredText}>
              This code has expired. Contact your landlord for a new verification code.
            </Text>
          </View>
        )}

        {/* Mock code hint */}
        {mockCode && !codeExpired ? (
          <View style={s.mockBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.warning} />
            <Text style={s.mockText}>Demo code: <Text style={s.mockCode}>{mockCode}</Text></Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <View style={s.codeRow}>
          {code.map((digit, i) => (
            <TextInput key={i} ref={ref => inputRefs.current[i] = ref}
              style={[s.codeInput, digit && s.codeInputFilled, codeExpired && s.codeInputExpired]}
              value={digit} onChangeText={t => handleCodeChange(t, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad" maxLength={1} selectTextOnFocus
              editable={!codeExpired} />
          ))}
        </View>

        {/* Verify Button */}
        {!codeExpired ? (
          <TouchableOpacity onPress={handleVerify} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
            <LinearGradient colors={GRADIENTS.primary} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify & Create Account</Text>}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleResendCode} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
            <LinearGradient colors={GRADIENTS.accent} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={s.btnText}>  Resend Verification Code</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Info about manual process */}
        <View style={s.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.info} />
          <Text style={s.infoText}>
            For security, verification codes are valid for 5 minutes only. New codes must be manually requested from your landlord.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.lg },
  iconWrap: { marginBottom: SPACING.lg },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(COLORS.primary) },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  email: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.md },
  // Timer
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(34,197,94,0.08)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  timerText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  // Expired
  expiredBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, backgroundColor: 'rgba(239,68,68,0.08)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  expiredText: { fontSize: FONT_SIZE.sm, color: COLORS.danger, flex: 1, lineHeight: 18 },
  // Mock
  mockBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  mockText: { fontSize: FONT_SIZE.sm, color: COLORS.warning },
  mockCode: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, letterSpacing: 2 },
  // Code input
  codeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  codeInput: { width: 48, height: 56, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceGlass, textAlign: 'center', fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  codeInputFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(34,197,94,0.08)' },
  codeInputExpired: { borderColor: COLORS.danger, opacity: 0.5 },
  // Buttons
  btnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', width: '100%' },
  btn: { flexDirection: 'row', paddingVertical: SPACING.md + 2, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: '#fff' },
  // Info
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, backgroundColor: 'rgba(59,130,246,0.08)',
    padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  infoText: { fontSize: FONT_SIZE.xs, color: COLORS.info, flex: 1, lineHeight: 18 },
});
