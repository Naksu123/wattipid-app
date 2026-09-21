import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { getSetting, setSetting } from '../../services/database';
import { updatePenaltySettings, getPenaltySettings } from '../../services/penaltyService';
import { BaseModal, ModalHeader, ModalBody, ModalFooter, SignOutModal } from '../../components/modals/BaseModal';
import { Switch } from 'react-native';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/settings.styles';

export default function LandlordSettings() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const { showModal } = useModal();
  
  // Rate state
  const [rateVisible, setRateVisible] = useState(false);
  const [rate, setRate] = useState('');
  const [newRate, setNewRate] = useState('');

  // Profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Notifications state
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifHighCons, setNotifHighCons] = useState(true);
  const [notifNewTenant, setNotifNewTenant] = useState(true);
  const [notifRevoke, setNotifRevoke] = useState(true);

  // About state
  const [aboutVisible, setAboutVisible] = useState(false);

  // Penalty Config Modal
  const [penaltyVisible, setPenaltyVisible] = useState(false);
  const [penaltyGrace, setPenaltyGrace] = useState('3');
  const [penaltyRate, setPenaltyRate] = useState('2.00');

  // Confirmation Modals
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useEffect(() => { 
    loadSettings(); 
  }, []);

  const loadSettings = async () => {
    try {
      const r = await getSetting('rate_per_kwh');
      if (r) setRate(r);

      const nb = await getSetting('landlord_notif_budget');
      if (nb !== null) setNotifBudget(nb !== 'false');
      const nhc = await getSetting('landlord_notif_high_cons');
      if (nhc !== null) setNotifHighCons(nhc !== 'false');
      const nnt = await getSetting('landlord_notif_new_tenant');
      if (nnt !== null) setNotifNewTenant(nnt !== 'false');
      const nr = await getSetting('landlord_notif_revoke');
      if (nr !== null) setNotifRevoke(nr !== 'false');
    } catch (err) {
      console.warn('[LandlordSettings] Failed to load settings:', err);
    }

    try {
      const pen = await getPenaltySettings();
      if (pen.penalty_grace_period_days) setPenaltyGrace(pen.penalty_grace_period_days);
      if (pen.penalty_rate) setPenaltyRate(pen.penalty_rate);
    } catch (e) {
      console.warn('[LandlordSettings] Failed to load penalty config:', e);
    }
  };

  const handleOpenRate = () => {
    setNewRate(rate);
    setRateVisible(true);
  };

  const handleSaveRate = async () => {
    const val = parseFloat(newRate);
    if (!val || val <= 0) { 
      showModal({ type: 'warning', title: 'Invalid', message: 'Please enter a valid rate' }); 
      return; 
    }
    await setSetting('rate_per_kwh', val.toFixed(2));
    setRate(val.toFixed(2));
    setRateVisible(false);
    showModal({ type: 'success', title: 'Updated', message: `Electricity rate updated to ₱${val.toFixed(2)}/kWh` });
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { showModal({ type: 'error', title: 'Error', message: 'Name cannot be empty' }); return; }
    const r = await updateProfile(name, email);
    if (r.success) { showModal({ type: 'success', title: 'Success', message: 'Profile updated' }); setEditing(false); }
    else showModal({ type: 'error', title: 'Error', message: r.message || 'Failed to update' });
  };

  const handleLogout = () => setLogoutConfirmVisible(true);

  const handleConfirmLogout = () => {
    setLogoutConfirmVisible(false);
    logout();
    router.replace('/(auth)/login');
  };

  const handleSaveNotifications = async () => {
    await Promise.all([
      setSetting('landlord_notif_budget', notifBudget.toString()),
      setSetting('landlord_notif_high_cons', notifHighCons.toString()),
      setSetting('landlord_notif_new_tenant', notifNewTenant.toString()),
      setSetting('landlord_notif_revoke', notifRevoke.toString()),
    ]);
    setNotifVisible(false);
    showModal({ type: 'success', title: 'Saved', message: 'Notification preferences updated.' });
  };

  const handleSavePenalty = async () => {
    try {
      await updatePenaltySettings({
        penalty_grace_period_days: penaltyGrace,
        penalty_rate: penaltyRate
      });
      setPenaltyVisible(false);
      showModal({ type: 'success', title: 'Saved', message: 'Penalty configuration updated successfully.' });
    } catch (e) {
      showModal({ type: 'error', title: 'Error', message: e.message || 'Failed to update penalty config' });
    }
  };

  // Compute initials for landlord avatar
  const landlordInitials = useMemo(() => {
    if (!user?.name) return 'LA';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  const MenuItem = ({ icon, label, value, onPress, danger = false, highlighted = false, iconColor = '#10B981' }) => (
    <TouchableOpacity 
      style={[styles.menuItem, highlighted && styles.highlightedItem]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={icon} size={17} color={danger ? '#EF4444' : iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#64748B" />
    </TouchableOpacity>
  );

  const ToggleRow = ({ label, desc, value, onToggle }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
        thumbColor={value ? '#10B981' : '#64748B'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ================= HEADER (Matches landlord-settings.png) ================= */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subtitle}>Control Panel</Text>
            <Text style={styles.title}>Settings</Text>
          </View>
          <View style={styles.gearBtn}>
            <Ionicons name="settings-outline" size={18} color="#10B981" />
          </View>
        </View>

        {/* ================= PROFILE CARD ================= */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{landlordInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Landlord Admin'}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email || 'admin@wattipid.com'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>LANDLORD ADMIN</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setEditing(true)} 
            style={styles.editProfileBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={14} color="#10B981" />
            <Text style={styles.editProfileText}>Edit Account Details</Text>
          </TouchableOpacity>
        </View>

        {/* ================= FACILITY TOOLS ================= */}
        <Text style={styles.groupTitle}>FACILITY TOOLS</Text>
        <View style={styles.menuCard}>
          <MenuItem 
            icon="pulse-outline" 
            label="Electricity Billing Rate" 
            value={`Currently ₱${rate || '0.00'}/kWh`} 
            onPress={handleOpenRate} 
            iconColor="#10B981"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="warning-outline" 
            label="Penalty Configuration" 
            value="Grace period & late fees" 
            onPress={() => setPenaltyVisible(true)} 
            iconColor="#F59E0B"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="bulb-outline" 
            label="Manage Electricity Tips" 
            value="Curate tips for student saving habits" 
            highlighted={true} 
            onPress={() => router.push('/(landlord)/manage-tips')} 
            iconColor="#10B981"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="notifications-outline" 
            label="Notification Alerts" 
            value="Configure system triggers" 
            onPress={() => setNotifVisible(true)} 
            iconColor="#38BDF8"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="shield-checkmark-outline" 
            label="System Audit Logs" 
            value="Immutable compliance records" 
            onPress={() => router.push('/(landlord)/audit')} 
            iconColor="#8B5CF6"
          />
        </View>

        {/* ================= SYSTEM CONFIG ================= */}
        <Text style={styles.groupTitle}>SYSTEM CONFIG</Text>
        <View style={styles.menuCard}>
          <MenuItem 
            icon="book-outline" 
            label="App User Manual" 
            value="How to use the Wattipid app" 
            onPress={() => router.push('/(landlord)/user-manual')} 
            iconColor="#10B981"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="hardware-chip-outline" 
            label="Installation & User Manual" 
            value="System documentation & wiring" 
            onPress={() => router.push('/(landlord)/manual')} 
            iconColor="#38BDF8"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="document-text-outline" 
            label="Terms and Conditions" 
            value="System Legal Policies" 
            onPress={() => router.push('/terms')} 
            iconColor="#64748B"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="information-circle-outline" 
            label="About System" 
            value="Wattipid v2.1.0-prod" 
            onPress={() => setAboutVisible(true)} 
            iconColor="#64748B"
          />
        </View>

        {/* ================= SIGN OUT ACCOUNT ================= */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>Wattipid Energy Management • Build 2026.05</Text>
      </ScrollView>

      {/* ================= MODALS ================= */}
      {/* Rate Change Modal */}
      <BaseModal visible={rateVisible} onClose={() => setRateVisible(false)}>
        <ModalHeader title="Update Billing Rate" icon="cash" onClose={() => setRateVisible(false)} />
        <ModalBody>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RATE PER KWH (₱)</Text>
              <TextInput 
                style={styles.input} 
                value={newRate} 
                onChangeText={setNewRate} 
                placeholder="e.g. 12.50" 
                placeholderTextColor={COLORS.textMuted} 
                keyboardType="numeric" 
              />
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>This rate will be used for all future calculations.</Text>
            </View>
          </View>
        </ModalBody>
        <ModalFooter primaryLabel="Save Rate" onPrimaryPress={handleSaveRate} secondaryLabel="Cancel" onSecondaryPress={() => setRateVisible(false)} />
      </BaseModal>

      {/* Edit Profile Modal */}
      <BaseModal visible={editing} onClose={() => setEditing(false)}>
        <ModalHeader title="Edit Profile" icon="person" onClose={() => setEditing(false)} />
        <ModalBody>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={COLORS.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
        </ModalBody>
        <ModalFooter primaryLabel="Save Changes" onPrimaryPress={handleSaveProfile} secondaryLabel="Cancel" onSecondaryPress={() => setEditing(false)} />
      </BaseModal>

      {/* Notifications Modal */}
      <BaseModal visible={notifVisible} onClose={() => setNotifVisible(false)}>
        <ModalHeader title="Notification Alerts" icon="notifications" onClose={() => setNotifVisible(false)} />
        <ModalBody>
          <Text style={{ color: '#94A3B8', marginBottom: 12, fontSize: 12.5 }}>Choose which events trigger alerts for you.</Text>
          <View style={styles.toggleList}>
            <ToggleRow label="Budget Exceeded" desc="When a tenant hits their limit" value={notifBudget} onToggle={setNotifBudget} />
            <ToggleRow label="High Consumption" desc="When usage spikes unexpectedly" value={notifHighCons} onToggle={setNotifHighCons} />
            <ToggleRow label="New Tenant" desc="When a new account is registered" value={notifNewTenant} onToggle={setNotifNewTenant} />
            <ToggleRow label="Tenant Revoked" desc="When access is removed" value={notifRevoke} onToggle={setNotifRevoke} />
          </View>
        </ModalBody>
        <ModalFooter primaryLabel="Save Preferences" onPrimaryPress={handleSaveNotifications} secondaryLabel="Discard" onSecondaryPress={() => setNotifVisible(false)} />
      </BaseModal>

      {/* Penalty Settings Modal */}
      <BaseModal visible={penaltyVisible} onClose={() => setPenaltyVisible(false)}>
        <ModalHeader title="Penalty Settings" icon="warning" iconColor="#EF4444" onClose={() => setPenaltyVisible(false)} />
        <ModalBody>
          <Text style={{ color: '#94A3B8', marginBottom: 12, fontSize: 12 }}>3-Day Payment Policy: Tenants must settle within 3 calendar days after receiving billing statement.</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PAYMENT DUE PERIOD (DAYS)</Text>
              <TextInput style={[styles.input, { opacity: 0.5 }]} value="3" editable={false} keyboardType="numeric" />
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>Fixed at 3 days per billing policy</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PENALTY RATE (% OF TOTAL BILL)</Text>
              <TextInput style={styles.input} value={penaltyRate} onChangeText={setPenaltyRate} keyboardType="numeric" placeholder="2.00" placeholderTextColor={COLORS.textMuted} />
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>One-time flat penalty applied after due date</Text>
            </View>
          </View>
        </ModalBody>
        <ModalFooter primaryLabel="Save Policy" onPrimaryPress={handleSavePenalty} secondaryLabel="Cancel" onSecondaryPress={() => setPenaltyVisible(false)} />
      </BaseModal>

      {/* About System Modal */}
      <BaseModal visible={aboutVisible} onClose={() => setAboutVisible(false)}>
        <ModalHeader title="Wattipid Smart System" icon="flash" onClose={() => setAboutVisible(false)} />
        <ModalBody>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8, fontSize: 13.5 }}>v2.1.0-prod • Cloud-Native Architecture</Text>
          <Text style={{ color: '#94A3B8', lineHeight: 20, fontSize: 12.5 }}>
            Wattipid is an enterprise-grade IoT electricity monitoring platform designed for modern rental facilities. It utilizes ESP32 microcontrollers, purely Cloud-Based synchronization, and real-time analytics to help landlords and tenants track consumption securely and efficiently without physical LAN restrictions.
          </Text>
        </ModalBody>
        <ModalFooter primaryLabel="Done" onPrimaryPress={() => setAboutVisible(false)} />
      </BaseModal>

      {/* Sign Out Modal */}
      <SignOutModal
        visible={logoutConfirmVisible}
        onClose={() => setLogoutConfirmVisible(false)}
        onConfirm={handleConfirmLogout}
        role="landlord"
      />
    </View>
  );
}
