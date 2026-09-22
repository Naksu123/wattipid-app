import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  useWindowDimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/auth/verify.styles';

export default function VerifyScreen() {
  const router = useRouter();
  const { email, mockCode } = useLocalSearchParams();
  const { verifyEmail, resendVerificationCode, user } = useAuth();
  const { showModal } = useModal();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive OTP box width calculation (supports 360px - 440px+ Android & iOS screens)
  const boxWidth = Math.min(48, Math.max(40, Math.floor((screenWidth - 48 - 40) / 6)));

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown for resend action
  const [codeExpired, setCodeExpired] = useState(false);

  // Verification status flow: 'idle' | 'verifying' | 'success' | 'invalid' | 'expired' | 'network_error'
  const [verificationState, setVerificationState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef([]);

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // ─── 1. Expiration Countdown Timer ───────────────────────────
  useEffect(() => {
    if (countdown > 0 && !codeExpired) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !codeExpired) {
      setCodeExpired(true);
      setVerificationState('expired');
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Warning);
    }
  }, [countdown, codeExpired]);

  // ─── 2. Resend Cooldown Timer ─────────────────────────────────
  useEffect(() => {
    if (resendCooldown > 0) {
      const cooldownTimer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(cooldownTimer);
    }
  }, [resendCooldown]);

  // ─── 3. Verifying Spin Animation ─────────────────────────────
  useEffect(() => {
    if (verificationState === 'verifying') {
      spinAnim.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [verificationState, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ─── 4. Animation Triggers ────────────────────────────────────
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const triggerIconPulse = () => {
    Animated.sequence([
      Animated.timing(iconScale, { toValue: 1.18, duration: 160, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── 5. Code Input & Auto-Focus Logic ─────────────────────────
  const handleCodeChange = (text, index) => {
    // Clear any previous error on edit
    if (verificationState === 'invalid' || verificationState === 'network_error') {
      setVerificationState('idle');
      setErrorMessage('');
    }

    // Support pasting a full 6-digit code into any input
    const cleanedDigits = text.replace(/[^0-9]/g, '');
    if (cleanedDigits.length === 6) {
      const fullDigits = cleanedDigits.split('');
      setCode(fullDigits);
      setFocusedIndex(5);
      inputRefs.current[5]?.focus();
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    const singleDigit = cleanedDigits.slice(-1);
    const newCode = [...code];
    newCode[index] = singleDigit;
    setCode(newCode);

    if (singleDigit) {
      Haptics.selectionAsync?.();
      if (index < 5) {
        setFocusedIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        setFocusedIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handleAutoFillDemo = () => {
    if (!mockCode) return;
    const digits = String(mockCode).trim().split('').slice(0, 6);
    if (digits.length === 6) {
      setCode(digits);
      setFocusedIndex(5);
      inputRefs.current[5]?.focus();
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // ─── 6. Verification Submission Handler ───────────────────────
  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      triggerShake();
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Warning);
      setVerificationState('invalid');
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (codeExpired) {
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Warning);
      showModal({
        type: 'warning',
        title: 'Verification Code Expired',
        message: 'This verification code has expired.\n\nPlease tap "Resend Verification Code" to receive a fresh code.'
      });
      return;
    }

    // Enter verifying interactive state
    Keyboard.dismiss();
    setVerificationState('verifying');
    setErrorMessage('');
    triggerIconPulse();

    try {
      const result = await verifyEmail(email, fullCode);

      if (result?.success) {
        setVerificationState('success');
        triggerIconPulse();
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

        const targetRoute = (result.data?.user?.role === 'landlord' || user?.role === 'landlord')
          ? '/(landlord)/overview'
          : '/(tenant)/dashboard';

        // Brief smooth delay so user perceives the verified checkmark transition
        setTimeout(() => {
          showModal({
            type: 'success',
            title: 'Email Verified',
            message: 'Your email address has been verified successfully. Welcome to Wattipid!',
            onPrimaryPress: () => router.replace(targetRoute)
          });
        }, 600);

      } else {
        // Handle failure
        triggerShake();
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);

        if (result?.status === 'expired') {
          setCodeExpired(true);
          setVerificationState('expired');
          setErrorMessage('This verification code has expired. Request a new code below.');
        } else {
          setVerificationState('invalid');
          setErrorMessage(result?.message || 'Invalid verification code. Please check and try again.');
        }
      }
    } catch (err) {
      triggerShake();
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
      setVerificationState('network_error');
      setErrorMessage('Unable to reach verification server. Please check your connection and retry.');
    }
  };

  // ─── 7. Resend Code Handler ───────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0 || verificationState === 'verifying') return;

    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    setVerificationState('verifying');
    setErrorMessage('');

    try {
      const result = await resendVerificationCode(email);
      if (result?.success) {
        setCountdown(300); // Reset 5-minute timer
        setResendCooldown(45); // 45-second cooldown
        setCodeExpired(false);
        setCode(['', '', '', '', '', '']);
        setFocusedIndex(0);
        setVerificationState('idle');
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

        showModal({
          type: 'success',
          title: 'Code Sent',
          message: 'A new 6-digit verification code has been dispatched to your email address.\n\n' +
            (result.mockCode ? `[Demo Preview] Code: ${result.mockCode}` : '')
        });
        inputRefs.current[0]?.focus();
      } else {
        setVerificationState('idle');
        showModal({
          type: 'error',
          title: 'Resend Failed',
          message: result?.message || 'Unable to send a new verification code right now. Please try again later.'
        });
      }
    } catch (err) {
      setVerificationState('network_error');
      setErrorMessage('Network error while requesting new code. Please try again.');
    }
  };

  const isComplete = code.join('').length === 6;
  const isVerifying = verificationState === 'verifying';
  const isSuccess = verificationState === 'success';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ═══════════════════════════════════════════════════════════
                TOP NAVIGATION BAR
               ═══════════════════════════════════════════════════════════ */}
            <View style={s.topBar}>
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(auth)/welcome');
                  }
                }}
                style={s.backBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <View style={s.securityPill}>
                <Ionicons name="lock-closed" size={11} color={COLORS.primary} />
                <Text style={s.securityPillText}>256-bit Secure</Text>
              </View>
            </View>

            {/* ═══════════════════════════════════════════════════════════
                CENTER CONTENT: HEADING & INTERACTIVE BADGE
               ═══════════════════════════════════════════════════════════ */}
            <View style={s.centerContent}>
              {/* Animated Interactive Icon Badge */}
              <Animated.View
                style={[
                  s.iconBadge,
                  isVerifying && s.iconBadgeVerifying,
                  isSuccess && s.iconBadgeSuccess,
                  verificationState === 'invalid' && s.iconBadgeError,
                  codeExpired && s.iconBadgeExpired,
                  { transform: [{ scale: iconScale }] },
                ]}
              >
                {isVerifying ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="sync" size={22} color={COLORS.primary} />
                  </Animated.View>
                ) : isSuccess ? (
                  <Ionicons name="checkmark-circle" size={26} color={COLORS.success} />
                ) : verificationState === 'invalid' ? (
                  <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
                ) : codeExpired ? (
                  <Ionicons name="lock-closed" size={22} color={COLORS.warning} />
                ) : (
                  <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
                )}
              </Animated.View>

              {/* Heading */}
              <Text style={s.title}>
                {isSuccess
                  ? 'Email Verified'
                  : codeExpired
                  ? 'Verification Code Expired'
                  : 'Verify Your Email'}
              </Text>

              {/* Supporting Message */}
              <Text style={s.subtitle}>
                {codeExpired
                  ? 'Your 6-digit code has expired for security.'
                  : 'We sent a 6-digit verification code to'}
              </Text>

              {/* Recipient Email Address Badge */}
              {!codeExpired && (
                <View style={s.emailBadge}>
                  <Ionicons name="mail" size={12} color={COLORS.primaryLight} />
                  <Text style={s.emailText} numberOfLines={1} ellipsizeMode="middle">
                    {email || 'your email address'}
                  </Text>
                </View>
              )}

              {/* Expiration Timer Status Pill */}
              {!codeExpired ? (
                <View style={[s.timerPill, countdown <= 60 && s.timerPillWarn]}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={countdown <= 60 ? '#F59E0B' : COLORS.primary}
                  />
                  <Text style={[s.timerText, countdown <= 60 && s.timerTextWarn]}>
                    Expires in {formatCountdown(countdown)}
                  </Text>
                </View>
              ) : (
                <View style={[s.timerPill, s.timerPillExpired]}>
                  <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                  <Text style={[s.timerText, s.timerTextExpired]}>Code expired</Text>
                </View>
              )}

              {/* Demo / Mock Code Autofill Hint (Development / Demo Mode) */}
              {mockCode && !codeExpired && (
                <View style={s.mockBox}>
                  <Ionicons name="code-slash" size={14} color={COLORS.warning} />
                  <Text style={s.mockText}>
                    Demo Code: <Text style={s.mockCode}>{mockCode}</Text>
                  </Text>
                  <TouchableOpacity
                    style={s.mockAutoFillBtn}
                    onPress={handleAutoFillDemo}
                    activeOpacity={0.75}
                  >
                    <Text style={s.mockAutoFillText}>Fill</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  6-DIGIT OTP INPUT ROW (WITH SHAKE ANIMATION)
                 ═══════════════════════════════════════════════════════════ */}
              <Animated.View
                style={[
                  s.codeRow,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                {code.map((digit, i) => {
                  const isFocused = focusedIndex === i;
                  const isFilled = !!digit;
                  const isError = verificationState === 'invalid';

                  return (
                    <TextInput
                      key={i}
                      ref={(ref) => { inputRefs.current[i] = ref; }}
                      style={[
                        s.codeInput,
                        { width: boxWidth },
                        isFilled && s.codeInputFilled,
                        isFocused && s.codeInputFocused,
                        isError && s.codeInputError,
                        codeExpired && s.codeInputExpired,
                      ]}
                      value={digit}
                      onChangeText={(t) => handleCodeChange(t, i)}
                      onKeyPress={(e) => handleKeyPress(e, i)}
                      onFocus={() => setFocusedIndex(i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!codeExpired && !isVerifying && !isSuccess}
                      accessibilityLabel={`Digit ${i + 1} of 6`}
                      accessibilityRole="text"
                    />
                  );
                })}
              </Animated.View>

              {/* ═══════════════════════════════════════════════════════════
                  CONTEXTUAL FEEDBACK / ERROR BANNER
                 ═══════════════════════════════════════════════════════════ */}
              {isVerifying ? (
                <View style={[s.statusBanner, s.statusBannerVerifying]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[s.statusBannerText, { color: COLORS.primary }]}>
                    Verifying your code securely...
                  </Text>
                </View>
              ) : isSuccess ? (
                <View style={[s.statusBanner, s.statusBannerSuccess]}>
                  <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                  <Text style={[s.statusBannerText, { color: COLORS.success, fontWeight: '600' }]}>
                    Code verified successfully!
                  </Text>
                </View>
              ) : errorMessage ? (
                <View
                  style={[
                    s.statusBanner,
                    verificationState === 'expired' ? s.statusBannerExpired : s.statusBannerError,
                  ]}
                >
                  <Ionicons
                    name={verificationState === 'expired' ? 'lock-closed' : 'alert-circle'}
                    size={15}
                    color={verificationState === 'expired' ? '#F59E0B' : COLORS.danger}
                  />
                  <Text
                    style={[
                      s.statusBannerText,
                      { color: verificationState === 'expired' ? '#F59E0B' : COLORS.danger },
                    ]}
                  >
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* ═══════════════════════════════════════════════════════════
                  PRIMARY ACTION: VERIFY EMAIL BUTTON
                 ═══════════════════════════════════════════════════════════ */}
              <TouchableOpacity
                onPress={handleVerify}
                activeOpacity={0.85}
                disabled={!isComplete || isVerifying || isSuccess || codeExpired}
                style={[
                  s.btnWrap,
                  (!isComplete || codeExpired) && s.btnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Verify Email"
              >
                <LinearGradient
                  colors={
                    isSuccess
                      ? [COLORS.success, '#059669']
                      : (!isComplete || codeExpired)
                      ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
                      : GRADIENTS.primary
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btn}
                >
                  {isVerifying ? (
                    <>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={s.btnText}>Verifying...</Text>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Ionicons name="checkmark" size={18} color="#ffffff" />
                      <Text style={s.btnText}>Verified</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="shield-checkmark"
                        size={17}
                        color={!isComplete || codeExpired ? COLORS.textMuted : '#ffffff'}
                      />
                      <Text
                        style={[
                          s.btnText,
                          (!isComplete || codeExpired) && { color: COLORS.textMuted },
                        ]}
                      >
                        Verify Email
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ═══════════════════════════════════════════════════════════
                  SECONDARY ACTION: RESEND CODE (GHOST / LINK TREATMENT)
                 ═══════════════════════════════════════════════════════════ */}
              <TouchableOpacity
                onPress={handleResendCode}
                activeOpacity={0.75}
                disabled={resendCooldown > 0 || isVerifying || isSuccess}
                style={[s.resendBtn, resendCooldown > 0 && s.resendBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={resendCooldown > 0 ? COLORS.textMuted : COLORS.primary}
                />
                <Text
                  style={
                    resendCooldown > 0 ? s.resendBtnTextMuted : s.resendBtnText
                  }
                >
                  {resendCooldown > 0
                    ? `Resend code in ${String(resendCooldown).padStart(2, '0')}s`
                    : 'Resend Verification Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ═══════════════════════════════════════════════════════════
                SECURITY INFORMATION FOOTER
               ═══════════════════════════════════════════════════════════ */}
            <View style={s.securityCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={COLORS.primary}
                style={{ marginTop: 1 }}
              />
              <Text style={s.securityCardText}>
                For your account security, verification codes expire after 5 minutes. If your code has expired, tap resend above or contact your property administrator.
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
