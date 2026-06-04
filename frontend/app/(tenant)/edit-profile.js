import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/edit-profile.styles';

const StrengthIndicator = ({ strength }) => {
  const colors = ['#EF4444', '#F59E0B', '#FACC15', '#22C55E', '#10B981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return (
    <View>
      <View style={s.strengthBar}>
        <View style={[s.strengthFill, { width: `${(strength / 4) * 100}%`, backgroundColor: colors[strength] }]} />
      </View>
      <Text style={[s.strengthLabel, { color: colors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
};

const InputField = ({ label, value, onChangeText, icon, placeholder, error, secureTextEntry, showToggle, toggleValue, onToggle, keyboardType, activeField, setActiveField }) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputWrapper, activeField === label && s.inputWrapperActive, error && { borderColor: COLORS.danger }]}>
      <Ionicons name={icon} size={20} color={activeField === label ? COLORS.primary : COLORS.textMuted} style={s.inputIcon} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        onFocus={() => setActiveField(label)}
        onBlur={() => setActiveField(null)}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {showToggle && (
        <TouchableOpacity style={s.eyeIcon} onPress={onToggle}>
          <Ionicons name={toggleValue ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    {error ? (
      <View style={s.validationRow}>
        <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
        <Text style={s.validationText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

export default function EditProfile() {
  const router = useRouter();
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);

  // Validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [strength, setStrength] = useState(0); // 0-4

  useEffect(() => {
    validateEmail(email);
  }, [email]);

  useEffect(() => {
    calculatePasswordStrength(newPassword);
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword]);

  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !regex.test(val)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) { setStrength(0); return; }
    let s = 0;
    if (pass.length > 6) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    setStrength(s);
  };

  const handleSave = async () => {
    if (emailError) { Alert.alert('Invalid Email', 'Please provide a valid email address.'); return; }
    if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return; }

    setLoading(true);
    try {
      // 1. Update Profile (Name/Email)
      if (name !== user.name || email !== user.email) {
        const res = await updateProfile(name, email);
        if (!res.success) throw new Error(res.message);
      }

      // 2. Change Password if fields are filled
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
        if (strength < 2) throw new Error('New password is too weak');
        
        const res = await changePassword(currentPassword, newPassword);
        if (!res.success) throw new Error(res.message);
      }

      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.navigate('/(tenant)/settings') }
      ]);
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.navigate('/(tenant)/settings')}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <View style={s.placeholder} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* --- PROFILE AVATAR --- */}
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.primary }}>
                {name ? name.charAt(0).toUpperCase() : 'T'}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.textPrimary }}>{user?.name || 'Tenant'}</Text>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Room {user?.room_id || 'N/A'}</Text>
          </View>

          {/* --- PERSONAL INFO --- */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Personal Information</Text>
            <GlassCard style={s.card}>
              <InputField
                label="FULL NAME"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                placeholder="Ex. Juan Dela Cruz"
                activeField={activeField}
                setActiveField={setActiveField}
              />
              <InputField
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                placeholder="juan@example.com"
                keyboardType="email-address"
                error={emailError}
                activeField={activeField}
                setActiveField={setActiveField}
              />
            </GlassCard>
          </View>

          {/* --- SECURITY --- */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Security & Password</Text>
            <GlassCard style={s.card}>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Leave password fields blank to keep current password.</Text>
              
              <InputField
                label="CURRENT PASSWORD"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                icon="lock-closed-outline"
                placeholder="••••••••"
                secureTextEntry={!showCurrent}
                showToggle={true}
                toggleValue={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
                activeField={activeField}
                setActiveField={setActiveField}
              />

              <View style={{ height: 10 }} />

              <InputField
                label="NEW PASSWORD"
                value={newPassword}
                onChangeText={setNewPassword}
                icon="shield-checkmark-outline"
                placeholder="Minimum 6 characters"
                secureTextEntry={!showNew}
                showToggle={true}
                toggleValue={showNew}
                onToggle={() => setShowNew(!showNew)}
                activeField={activeField}
                setActiveField={setActiveField}
              />
              {newPassword ? <StrengthIndicator strength={strength} /> : null}

              <View style={{ height: 10 }} />

              <InputField
                label="CONFIRM NEW PASSWORD"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="shield-checkmark-outline"
                placeholder="Repeat new password"
                secureTextEntry={!showConfirm}
                showToggle={true}
                toggleValue={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                error={passwordError}
                activeField={activeField}
                setActiveField={setActiveField}
              />
            </GlassCard>
          </View>

          <View style={s.footer}>
            <TouchableOpacity 
              style={[s.saveBtn, loading && s.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={s.cancelBtn} onPress={() => router.navigate('/(tenant)/settings')}>
              <Text style={s.cancelBtnText}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
