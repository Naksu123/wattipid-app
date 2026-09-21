import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/styles/theme';
import { apiCall } from '../../services/api';
import AlertModal from '../../components/modals/AlertModal';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params?.role || 'tenant'; // 'tenant' | 'landlord'

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

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (role === 'landlord') {
        router.push('/(auth)/landlord-login');
      } else {
        router.push('/(auth)/tenant-login');
      }
    }
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
      setTimeout(() => {
        if (role === 'landlord') {
          router.replace('/(auth)/landlord-login');
        } else {
          router.replace('/(auth)/tenant-login');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const isLandlord = role === 'landlord';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Top Bar with Role Indicator */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.roleBadge, isLandlord && styles.roleBadgeLandlord]}>
              <Ionicons 
                name={isLandlord ? "business-outline" : "home-outline"} 
                size={13} 
                color={isLandlord ? "#60A5FA" : "#10B981"} 
              />
              <Text style={[styles.roleBadgeText, isLandlord && styles.roleBadgeTextLandlord]}>
                {isLandlord ? "LANDLORD RECOVERY" : "TENANT RECOVERY"}
              </Text>
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconAura, isLandlord && styles.iconAuraLandlord]}>
              <Ionicons name="key-outline" size={32} color={isLandlord ? "#3B82F6" : "#10B981"} />
            </View>
            <Text style={styles.title}>Account Recovery</Text>
            <Text style={styles.subtitle}>
              {step === 1 && `Enter your registered ${isLandlord ? 'landlord' : 'tenant'} email to receive a secure recovery code.`}
              {step === 2 && "Enter the 6-digit recovery code sent to your inbox."}
              {step === 3 && "Create a new password to restore access to your account."}
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            {step === 1 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>REGISTERED EMAIL</Text>
                <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={isLandlord ? "landlord.admin@gmail.com" : "tenant.alex@gmail.com"}
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (error) setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="#475569"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val);
                      if (error) setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    letterSpacing={8}
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="#475569"
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (error) setError('');
                      }}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                  <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#475569"
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (error) setError('');
                      }}
                      secureTextEntry
                    />
                  </View>
                </View>
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Action Buttons */}
            {step === 1 && (
              <TouchableOpacity 
                style={[styles.primaryBtn, isLandlord && styles.primaryBtnLandlord]} 
                onPress={handleRequestOTP} 
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color={isLandlord ? "#FFFFFF" : "#062E1F"} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, isLandlord && styles.primaryBtnTextLandlord]}>
                    Send Reset Code
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {step === 2 && (
              <TouchableOpacity 
                style={[styles.primaryBtn, isLandlord && styles.primaryBtnLandlord]} 
                onPress={handleVerifyOTP} 
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color={isLandlord ? "#FFFFFF" : "#062E1F"} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, isLandlord && styles.primaryBtnTextLandlord]}>
                    Verify Code
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {step === 3 && (
              <TouchableOpacity 
                style={[styles.primaryBtn, isLandlord && styles.primaryBtnLandlord]} 
                onPress={handleResetPassword} 
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color={isLandlord ? "#FFFFFF" : "#062E1F"} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, isLandlord && styles.primaryBtnTextLandlord]}>
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Return to Login */}
          <TouchableOpacity 
            style={styles.returnRow} 
            onPress={() => {
              if (isLandlord) {
                router.push('/(auth)/landlord-login');
              } else {
                router.push('/(auth)/tenant-login');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.returnText}>
              Remembered your password? <Text style={[styles.returnLink, isLandlord && styles.returnLinkLandlord]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  roleBadgeLandlord: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.6,
  },
  roleBadgeTextLandlord: {
    color: '#60A5FA',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconAura: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 16,
  },
  iconAuraLandlord: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
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
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#0E1626',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
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
    marginBottom: 16,
    marginLeft: 4,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnLandlord: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#062E1F',
    letterSpacing: 0.2,
  },
  primaryBtnTextLandlord: {
    color: '#FFFFFF',
  },
  returnRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  returnText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  returnLink: {
    color: '#10B981',
    fontWeight: '700',
  },
  returnLinkLandlord: {
    color: '#60A5FA',
  },
});
