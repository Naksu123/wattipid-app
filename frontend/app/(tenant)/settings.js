import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getSetting, setSetting, getDatabase } from '../../services/database';
import { getCurrentEnv, setApiEnvironment, ENVIRONMENTS } from '../../services/config';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/settings.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TenantSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [clearDataVisible, setClearDataVisible] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [highConsAlerts, setHighConsAlerts] = useState(true);
  const [env, setEnv] = useState('local');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [envVisible, setEnvVisible] = useState(false);
  const [tempEnv, setTempEnv] = useState('local');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const n = await getSetting('notif_enabled');
    if (n !== null) setNotifEnabled(n === 'true');

    const ba = await getSetting('budget_alerts');
    if (ba !== null) setBudgetAlerts(ba === 'true');

    const hc = await getSetting('high_cons_alerts');
    if (hc !== null) setHighConsAlerts(hc === 'true');

    const currentEnv = await getCurrentEnv();
    setEnv(currentEnv);
    setTempEnv(currentEnv);
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

  const handleSwitchEnv = () => {
    setTempEnv(env);
    setEnvVisible(true);
  };

  const onConfirmSwitch = async () => {
    await setApiEnvironment(tempEnv);
    setEnv(tempEnv);
    setEnvVisible(false);
    
    await AsyncStorage.multiRemove(['@auth_token', '@auth_user']);
    logout(); 
    
    Alert.alert(
      'Environment Switched', 
      `Connected to ${tempEnv === 'local' ? 'Local Server' : 'Production Server'}. Please log in again.`,
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };

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

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        <GlassCard gradient style={s.profileCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name || 'Tenant'}</Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
            <Text style={s.profileRole}>Tenant • Room {user?.room_id || 'N/A'}</Text>
            <TouchableOpacity onPress={() => router.push('/(tenant)/edit-profile')} style={s.editBtn}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={s.sectionLabel}>Notifications</Text>
        <GlassCard style={s.sectionCard}>
          <ToggleItem icon="notifications-outline" label="Push Notifications" desc="Enable or disable all alerts" value={notifEnabled} onToggle={toggleNotif} />
          <View style={s.divider} />
          <ToggleItem icon="wallet-outline" label="Budget Alerts" desc="Warn when approaching budget limit" value={budgetAlerts} onToggle={toggleBudgetAlerts} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="flash-outline" label="High Consumption Alerts" desc="Alert when power usage spikes" value={highConsAlerts} onToggle={toggleHighConsAlerts} disabled={!notifEnabled} />
        </GlassCard>

        <Text style={s.sectionLabel}>Connectivity</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="server-outline" label="API Environment" value={env === 'local' ? 'Local' : 'Production'} onPress={handleSwitchEnv} />
        </GlassCard>

        <Text style={s.sectionLabel}>Data Management</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="trash-outline" label="Clear Consumption History" onPress={() => setClearDataVisible(true)} danger />
        </GlassCard>

        <Text style={s.sectionLabel}>Support</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => setHelpVisible(true)} />
          <MenuItem icon="information-circle-outline" label="About Wattipid" value="v1.0.0" onPress={() => setAboutVisible(true)} />
        </GlassCard>

        <GlassCard style={s.menuCard}>
          <MenuItem icon="log-out-outline" label="Sign out" onPress={() => setLogoutVisible(true)} danger />
        </GlassCard>

        <Text style={s.version}>Wattipid v1.0.0 • IoT Energy Monitor</Text>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.aboutIcon}><Ionicons name="flash" size={36} color={COLORS.primary} /></View>
            <Text style={s.modalTitle}>Wattipid</Text>
            <Text style={s.modalVer}>Version 1.0.0</Text>
            <Text style={s.modalDesc}>An IoT-based electricity monitoring system designed for student rental dormitories.</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setAboutVisible(false)}><Text style={s.modalCloseBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={helpVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setHelpVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.aboutIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}><Ionicons name="help-circle" size={36} color={COLORS.info} /></View>
            <Text style={s.modalTitle}>Help & Support</Text>
            <Text style={s.modalDesc}>If you need assistance, please contact your landlord or email support@wattipid.com</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setHelpVisible(false)}><Text style={s.modalCloseBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BaseModal visible={logoutVisible} onClose={() => setLogoutVisible(false)}>
        <ModalHeader title="Confirm Sign Out" icon="log-out" iconColor={COLORS.danger} onClose={() => setLogoutVisible(false)} />
        <ModalBody scrollable={false}><Text style={s.modalMessage}>Are you sure you want to sign out of your account?</Text></ModalBody>
        <ModalFooter primaryLabel="Sign Out" onPrimaryPress={confirmLogout} primaryDanger={true} secondaryLabel="Cancel" onSecondaryPress={() => setLogoutVisible(false)} />
      </BaseModal>

      <BaseModal visible={clearDataVisible} onClose={() => setClearDataVisible(false)}>
        <ModalHeader title="Clear History" icon="warning" iconColor={COLORS.danger} onClose={() => setClearDataVisible(false)} />
        <ModalBody scrollable={false}><Text style={s.modalMessage}>This will delete all your consumption history. This action cannot be undone.</Text></ModalBody>
        <ModalFooter primaryLabel="Clear History" onPrimaryPress={confirmClearData} primaryDanger={true} secondaryLabel="Cancel" onSecondaryPress={() => setClearDataVisible(false)} />
      </BaseModal>

      <BaseModal visible={envVisible} onClose={() => setEnvVisible(false)}>
        <ModalHeader title="Switch Environment" icon="server" onClose={() => setEnvVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.envSubtitle}>Select the API server to connect with.</Text>
          <TouchableOpacity style={[s.envCard, tempEnv === 'local' && s.envCardActive]} onPress={() => setTempEnv('local')}>
            <Text style={s.envCardTitle}>Local Development</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.envCard, tempEnv === 'production' && s.envCardActive]} onPress={() => setTempEnv('production')}>
            <Text style={s.envCardTitle}>Production (Hostinger)</Text>
          </TouchableOpacity>
        </ModalBody>
        <ModalFooter primaryLabel="Switch Now" onPrimaryPress={onConfirmSwitch} secondaryLabel="Cancel" onSecondaryPress={() => setEnvVisible(false)} />
      </BaseModal>
    </View>
  );
}