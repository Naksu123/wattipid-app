import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { BaseModal } from '@/components/modals/BaseModal';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/tenant/edit-profile.styles';

const formatRoomName = (roomId) => {
  if (!roomId) return 'Assigned Room';
  const str = String(roomId).trim();
  return str.toLowerCase().startsWith('room') ? str : `Room ${str}`;
};

const StrengthIndicator = ({ strength }) => {
  const colors = ['#EF4444', '#F59E0B', '#FACC15', '#22C55E', '#10B981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return (
    <View style={{ marginTop: 2 }}>
      <View style={s.strengthBar}>
        <View style={[s.strengthFill, { width: `${(strength / 4) * 100}%`, backgroundColor: colors[strength] }]} />
      </View>
      <Text style={[s.strengthLabel, { color: colors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
};

const InputField = ({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  error,
  secureTextEntry,
  showToggle,
  toggleValue,
  onToggle,
  keyboardType,
  activeField,
  setActiveField,
}) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputWrapper, activeField === label && s.inputWrapperActive, error && { borderColor: COLORS.danger }]}>
      <Ionicons name={icon} size={15} color={activeField === label ? COLORS.primary : COLORS.textMuted} style={s.inputIcon} />
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
        selectionColor={COLORS.primary}
      />
      {showToggle && (
        <TouchableOpacity style={s.eyeIcon} onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={toggleValue ? 'eye-off-outline' : 'eye-outline'} size={15} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    {error ? (
      <View style={s.validationRow}>
        <Ionicons name="alert-circle" size={11} color={COLORS.danger} />
        <Text style={s.validationText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

export default function EditProfileModal({ visible, onClose }) {
  const { user, updateProfile, changePassword } = useAuth();
  const { showModal } = useModal();

  // Profile states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);

  // Validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [strength, setStrength] = useState(0);

  // Synchronize on modal open
  useEffect(() => {
    if (visible) {
      setName(user?.name || user?.username || '');
      setEmail(user?.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setEmailError('');
      setPasswordError('');
      setStrength(0);
      setActiveField(null);
    }
  }, [visible, user]);

  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !regex.test(val)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) {
      setStrength(0);
      return;
    }
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setStrength(score);
  };

  const handleNameChange = (val) => {
    setName(val);
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    validateEmail(val);
  };

  const handleNewPasswordChange = (val) => {
    setNewPassword(val);
    calculatePasswordStrength(val);
    if (confirmPassword && val !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (newPassword && val !== newPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      showModal({ type: 'warning', title: 'Name Required', message: 'Full name cannot be empty.' });
      return;
    }

    if (!trimmedEmail) {
      showModal({ type: 'warning', title: 'Email Required', message: 'Email address cannot be empty.' });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      showModal({ type: 'error', title: 'Invalid Email', message: 'Please provide a valid email address.' });
      return;
    }

    const hasPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);

    if (hasPasswordChange) {
      if (!currentPassword) {
        showModal({ type: 'warning', title: 'Current Password Required', message: 'Please enter your current password to authorize security updates.' });
        return;
      }
      if (!newPassword) {
        showModal({ type: 'warning', title: 'New Password Required', message: 'Please enter a new password.' });
        return;
      }
      if (newPassword.length < 6) {
        showModal({ type: 'warning', title: 'Password Too Short', message: 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        showModal({ type: 'error', title: 'Password Mismatch', message: 'New password and confirmation do not match.' });
        return;
      }
    }

    const hasProfileChange = trimmedName !== (user?.name || '') || trimmedEmail !== (user?.email || '');

    if (!hasProfileChange && !hasPasswordChange) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      if (hasProfileChange) {
        const res = await updateProfile(trimmedName, trimmedEmail);
        if (!res?.success) {
          throw new Error(res?.message || 'Profile update failed');
        }
      }

      if (hasPasswordChange) {
        const res = await changePassword(currentPassword, newPassword);
        if (!res?.success) {
          throw new Error(res?.message || 'Password update failed');
        }
      }

      showModal({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your account details have been successfully saved.',
      });
      onClose();
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not save your profile changes. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const userInitial = trimmedInitial(name, user?.name);

  return (
    <BaseModal visible={visible} onClose={onClose} centered={true}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <Ionicons name="person-circle-outline" size={19} color={COLORS.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>Edit Profile</Text>
            <Text style={s.headerSubtitle}>Update account & credentials</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.closeBtn}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close edit profile modal"
        >
          <Ionicons name="close" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* User Identity Chip */}
        <View style={s.profileHeader}>
          <View style={s.avatarWrap}>
            <Text style={s.avatarText}>{userInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName} numberOfLines={1}>{name || user?.name || 'Tenant'}</Text>
            <Text style={s.profileRoom} numberOfLines={1}>{formatRoomName(user?.room_id)}</Text>
          </View>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>Tenant</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <View style={s.card}>
            <InputField
              label="FULL NAME"
              value={name}
              onChangeText={handleNameChange}
              icon="person-outline"
              placeholder="Ex. Juan Dela Cruz"
              activeField={activeField}
              setActiveField={setActiveField}
            />
            <InputField
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={handleEmailChange}
              icon="mail-outline"
              placeholder="juan@example.com"
              keyboardType="email-address"
              error={emailError}
              activeField={activeField}
              setActiveField={setActiveField}
            />
          </View>
        </View>

        {/* Security & Password */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Security & Password</Text>
          <View style={s.card}>
            <Text style={s.helperText}>Leave password fields blank to keep your current password.</Text>

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

            <InputField
              label="NEW PASSWORD"
              value={newPassword}
              onChangeText={handleNewPasswordChange}
              icon="shield-checkmark-outline"
              placeholder="Min. 6 characters"
              secureTextEntry={!showNew}
              showToggle={true}
              toggleValue={showNew}
              onToggle={() => setShowNew(!showNew)}
              activeField={activeField}
              setActiveField={setActiveField}
            />
            {newPassword ? <StrengthIndicator strength={strength} /> : null}

            <InputField
              label="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
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
          </View>
        </View>

        {/* Modal Footer inside ScrollView - Always reachable and scrollable */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Discard changes"
          >
            <Text style={s.cancelBtnText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
          >
            {loading ? (
              <View style={s.saveBtnLoading}>
                <ActivityIndicator color="#042F2E" size="small" />
              </View>
            ) : (
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveBtnGradient}
              >
                <Ionicons name="checkmark-sharp" size={15} color="#042F2E" />
                <Text style={s.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BaseModal>
  );
}

function trimmedInitial(name, fallback) {
  const target = (name && name.trim()) || (fallback && fallback.trim()) || 'Tenant';
  return target.charAt(0).toUpperCase();
}
