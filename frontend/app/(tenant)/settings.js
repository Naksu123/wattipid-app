import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getDatabase } from '../../services/database';
import { getAlertSettings, updateAlertSettings } from '../../services/notificationApi';
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
  const [markReadSuccessVisible, setMarkReadSuccessVisible] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [powerSpikeAlerts, setPowerSpikeAlerts] = useState(true);
  const [forecastAlerts, setForecastAlerts] = useState(true);
  const [dueDateAlerts, setDueDateAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [penaltyAlerts, setPenaltyAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  
  const [env, setEnv] = useState('local');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [envVisible, setEnvVisible] = useState(false);
  const [tempEnv, setTempEnv] = useState('local');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const result = await getAlertSettings(user?.room_id || 'Room 1');
      if (result && result.data) {
        setNotifEnabled(result.data.notif_enabled !== false);
        setBudgetAlerts(result.data.budget_alerts !== false);
        setPowerSpikeAlerts(result.data.power_spike_alerts !== false);
        setForecastAlerts(result.data.forecast_alerts !== false);
        setDueDateAlerts(result.data.due_date_alerts !== false);
        setOverdueAlerts(result.data.overdue_alerts !== false);
        setPenaltyAlerts(result.data.penalty_alerts !== false);
        setPaymentAlerts(result.data.payment_alerts !== false);
      }
    } catch (error) {
      console.warn('Failed to load alert settings:', error);
    }

    const currentEnv = await getCurrentEnv();
    setEnv(currentEnv);
    setTempEnv(currentEnv);
  };

  const confirmLogout = () => {
    setLogoutVisible(false);
    logout();
    router.replace('/(auth)/login');
  };

  const saveAlertSettings = async (updates) => {
    try {
      const currentSettings = {
        notif_enabled: notifEnabled,
        budget_alerts: budgetAlerts,
        power_spike_alerts: powerSpikeAlerts,
        forecast_alerts: forecastAlerts,
        ...updates
      };
      await updateAlertSettings(user?.room_id || 'Room 1', currentSettings);
    } catch (error) {
      console.warn('Failed to update alert settings:', error);
      Alert.alert('Error', 'Could not save your preferences.');
    }
  };

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    if (!val) {
      setBudgetAlerts(false);
      setPowerSpikeAlerts(false);
      setForecastAlerts(false);
      setDueDateAlerts(false);
      setOverdueAlerts(false);
      setPenaltyAlerts(false);
      setPaymentAlerts(false);
      await saveAlertSettings({ notif_enabled: false, budget_alerts: false, power_spike_alerts: false, forecast_alerts: false, due_date_alerts: false, overdue_alerts: false, penalty_alerts: false, payment_alerts: false });
    } else {
      await saveAlertSettings({ notif_enabled: true });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { markAllNotificationsRead } = require('../../services/notificationApi');
      await markAllNotificationsRead();
      setMarkReadSuccessVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Could not update notifications.');
    }
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
          <MenuItem icon="notifications" label="Notification History" onPress={() => router.push('/(tenant)/notifications')} />
          <View style={s.divider} />
          <MenuItem icon="checkmark-done-outline" label="Mark All as Read" onPress={handleMarkAllRead} />
          <View style={s.divider} />
          <ToggleItem icon="notifications-outline" label="Push Notifications" desc="Enable or disable all alerts" value={notifEnabled} onToggle={toggleNotif} />
          <View style={s.divider} />
          <ToggleItem icon="wallet-outline" label="Budget Alerts" desc="Warn when approaching budget limit" value={budgetAlerts} onToggle={val => {setBudgetAlerts(val); saveAlertSettings({ budget_alerts: val });}} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="flash-outline" label="Power Spike Alerts" desc="Alert when power usage spikes" value={powerSpikeAlerts} onToggle={val => {setPowerSpikeAlerts(val); saveAlertSettings({ power_spike_alerts: val });}} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="calendar-outline" label="Due Date Reminders" desc="Remind before bill due dates" value={dueDateAlerts} onToggle={val => {setDueDateAlerts(val); saveAlertSettings({ due_date_alerts: val });}} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="time-outline" label="Overdue Alerts" desc="Alert when payments are late" value={overdueAlerts} onToggle={val => {setOverdueAlerts(val); saveAlertSettings({ overdue_alerts: val });}} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="alert-circle-outline" label="Penalty Alerts" desc="Notify when penalties are applied" value={penaltyAlerts} onToggle={val => {setPenaltyAlerts(val); saveAlertSettings({ penalty_alerts: val });}} disabled={!notifEnabled} />
          <View style={s.divider} />
          <ToggleItem icon="card-outline" label="Payment Alerts" desc="Payment status updates" value={paymentAlerts} onToggle={val => {setPaymentAlerts(val); saveAlertSettings({ payment_alerts: val });}} disabled={!notifEnabled} />

        </GlassCard>


        <Text style={s.sectionLabel}>Data Management</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="trash-outline" label="Clear Consumption History" onPress={() => setClearDataVisible(true)} danger />
        </GlassCard>

        <Text style={s.sectionLabel}>Support</Text>
        <GlassCard style={s.menuCard}>
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => setHelpVisible(true)} />
          <MenuItem icon="document-text-outline" label="Terms and Conditions" onPress={() => router.push('/terms')} />
          <MenuItem icon="information-circle-outline" label="About Wattipid" value="v2.0.0" onPress={() => setAboutVisible(true)} />
        </GlassCard>

        <GlassCard style={s.menuCard}>
          <MenuItem icon="log-out-outline" label="Sign out" onPress={() => setLogoutVisible(true)} danger />
        </GlassCard>

        <Text style={s.version}>Wattipid v2.0.0 • IoT Energy Monitor</Text>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.aboutIcon}><Ionicons name="flash" size={36} color={COLORS.primary} /></View>
            <Text style={s.modalTitle}>Wattipid</Text>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4, marginBottom: 16 }}>
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>VERSION 2.0.0</Text>
            </View>
            <Text style={s.modalDesc}>A comprehensive IoT-based Smart Electricity Monitoring System designed exclusively for student rental dormitories.</Text>
            <Text style={[s.modalDesc, { marginTop: 12, fontSize: 12, color: COLORS.textMuted }]}>
              Wattipid empowers tenants with real-time analytics, daily consumption breakdowns, and predictive billing to help manage energy efficiently.
            </Text>
            <Text style={[s.modalDesc, { marginTop: 16, fontSize: 11, fontWeight: 'bold' }]}>© 2026 Wattipid Technologies</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setAboutVisible(false)}><Text style={s.modalCloseBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={helpVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setHelpVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.aboutIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}><Ionicons name="help-circle" size={36} color={COLORS.info} /></View>
            <Text style={s.modalTitle}>Help & Support</Text>
            <Text style={s.modalDesc}>Need assistance with your account, billing, or monitoring device?</Text>
            
            <View style={{ width: '100%', marginTop: 16, marginBottom: 8, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1 }}>support@wattipid.com</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="call" size={20} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1 }}>0917-123-4567 (Globe){'\n'}0998-123-4567 (Smart)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="business" size={20} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1 }}>Contact your Landlord directly for hardware issues or manual payments.</Text>
              </View>
            </View>

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

      <BaseModal visible={markReadSuccessVisible} onClose={() => setMarkReadSuccessVisible(false)}>
        <ModalHeader title="Success" icon="checkmark-circle" iconColor={COLORS.success} onClose={() => setMarkReadSuccessVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>All notifications have been marked as read.</Text>
        </ModalBody>
        <ModalFooter primaryLabel="OK" onPrimaryPress={() => setMarkReadSuccessVisible(false)} />
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