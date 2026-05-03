import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS, GRADIENTS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (result.success) {
      router.replace(result.user.role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard');
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <LinearGradient colors={GRADIENTS.primary} style={s.logoCircle}>
            <Ionicons name="flash" size={42} color="#fff" />
          </LinearGradient>
          <Text style={s.appName}>Wattipid</Text>
          <Text style={s.tagline}>Smart Energy Monitoring</Text>
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
          </View>

          <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} disabled={isLoading} style={s.btnWrap}>
            <LinearGradient colors={GRADIENTS.primary} start={{x:0,y:0}} end={{x:1,y:0}} style={s.btn}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.demoBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
            <Text style={s.demoText}>Demo: admin@wattipid.com / admin123</Text>
          </View>

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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl + 20, paddingBottom: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow(COLORS.primary) },
  appName: { fontSize: FONT_SIZE.hero, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, letterSpacing: 1, marginTop: SPACING.md },
  tagline: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, ...SHADOWS.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 52, gap: SPACING.sm },
  inputErr: { borderColor: COLORS.danger },
  input: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: SPACING.xs },
  btnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btn: { paddingVertical: SPACING.md + 2, alignItems: 'center' },
  btnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: '#fff' },
  demoBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(59,130,246,0.08)', padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  demoText: { fontSize: FONT_SIZE.xs, color: COLORS.info, flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginHorizontal: SPACING.md },
  regBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  regText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  regLink: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.xs },
  footerText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
