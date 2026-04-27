import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getSetting, setSetting, getDatabase } from '../../services/database';
import GlassCard from '../../components/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/BaseModal';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function TenantSettings() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [clearDataVisible, setClearDataVisible] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [highConsAlerts, setHighConsAlerts] = useState(true);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const n = await getSetting('notif_enabled');
    if (n !== null) setNotifEnabled(n === 'true');

    const ba = await getSetting('budget_alerts');
    if (ba !== null) setBudgetAlerts(ba === 'true');

    const hc = await getSetting('high_cons_alerts');
    if (hc !== null) setHighConsAlerts(hc === 'true');

  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    const r = await updateProfile(name, email);
    if (r.success) { Alert.alert('Success', 'Profile updated'); setEditing(false); }
    else Alert.alert('Error', r.message || 'Failed to update');
  };

  const confirmLogout = () => {
    setLogoutVisible(false);
    logout();
    router.replace('/(auth)/login');
  };

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    await setSetting('notif_enabled', val.toString());
    if (!val) {
      setBudgetAlerts(false);
      setHighConsAlerts(false);
      await setSetting('budget_alerts', 'false');
      await setSetting('high_cons_alerts', 'false');
    }
  };

  const toggleBudgetAlerts = async (val) => {
    setBudgetAlerts(val);
    await setSetting('budget_alerts', val.toString());
  };

  const toggleHighConsAlerts = async (val) => {
    setHighConsAlerts(val);
    await setSetting('high_cons_alerts', val.toString());
  };

  const confirmClearData = async () => {
    setClearDataVisible(false);
    const db = await getDatabase();
    await db.runAsync('DELETE FROM consumption_logs WHERE room_id = ?', [user?.room_id || 'Room 1']);
    Alert.alert('Cleared', 'Consumption history has been deleted');
  };



  // ─── Sub-components ──────────────────────────────────────────────────────────

  const ToggleItem = ({ icon, label, desc, value, onToggle, disabled }) => (
    <View style={[s.toggleItem, disabled && { opacity: 0.4 }]}>
      <View style={s.toggleIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={s.toggleContent}>
        <Text style={s.toggleLabel}>{label}</Text>
        {desc && <Text style={s.toggleDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
        trackColor={{ false: COLORS.surfaceLight, true: 'rgba(34,197,94,0.35)' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );

  const MenuItem = ({ icon, label, value, onPress, danger }) => (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.menuIcon, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <View style={s.menuContent}>
        <Text style={[s.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
        {value !== undefined && <Text style={s.menuValue}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        {/* ── Profile ── */}
        <GlassCard gradient style={s.profileCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name || 'Tenant'}</Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
            <Text style={s.profileRole}>Tenant • Room {user?.room_id || 'N/A'}</Text>
            <TouchableOpacity onPress={() => setEditing(true)} style={s.editBtn}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── Notifications ── */}
        <Text style={s.sectionLabel}>Notifications</Text>
        <GlassCard style={s.sectionCard}>
          <ToggleItem
            icon="notifications-outline" label="Push Notifications"
            desc="Enable or disable all alerts"
            value={notifEnabled} onToggle={toggleNotif}
          />
          <View style={s.divider} />
          <ToggleItem
            icon="wallet-outline" label="Budget Alerts"
            desc="Warn when approaching budget limit"
            value={budgetAlerts} onToggle={toggleBudgetAlerts}
            disabled={!notifEnabled}
          />
          <View style={s.divider} />
          <ToggleItem
            icon="flash-outline" label="High Consumption Alerts"
            desc="Alert when power usage spikes"
            value={highConsAlerts} onToggle={toggleHighConsAlerts}
            disabled={!notifEnabled}
          />
        </GlassCard>

        {/* ── Data Management ── */}
        <Text style={s.sectionLabel}>Data Management</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="trash-outline" label="Clear Consumption History" onPress={() => setClearDataVisible(true)} danger />
        </GlassCard>

        {/* ── Support ── */}
        <Text style={s.sectionLabel}>Support</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => setHelpVisible(true)} />
          <MenuItem icon="information-circle-outline" label="About Wattipid" value="v1.0.0" onPress={() => setAboutVisible(true)} />
        </GlassCard>

        {/* ── Logout ── */}
        <GlassCard style={s.menuCard}>
          <MenuItem icon="log-out-outline" label="Logout" onPress={() => setLogoutVisible(true)} danger />
        </GlassCard>

        <Text style={s.version}>Wattipid v1.0.0 • IoT Energy Monitor</Text>
      </ScrollView>

      {/* ── About Modal ── */}
      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.aboutIcon}>
              <Ionicons name="flash" size={36} color={COLORS.primary} />
            </View>
            <Text style={s.modalTitle}>Wattipid</Text>
            <Text style={s.modalVer}>Version 1.0.0</Text>
            <Text style={s.modalDesc}>
              An IoT-based electricity monitoring system designed for student rental dormitories.
              Track consumption, manage budgets, and save energy with smart tips.
            </Text>
            <View style={s.aboutDetails}>
              <AboutRow label="Platform" value="React Native / Expo" />
              <AboutRow label="Database" value="SQLite" />
              <AboutRow label="Sensor" value="ESP32 + PZEM-004T" />
              <AboutRow label="Developer" value="Wattipid Team" />
            </View>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setAboutVisible(false)}>
              <Text style={s.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Help Modal ── */}
      <Modal visible={helpVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setHelpVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.aboutIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="help-circle" size={36} color={COLORS.info} />
            </View>
            <Text style={s.modalTitle}>Help & Support</Text>
            <View style={s.helpList}>
              <HelpItem
                icon="speedometer" q="How does monitoring work?"
                a="Your ESP32 sensor reads voltage, current, and power in real-time and sends data to the app every 5 seconds."
              />
              <HelpItem
                icon="wallet" q="How do budgets work?"
                a="Set a monthly budget and we auto-calculate daily/weekly allowances. You'll get alerts when approaching or exceeding limits."
              />
              <HelpItem
                icon="leaf" q="What are Dynamic Tips?"
                a="Tips generated from your actual consumption patterns — they update automatically based on your usage, budget status, and comparisons."
              />
              <HelpItem
                icon="notifications" q="Why am I getting alerts?"
                a="Alerts trigger when your usage exceeds budget thresholds or is significantly higher than previous periods. Contact your landlord if alerts seem incorrect."
              />
              <HelpItem
                icon="mail" q="Need more help?"
                a="Contact your landlord or email support@wattipid.com for assistance."
              />
            </View>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setHelpVisible(false)}>
              <Text style={s.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          onPrimaryPress={handleSave}
          secondaryLabel="Cancel"
          onSecondaryPress={() => {
            setEditing(false);
            setName(user?.name || '');
            setEmail(user?.email || '');
          }}
        />
      </BaseModal>

      {/* ── Logout Modal ── */}
      <BaseModal visible={logoutVisible} onClose={() => setLogoutVisible(false)}>
        <ModalHeader title="Confirm Logout" icon="log-out" iconColor={COLORS.danger} onClose={() => setLogoutVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>Are you sure you want to log out of your account?</Text>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Log Out"
          onPrimaryPress={confirmLogout}
          primaryDanger={true}
          secondaryLabel="Cancel"
          onSecondaryPress={() => setLogoutVisible(false)}
        />
      </BaseModal>

      {/* ── Clear History Modal ── */}
      <BaseModal visible={clearDataVisible} onClose={() => setClearDataVisible(false)}>
        <ModalHeader title="Clear History" icon="warning" iconColor={COLORS.danger} onClose={() => setClearDataVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>
            This will delete all your consumption history. This action cannot be undone. Are you sure you want to proceed?
          </Text>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Clear History"
          onPrimaryPress={confirmClearData}
          primaryDanger={true}
          secondaryLabel="Cancel"
          onSecondaryPress={() => setClearDataVisible(false)}
        />
      </BaseModal>
    </View>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function AboutRow({ label, value }) {
  return (
    <View style={s.aboutRow}>
      <Text style={s.aboutRowLabel}>{label}</Text>
      <Text style={s.aboutRowValue}>{value}</Text>
    </View>
  );
}

function HelpItem({ icon, q, a }) {
  return (
    <View style={s.helpItem}>
      <Ionicons name={icon} size={18} color={COLORS.primary} style={{ marginTop: 2 }} />
      <View style={s.helpContent}>
        <Text style={s.helpQ}>{q}</Text>
        <Text style={s.helpA}>{a}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  sectionLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.md, marginLeft: SPACING.xs },

  // Profile
  profileCard: { alignItems: 'center', marginBottom: SPACING.md, paddingVertical: SPACING.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  profileInfo: { alignItems: 'center' },
  profileName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  profileEmail: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  profileRole: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  editBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.medium },
  editFields: { width: '100%', gap: SPACING.sm },
  inputLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium, marginTop: SPACING.sm },
  editInputModal: { height: 48, backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, fontSize: FONT_SIZE.md },

  // Section cards
  sectionCard: { marginBottom: SPACING.md, padding: 0, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: COLORS.border },

  // Toggle items
  toggleItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  toggleContent: { flex: 1, marginLeft: SPACING.md },
  toggleLabel: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  toggleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },

  // Menu items
  menuCard: { marginBottom: SPACING.md, padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1, marginLeft: SPACING.md },
  menuLabel: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  menuValue: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },

  // Version
  version: { textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.lg },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', maxWidth: 380, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.lg },
  aboutIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  modalVer: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2, marginBottom: SPACING.md },
  modalDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  modalMessage: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, lineHeight: 22 },
  aboutDetails: { width: '100%', gap: SPACING.sm, marginBottom: SPACING.lg },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  aboutRowLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  aboutRowValue: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  modalCloseBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  modalCloseBtnText: { fontSize: FONT_SIZE.md, color: '#fff', fontWeight: FONT_WEIGHT.semibold },

  // Help
  helpList: { width: '100%', gap: SPACING.md, marginBottom: SPACING.lg, marginTop: SPACING.sm },
  helpItem: { flexDirection: 'row', gap: SPACING.sm },
  helpContent: { flex: 1 },
  helpQ: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 },
  helpA: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 17 },
});