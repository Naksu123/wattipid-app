import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, GRADIENTS } from '@/styles/theme';
import Logo from '@/components/ui/Logo';
import s from '@/styles/auth/login.styles';
import TermsAgreementModal from '../../components/modals/TermsAgreementModal';
import { acceptTerms } from '../../services/termsApi';

export default function LoginScreen() {
  const router = useRouter();
  const { login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Terms Update Handling
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (result?.success) {
      const role = result?.user?.role || 'tenant';
      
      if (result.requiresTerms) {
        setPendingRole(role);
        setTermsModalVisible(true);
      } else {
        router.replace(role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
      }
    } else {
      Alert.alert('Login Failed', result?.message || 'Server returned an invalid response.');
    }
  };

  const handleTermsAccept = async (versionId, deviceInfo) => {
    try {
      const result = await acceptTerms(versionId, null, deviceInfo);
      if (result.success) {
        setTermsModalVisible(false);
        router.replace(pendingRole === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
      } else {
        Alert.alert('Error', 'Failed to record terms acceptance. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error while accepting terms.');
    }
  };

  const handleTermsDecline = () => {
    setTermsModalVisible(false);
    // They declined updated terms, so we force them back to login (they can't proceed)
    // Actually we should log them out via auth context to clear the session
    logout(); // Just clear it out
    Alert.alert("Terms Required", "You cannot access your account without accepting the updated Terms and Conditions.");
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Logo size={120} />
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          <View style={s.inputGroup}>
            <Text style={s.label}>Email</Text>
            <View style={[s.inputWrap, errors.email && s.inputErr]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
              <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={COLORS.textMuted}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {errors.email && <Text style={s.errText}>{errors.email}</Text>}
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password && s.inputErr]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
              <TextInput style={s.input} placeholder="Enter your password" placeholderTextColor={COLORS.textMuted}
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.errText}>{errors.password}</Text>}
            
            <TouchableOpacity 
              style={s.forgotBtn} 
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
            <LinearGradient colors={GRADIENTS.primary} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={s.regBtn}>
            <Text style={s.regText}>Dont have an account? <Text style={s.regLink}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Ionicons name="leaf" size={14} color={COLORS.primary} />
          <Text style={s.footerText}>Powered by IoT Technology</Text>
        </View>
      </ScrollView>

      <TermsAgreementModal 
        visible={termsModalVisible} 
        onAccept={handleTermsAccept} 
        onDecline={handleTermsDecline} 
        isLoginMode={true}
      />

    </KeyboardAvoidingView>
  );
}
