import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getSetting, setSetting } from '../../services/database';
import { setESP32BaseUrl, getConnectionStatus } from '../../services/esp32Api';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/landlord/settings.styles';

export default function LandlordSettings() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [rate, setRate] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // ESP32 Connection state
  const [esp32Visible, setEsp32Visible] = useState(false);
  const [esp32Ip, setEsp32Ip] = useState('192.168.1.100');
  const [esp32IpError, setEsp32IpError] = useState('');
  const [isMockMode, setIsMockMode] = useState(true);

  // Notifications state
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifHighCons, setNotifHighCons] = useState(true);
  const [notifNewTenant, setNotifNewTenant] = useState(true);
  const [notifRevoke, setNotifRevoke] = useState(true);

  // Tenant Management state
  const [tenantMgmtVisible, setTenantMgmtVisible] = useState(false);

  // About state
  const [aboutVisible, setAboutVisible] = useState(false);

  // Rate Success modal
  const [rateSuccessVisible, setRateSuccessVisible] = useState(false);
  const [rateSuccessMsg, setRateSuccessMsg] = useState('');

  // Confirmation Modals
  const [rateConfirmVisible, setRateConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const r = await getSetting('rate_per_kwh');
    if (r) setRate(r);

    const ip = await getSetting('esp32_ip');
    if (ip) setEsp32Ip(ip);

    const nb = await getSetting('landlord_notif_budget');
    if (nb !== null) setNotifBudget(nb !== 'false');
    const nhc = await getSetting('landlord_notif_high_cons');
    if (nhc !== null) setNotifHighCons(nhc !== 'false');
    const nnt = await getSetting('landlord_notif_new_tenant');
    if (nnt !== null) setNotifNewTenant(nnt !== 'false');
    const nr = await getSetting('landlord_notif_revoke');
    if (nr !== null) setNotifRevoke(nr !== 'false');

    const status = getConnectionStatus();
    setIsMockMode(status.isMock);
  };

  const handleSaveRate = () => {
    const val = parseFloat(rate);
    if (!val || val <= 0) { Alert.alert('Invalid', 'Please enter a valid rate'); return; }
    setRateConfirmVisible(true);
  };

  const handleConfirmSaveRate = async () => {
    setRateConfirmVisible(false);
    const val = parseFloat(rate);
    await setSetting('rate_per_kwh', val.toFixed(2));
    setRateSuccessMsg(`Rate updated to ₱${val.toFixed(2)}/kWh`);
    setRateSuccessVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    const r = await updateProfile(name, email);
    if (r.success) { Alert.alert('Success', 'Profile updated'); setEditing(false); }
    else Alert.alert('Error', r.message || 'Failed to update');
  };

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmVisible(false);
    logout();
    router.replace('/(auth)/login');
  };

  const handleSaveEsp32 = async () => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!esp32Ip.trim() || !ipRegex.test(esp32Ip.trim())) {
      setEsp32IpError('Enter a valid IP address (e.g. 192.168.1.100)');
      return;
    }
    await setSetting('esp32_ip', esp32Ip.trim());
    setESP32BaseUrl(`http://${esp32Ip.trim()}`);
    setEsp32Visible(false);
    Alert.alert('Saved', `ESP32 IP set to ${esp32Ip.trim()}\nMake sure the device is on the same Wi-Fi network.`);
  };

  const handleSaveNotifications = async () => {
    await Promise.all([
      setSetting('landlord_notif_budget', notifBudget.toString()),
      setSetting('landlord_notif_high_cons', notifHighCons.toString()),
      setSetting('landlord_notif_new_tenant', notifNewTenant.toString()),
      setSetting('landlord_notif_revoke', notifRevoke.toString()),
    ]);
    setNotifVisible(false);
    Alert.alert('Saved', 'Notification preferences updated.');
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const MenuItem = ({ icon, label, value, onPress, danger }) => (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.menuIcon, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <View style={s.menuContent}>
        <Text style={[s.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
        {value ? <Text style={s.menuValue}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  const ToggleRow = ({ label, desc, value, onToggle }) => (
    <View style={s.toggleRow}>
      <View style={s.toggleContent}>
        <Text style={s.toggleLabel}>{label}</Text>
        {desc ? <Text style={s.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.surfaceLight, true: 'rgba(34,197,94,0.35)' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Admin Settings</Text>
        <Text style={s.subtitle}>Manage facility configuration</Text>

        {/* ── Profile ── */}
        <GlassCard gradient style={s.profileCard}>
          <View style={s.avatar}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name || 'Admin'}</Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
            <Text style={s.profileRole}>Landlord Administrator</Text>
            <TouchableOpacity onPress={() => setEditing(true)} style={s.editBtn}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── Electricity Rate ── */}
        <GlassCard style={s.rateCard}>
          <View style={s.rateHeader}>
            <Ionicons name="cash-outline" size={22} color={COLORS.warning} />
            <Text style={s.rateTitle}>Electricity Rate</Text>
          </View>
          <Text style={s.rateDesc}>
            Set the price per kilowatt-hour (kWh) in Philippine Peso.
            This rate will be used to calculate tenant billing.
          </Text>
          <View style={s.rateRow}>
            <Text style={s.currencyLabel}>₱</Text>
            <TextInput
              style={s.input} value={rate} onChangeText={setRate}
              keyboardType="numeric" placeholder="12.50"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity onPress={handleSaveRate} activeOpacity={0.8}>
              <LinearGradient colors={GRADIENTS.primary} style={s.rateBtn}>
                <Text style={s.rateBtnText}>Update</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── Menu Items ── */}
        <GlassCard style={s.menuCard}>
          <MenuItem
            icon="people-outline" label="Tenant Management"
            value="Manage access & reset codes"
            onPress={() => setTenantMgmtVisible(true)}
          />
          <MenuItem
            icon="notifications-outline" label="Notifications"
            value="Alert preferences"
            onPress={() => setNotifVisible(true)}
          />
          <MenuItem
            icon="wifi-outline" label="ESP32 Connection"
            value={isMockMode ? 'Mock Mode (tap to configure)' : `IP: ${esp32Ip}`}
            onPress={() => { setEsp32IpError(''); setEsp32Visible(true); }}
          />
          <MenuItem
            icon="information-circle-outline" label="About Wattipid"
            value="v1.0.0"
            onPress={() => setAboutVisible(true)}
          />
        </GlassCard>

        {/* ── Logout ── */}
        <GlassCard style={s.menuCard}>
          <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
        </GlassCard>

        <Text style={s.version}>Wattipid v1.0.0 • Admin Dashboard</Text>
      </ScrollView>

      {/* ── ESP32 Connection Modal ── */}
      <Modal visible={esp32Visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEsp32Visible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="wifi" size={32} color={COLORS.info} />
            </View>
            <Text style={s.modalTitle}>ESP32 Connection</Text>
            <Text style={s.modalDesc}>
              Enter the local IP address of your ESP32 device. Both this phone and the ESP32 must be on the same Wi-Fi network.
            </Text>

            {isMockMode && (
              <View style={s.mockBanner}>
                <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                <Text style={s.mockBannerText}>
                  Currently in Mock Mode — sensor data is simulated. Save a real IP to connect to your hardware.
                </Text>
              </View>
            )}

            <Text style={s.inputLabel}>ESP32 IP Address</Text>
            <View style={[s.ipWrap, esp32IpError && s.ipWrapErr]}>
              <Ionicons name="hardware-chip-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={s.ipInput}
                value={esp32Ip}
                onChangeText={t => { setEsp32Ip(t); setEsp32IpError(''); }}
                placeholder="192.168.1.100"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </View>
            {esp32IpError ? <Text style={s.inputError}>{esp32IpError}</Text> : null}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setEsp32Visible(false)} activeOpacity={0.7}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtnWrap} onPress={handleSaveEsp32} activeOpacity={0.8}>
                <LinearGradient colors={GRADIENTS.primary} style={s.modalSaveBtn}>
                  <Text style={s.modalSaveText}>Save & Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Notifications Modal ── */}
      <Modal visible={notifVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNotifVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
              <Ionicons name="notifications" size={32} color={COLORS.primary} />
            </View>
            <Text style={s.modalTitle}>Notification Preferences</Text>
            <Text style={s.modalDesc}>Choose which events trigger alerts for you as the landlord.</Text>

            <View style={s.toggleList}>
              <ToggleRow
                label="Budget Exceeded"
                desc="When a tenant exceeds their daily budget"
                value={notifBudget}
                onToggle={setNotifBudget}
              />
              <View style={s.divider} />
              <ToggleRow
                label="High Consumption"
                desc="When a room's power usage spikes"
                value={notifHighCons}
                onToggle={setNotifHighCons}
              />
              <View style={s.divider} />
              <ToggleRow
                label="New Tenant Sign-up"
                desc="When a tenant registers using an access code"
                value={notifNewTenant}
                onToggle={setNotifNewTenant}
              />
              <View style={s.divider} />
              <ToggleRow
                label="Tenant Revoked"
                desc="When a tenant is removed or transferred"
                value={notifRevoke}
                onToggle={setNotifRevoke}
              />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setNotifVisible(false)} activeOpacity={0.7}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtnWrap} onPress={handleSaveNotifications} activeOpacity={0.8}>
                <LinearGradient colors={GRADIENTS.primary} style={s.modalSaveBtn}>
                  <Text style={s.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Tenant Management Modal ── */}
      <Modal visible={tenantMgmtVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setTenantMgmtVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIconWrap, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
              <Ionicons name="people" size={32} color={COLORS.accent} />
            </View>
            <Text style={s.modalTitle}>Tenant Management</Text>
            <Text style={s.modalDesc}>Quick actions for managing tenant access across all rooms.</Text>

            <View style={s.mgmtList}>
              <TouchableOpacity
                style={s.mgmtItem}
                activeOpacity={0.7}
                onPress={() => {
                  setTenantMgmtVisible(false);
                  router.push('/(landlord)/rooms');
                }}
              >
                <View style={[s.mgmtIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                  <Ionicons name="home-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={s.mgmtContent}>
                  <Text style={s.mgmtLabel}>View All Rooms</Text>
                  <Text style={s.mgmtDesc}>See room status and manage tenant codes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.mgmtItem}
                activeOpacity={0.7}
                onPress={() => {
                  setTenantMgmtVisible(false);
                  Alert.alert(
                    'Send Access Codes',
                    'Go to the Rooms tab, tap on any vacant room, and select "Send Code via Email" to invite a tenant.',
                    [{ text: 'Go to Rooms', onPress: () => router.push('/(landlord)/rooms') }, { text: 'OK' }]
                  );
                }}
              >
                <View style={[s.mgmtIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <Ionicons name="mail-outline" size={22} color={COLORS.info} />
                </View>
                <View style={s.mgmtContent}>
                  <Text style={s.mgmtLabel}>Send Access Codes</Text>
                  <Text style={s.mgmtDesc}>Email room codes to prospective tenants</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.mgmtItem}
                activeOpacity={0.7}
                onPress={() => {
                  setTenantMgmtVisible(false);
                  Alert.alert(
                    'Generate Reports',
                    'To generate a PDF consumption report, go to the Rooms tab and tap on an occupied room.',
                    [{ text: 'Go to Rooms', onPress: () => router.push('/(landlord)/rooms') }, { text: 'OK' }]
                  );
                }}
              >
                <View style={[s.mgmtIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <Ionicons name="document-text-outline" size={22} color={COLORS.info} />
                </View>
                <View style={s.mgmtContent}>
                  <Text style={s.mgmtLabel}>Generate Room Reports</Text>
                  <Text style={s.mgmtDesc}>Create monthly PDF consumption reports</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.mgmtItem}
                activeOpacity={0.7}
                onPress={() => {
                  setTenantMgmtVisible(false);
                  Alert.alert(
                    'Revoke / Transfer',
                    'To revoke or transfer a tenant, go to the Rooms tab, tap on an occupied room, and select the appropriate action.\n\nAll historical data is always preserved.',
                    [{ text: 'Go to Rooms', onPress: () => router.push('/(landlord)/rooms') }, { text: 'OK' }]
                  );
                }}
              >
                <View style={[s.mgmtIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <Ionicons name="swap-horizontal-outline" size={22} color={COLORS.warning} />
                </View>
                <View style={s.mgmtContent}>
                  <Text style={s.mgmtLabel}>Revoke / Transfer Tenant</Text>
                  <Text style={s.mgmtDesc}>Remove or move a tenant (data preserved)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.fullCloseBtn} onPress={() => setTenantMgmtVisible(false)} activeOpacity={0.7}>
              <Text style={s.fullCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── About Modal ── */}
      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
              <Ionicons name="flash" size={36} color={COLORS.primary} />
            </View>
            <Text style={s.modalTitle}>Wattipid</Text>
            <Text style={s.modalVer}>Version 1.0.0</Text>
            <Text style={s.modalDesc}>
              An IoT-based electricity monitoring system designed for student rental dormitories.
              Track consumption, manage budgets, and save energy with smart tips.
            </Text>
            <View style={s.aboutDetails}>
              {[
                ['Platform', 'React Native / Expo'],
                ['Database', 'SQLite (expo-sqlite)'],
                ['Sensor', 'ESP32 + PZEM-004T'],
                ['Mode', isMockMode ? 'Mock / Demo' : 'Live Hardware'],
                ['Developer', 'Wattipid Team'],
              ].map(([label, value]) => (
                <View key={label} style={s.aboutRow}>
                  <Text style={s.aboutLabel}>{label}</Text>
                  <Text style={s.aboutValue}>{value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.fullCloseBtn} onPress={() => setAboutVisible(false)} activeOpacity={0.7}>
              <Text style={s.fullCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Rate Confirmation Modal ── */}
      <BaseModal visible={rateConfirmVisible} onClose={() => setRateConfirmVisible(false)}>
        <ModalHeader title="Update Rate" icon="cash" iconColor={COLORS.primary} onClose={() => setRateConfirmVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>
            Change the electricity rate to ₱{parseFloat(rate || 0).toFixed(2)}/kWh?
          </Text>
          <View style={[s.revokeInfoBox, { backgroundColor: 'rgba(34,197,94,0.08)' }]}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={s.revokeInfoText}>
              This new rate will apply to all future consumption billing.
            </Text>
          </View>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Update"
          onPrimaryPress={handleConfirmSaveRate}
          secondaryLabel="Cancel"
          onSecondaryPress={() => setRateConfirmVisible(false)}
        />
      </BaseModal>

      {/* ── Logout Confirmation Modal ── */}
      <BaseModal visible={logoutConfirmVisible} onClose={() => setLogoutConfirmVisible(false)}>
        <ModalHeader title="Confirm Logout" icon="log-out" iconColor={COLORS.danger} onClose={() => setLogoutConfirmVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>
            Are you sure you want to log out of your account?
          </Text>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Log Out"
          onPrimaryPress={handleConfirmLogout}
          primaryDanger={true}
          secondaryLabel="Cancel"
          onSecondaryPress={() => setLogoutConfirmVisible(false)}
        />
      </BaseModal>

      {/* ── Edit Profile Modal ── */}
      <BaseModal visible={editing} onClose={() => setEditing(false)}>
        <ModalHeader title="Edit Profile" icon="person" onClose={() => setEditing(false)} />
        <ModalBody scrollable={false}>
          <View style={s.editFields}>
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput
              style={s.editInputModal} value={name} onChangeText={setName}
              placeholder="Name" placeholderTextColor={COLORS.textMuted}
            />
            <Text style={s.inputLabel}>Email Address</Text>
            <TextInput
              style={s.editInputModal} value={email} onChangeText={setEmail}
              placeholder="Email" placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address" autoCapitalize="none"
            />
          </View>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Save Changes"
          onPrimaryPress={handleSaveProfile}
          secondaryLabel="Cancel"
          onSecondaryPress={() => {
            setEditing(false);
            setName(user?.name || '');
            setEmail(user?.email || '');
          }}
        />
      </BaseModal>

      {/* ── Rate Success Modal ── */}
      <Modal visible={rateSuccessVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRateSuccessVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <TouchableOpacity style={s.closeModalBtn} onPress={() => setRateSuccessVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={s.successIconWrap}>
              <View style={s.successIconInner}>
                <Ionicons name="checkmark" size={32} color="#fff" />
              </View>
              {/* Decorative particles */}
              <View style={[s.particle, { top: 10, left: -20 }]} />
              <View style={[s.particle, { top: -10, left: 20 }]} />
              <View style={[s.particle, { top: 20, right: -25 }]} />
              <View style={[s.particle, { bottom: -5, left: -10, transform: [{ rotate: '45deg' }] }]} />
              <View style={[s.particle, { bottom: 5, right: -15, transform: [{ rotate: '-45deg' }] }]} />
            </View>
            
            <Text style={s.modalTitle}>Success</Text>
            <Text style={[s.modalDesc, { fontWeight: '600', color: COLORS.primary }]}>
              {rateSuccessMsg}
            </Text>

            <TouchableOpacity style={s.successBtnSolid} onPress={() => setRateSuccessVisible(false)} activeOpacity={0.8}>
              <Text style={s.removeTextWhite}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}