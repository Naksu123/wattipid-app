import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '../../contexts/TourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConsumption } from '../../contexts/ConsumptionContext';
import { useModal } from '../../contexts/ModalContext';
import { getDatabase } from '../../services/database';
import { getAlertSettings, updateAlertSettings } from '../../services/notificationApi';
import { getCurrentEnv, setApiEnvironment } from '../../services/config';
import { BaseModal, ModalHeader, ModalBody, ModalFooter, SignOutModal } from '../../components/modals/BaseModal';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/settings.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CopilotView = walkthroughable(View);

export default function TenantSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { monthUsage } = useConsumption();
  const { showModal } = useModal();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [clearDataVisible, setClearDataVisible] = useState(false);

  // Notification states
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [powerSpikeAlerts, setPowerSpikeAlerts] = useState(true);
  const [forecastAlerts, setForecastAlerts] = useState(true);
  const [dueDateAlerts, setDueDateAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [penaltyAlerts, setPenaltyAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  

  // System & Support modals
  const [env, setEnv] = useState('local');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [envVisible, setEnvVisible] = useState(false);
  const [tempEnv, setTempEnv] = useState('local');
  const scrollViewRef = useRef(null);

  useTourAutoStart('settings', true, scrollViewRef);

  useEffect(() => { 
    loadSettings(); 
  }, [loadSettings]);

  const loadSettings = useCallback(async () => {
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
      console.warn('[TenantSettings] Failed to load alert settings:', error);
    }

    try {
      const currentEnv = await getCurrentEnv();
      setEnv(currentEnv);
      setTempEnv(currentEnv);
    } catch (err) {
      console.warn('[TenantSettings] Failed to get env:', err);
    }
  }, [user?.room_id]);

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
      showModal({ type: 'error', title: 'Error', message: 'Could not save your preferences.' });
    }
  };

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    if (!val) {
      setBudgetAlerts(false);
      setPowerSpikeAlerts(false);
      setDueDateAlerts(false);
      setOverdueAlerts(false);
      setPenaltyAlerts(false);
      setPaymentAlerts(false);
      await saveAlertSettings({ notif_enabled: false, budget_alerts: false, power_spike_alerts: false, forecast_alerts: false, due_date_alerts: false, overdue_alerts: false, penalty_alerts: false, payment_alerts: false });
    } else {
      await saveAlertSettings({ notif_enabled: true });
    }
  };

  const isUsageEnabled = budgetAlerts || powerSpikeAlerts;
  const setUsageEnabled = (val) => {
    setBudgetAlerts(val);
    setPowerSpikeAlerts(val);
    saveAlertSettings({ budget_alerts: val, power_spike_alerts: val });
  };

  const isBillingEnabled = dueDateAlerts || overdueAlerts || penaltyAlerts || paymentAlerts;
  const setBillingEnabled = (val) => {
    setDueDateAlerts(val);
    setOverdueAlerts(val);
    setPenaltyAlerts(val);
    setPaymentAlerts(val);
    saveAlertSettings({ due_date_alerts: val, overdue_alerts: val, penalty_alerts: val, payment_alerts: val });
  };

  const confirmClearData = async () => {
    setClearDataVisible(false);
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM consumption_logs WHERE room_id = ?', [user?.room_id || 'Room 1']);
      showModal({ type: 'success', title: 'Cleared', message: 'Consumption history has been deleted' });
    } catch (err) {
      console.warn('[TenantSettings] Clear history error:', err);
      showModal({ type: 'error', title: 'Error', message: 'Failed to clear consumption history' });
    }
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
    
    showModal({
      type: 'success',
      title: 'Environment Switched', 
      message: `Connected to ${tempEnv === 'local' ? 'Local Server' : 'Production Server'}. Please log in again.`,
      onPrimaryPress: () => router.replace('/(auth)/login')
    });
  };

  // Compute initials for avatar (e.g., Alex Cruz -> AC)
  const userInitials = useMemo(() => {
    if (!user?.name) return 'TN';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  // Reusable Settings Row Component
  const SettingsRow = ({ 
    icon, 
    label, 
    desc, 
    value, 
    onPress, 
    iconColor = '#10B981', 
    iconBg = 'rgba(16, 185, 129, 0.12)', 
    danger = false 
  }) => (
    <TouchableOpacity 
      style={s.menuItem} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[s.menuIconBadge, { backgroundColor: danger ? 'rgba(239,68,68,0.1)' : iconBg }]}>
        <Ionicons name={icon} size={17} color={danger ? '#EF4444' : iconColor} />
      </View>
      <View style={s.menuContent}>
        <Text style={[s.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {desc ? <Text style={s.menuDesc}>{desc}</Text> : null}
      </View>
      {value ? <Text style={s.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color="#64748B" />
    </TouchableOpacity>
  );

  // Reusable Toggle Row Component
  const ToggleRow = ({ 
    icon, 
    label, 
    desc, 
    value, 
    onToggle, 
    disabled = false, 
    iconColor = '#10B981', 
    iconBg = 'rgba(16, 185, 129, 0.12)' 
  }) => (
    <View style={[s.toggleItem, disabled && { opacity: 0.4 }]}>
      <View style={[s.toggleIconBadge, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={s.toggleContent}>
        <Text style={s.toggleLabel}>{label}</Text>
        {desc ? <Text style={s.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
        thumbColor={value ? '#10B981' : '#64748B'}
      />
    </View>
  );

  return (
    <View style={s.container}>
      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* ================= HEADER ================= */}
        <View style={s.headerRow}>
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tenant)/dashboard')}
            style={s.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Back to Dashboard"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.headerTitleWrap}>
            <Text style={s.headerTitle}>Settings</Text>
            <Text style={s.headerSubtitle}>Manage your account and preferences.</Text>
          </View>
        </View>

        {/* ================= 1. PROFILE SUMMARY ================= */}
        <CopilotStep text="Profile lets you view and manage your Wattipid account information." order={19} name="settings_profile">
          <CopilotView>
            <View style={s.profileCard}>
              <View style={s.profileMainRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarInitials}>{userInitials}</Text>
                </View>
                <View style={s.profileInfo}>
                  <View style={s.profileNameRow}>
                    <Text style={s.profileName} numberOfLines={1}>{user?.name || 'Tenant User'}</Text>
                    <View style={s.roomBadge}>
                      <Text style={s.roomBadgeText}>{user?.room_id || 'Room 1'}</Text>
                    </View>
                  </View>
                  <Text style={s.profileEmail} numberOfLines={1}>{user?.email || 'tenant@wattipid.com'}</Text>
                  <Text style={s.profileSub}>Tenant • {user?.room_id || 'Room 1'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => router.push('/(tenant)/edit-profile')} 
                style={s.editProfileRow}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={14} color="#10B981" />
                <Text style={s.editProfileText}>Edit Account Profile</Text>
              </TouchableOpacity>
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ================= 2. LEASE INFORMATION ================= */}
        <CopilotStep text="Lease Information contains important information related to your room or rental arrangement." order={20} name="settings_lease">
          <CopilotView>
            <Text style={s.sectionLabel}>Lease Information</Text>
            <View style={s.leaseCard}>
              <View style={s.leaseGrid}>
                <View style={s.leaseCol}>
                  <Text style={s.leaseColLabel}>Room Number</Text>
                  <Text style={s.leaseColValue}>{user?.room_id || 'Room 1'}</Text>
                </View>
                <View style={s.leaseCol}>
                  <Text style={s.leaseColLabel}>Floor</Text>
                  <Text style={s.leaseColValue}>2nd Floor</Text>
                </View>
                <View style={s.leaseCol}>
                  <Text style={s.leaseColLabel}>Lease Start Date</Text>
                  <Text style={s.leaseColValue}>
                    {monthUsage?.tenant_start_date ? new Date(monthUsage.tenant_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 15, 2024'}
                  </Text>
                </View>
                <View style={s.leaseCol}>
                  <Text style={s.leaseColLabel}>Account Status</Text>
                  <View style={s.statusPillActive}>
                    <Text style={s.statusPillText}>Active</Text>
                  </View>
                </View>
              </View>
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ================= 3. ACCOUNT SECURITY ================= */}
        <Text style={s.sectionLabel}>Account Security</Text>
        <View style={s.sectionCard}>
          <SettingsRow 
            icon="lock-closed-outline" 
            label="Change Password" 
            desc="Update your login password and credentials"
            onPress={() => router.push('/(tenant)/edit-profile')} 
            iconColor="#10B981"
            iconBg="rgba(16, 185, 129, 0.12)"
          />
        </View>

        {/* ================= 4. NOTIFICATION PREFERENCES ================= */}
        <CopilotStep text="Notification settings help you manage important Wattipid alerts and updates." order={21} name="settings_notifications">
          <CopilotView>
            <Text style={s.sectionLabel}>Notification Preferences</Text>
            <View style={s.sectionCard}>
              <ToggleRow 
                icon="notifications-outline" 
                label="Push Notifications" 
                desc="Receive live alerts on your device"
                value={notifEnabled} 
                onToggle={toggleNotif} 
                iconColor="#10B981" 
                iconBg="rgba(16, 185, 129, 0.12)" 
              />
              <View style={s.divider} />
              <ToggleRow 
                icon="flash-outline" 
                label="Usage Alerts" 
                desc="Alert when approaching budget limits"
                value={isUsageEnabled} 
                onToggle={setUsageEnabled} 
                disabled={!notifEnabled} 
                iconColor="#F59E0B" 
                iconBg="rgba(245, 158, 11, 0.12)" 
              />
              <View style={s.divider} />
              <ToggleRow 
                icon="receipt-outline" 
                label="Billing Reminders" 
                desc="Reminders for upcoming due dates"
                value={isBillingEnabled} 
                onToggle={setBillingEnabled} 
                disabled={!notifEnabled} 
                iconColor="#38BDF8" 
                iconBg="rgba(56, 189, 248, 0.12)" 
              />
            </View>
          </CopilotView>
        </CopilotStep>


        {/* ================= 6. DATA MANAGEMENT ================= */}
        <CopilotStep text="Data Management provides controls for managing your account and related application data." order={22} name="settings_data_management">
          <CopilotView>
            <Text style={s.sectionLabel}>Data Management</Text>
            <View style={s.sectionCard}>
              <View style={s.dataActionRow}>
                <View style={s.dataActionContent}>
                  <Text style={s.dataActionTitle}>Clear Consumption History</Text>
                  <Text style={s.dataActionDesc}>This will permanently delete your local usage data.</Text>
                </View>
                <TouchableOpacity 
                  style={s.destructiveBtn}
                  onPress={() => setClearDataVisible(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={s.divider} />

              <SettingsRow 
                icon="server-outline" 
                label="API Environment" 
                desc={`Connected to: ${env === 'local' ? 'Local Development' : 'Cloud Production'}`}
                value={env.toUpperCase()}
                onPress={handleSwitchEnv} 
                iconColor="#64748B"
                iconBg="rgba(255, 255, 255, 0.05)"
              />
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ================= 7. SUPPORT ================= */}
        <CopilotStep text="Support provides help and access to the Wattipid User Manual." order={23} name="settings_support">
          <CopilotView>
            <Text style={s.sectionLabel}>Support & Documentation</Text>
            <View style={s.sectionCard}>
              <SettingsRow 
                icon="book-outline" 
                label="User Manual & FAQ" 
                desc="Step-by-step guide to all features"
                onPress={() => router.push('/(tenant)/user-manual')} 
                iconColor="#10B981" 
                iconBg="rgba(16, 185, 129, 0.12)" 
              />
              <View style={s.divider} />
              <SettingsRow 
                icon="help-circle-outline" 
                label="Help & Support" 
                desc="Contact dormitory landlord or tech support"
                onPress={() => setHelpVisible(true)} 
                iconColor="#8B5CF6" 
                iconBg="rgba(139, 92, 246, 0.12)" 
              />
              <View style={s.divider} />
              <SettingsRow 
                icon="document-text-outline" 
                label="Terms and Conditions" 
                desc="Service policy and privacy terms"
                onPress={() => router.push('/terms')} 
                iconColor="#64748B" 
                iconBg="rgba(255, 255, 255, 0.05)" 
              />
              <View style={s.divider} />
              <SettingsRow 
                icon="information-circle-outline" 
                label="About Wattipid" 
                value="v2.1.0" 
                onPress={() => setAboutVisible(true)} 
                iconColor="#64748B" 
                iconBg="rgba(255, 255, 255, 0.05)" 
              />
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ================= 8. SIGN OUT ACCOUNT ================= */}
        <TouchableOpacity 
          style={s.logoutBtn} 
          onPress={() => setLogoutVisible(true)} 
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={s.logoutBtnText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>Wattipid v2.1.0 • IoT Energy Management</Text>
      </ScrollView>

      {/* ================= MODALS ================= */}
      {/* About Modal */}
      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.aboutIcon}><Ionicons name="flash" size={32} color="#10B981" /></View>
            <Text style={s.modalTitle}>Wattipid Smart System</Text>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 4, marginBottom: 14 }}>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>VERSION 2.1.0</Text>
            </View>
            <Text style={s.modalDesc}>A comprehensive IoT-based Smart Electricity Monitoring System designed exclusively for student rental dormitories.</Text>
            <Text style={[s.modalDesc, { marginTop: 10, fontSize: 11.5, color: '#64748B' }]}>
              Wattipid empowers tenants with real-time analytics, daily consumption breakdowns, and predictive budgeting to manage energy efficiently.
            </Text>
            <Text style={[s.modalDesc, { marginTop: 14, fontSize: 11, fontWeight: '700' }]}>© 2026 Wattipid Technologies</Text>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setAboutVisible(false)} activeOpacity={0.7}>
              <Text style={s.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={helpVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setHelpVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.aboutIcon, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Ionicons name="help-circle" size={32} color="#38BDF8" />
            </View>
            <Text style={s.modalTitle}>Help & Support</Text>
            <Text style={s.modalDesc}>Need assistance with your account, billing, or monitoring device?</Text>
            
            <View style={{ width: '100%', marginTop: 14, marginBottom: 6, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="mail-outline" size={18} color="#10B981" />
                <Text style={{ color: '#FFFFFF', fontSize: 12.5, flex: 1 }}>support@wattipid.com</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="call-outline" size={18} color="#38BDF8" />
                <Text style={{ color: '#FFFFFF', fontSize: 12.5, flex: 1 }}>0917-123-4567 (Globe)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="business-outline" size={18} color="#F59E0B" />
                <Text style={{ color: '#94A3B8', fontSize: 11.5, flex: 1 }}>Contact your Landlord directly for hardware or physical meter issues.</Text>
              </View>
            </View>

            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setHelpVisible(false)} activeOpacity={0.7}>
              <Text style={s.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={confirmLogout}
        role="tenant"
      />

      {/* Clear History Confirmation Modal */}
      <BaseModal visible={clearDataVisible} onClose={() => setClearDataVisible(false)}>
        <ModalHeader title="Clear History" icon="warning" iconColor="#EF4444" onClose={() => setClearDataVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.modalMessage}>This will permanently delete all your consumption logs. This action cannot be undone.</Text>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Clear History" 
          onPrimaryPress={confirmClearData} 
          primaryDanger={true} 
          secondaryLabel="Cancel" 
          onSecondaryPress={() => setClearDataVisible(false)} 
        />
      </BaseModal>

      {/* Switch Environment Modal */}
      <BaseModal visible={envVisible} onClose={() => setEnvVisible(false)}>
        <ModalHeader title="Switch API Environment" icon="server" onClose={() => setEnvVisible(false)} />
        <ModalBody scrollable={false}>
          <Text style={s.envSubtitle}>Select the backend server to connect with.</Text>
          <TouchableOpacity style={[s.envCard, tempEnv === 'local' && s.envCardActive]} onPress={() => setTempEnv('local')}>
            <Text style={s.envCardTitle}>Local Development Server</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.envCard, tempEnv === 'production' && s.envCardActive]} onPress={() => setTempEnv('production')}>
            <Text style={s.envCardTitle}>Production Cloud Server (Hostinger)</Text>
          </TouchableOpacity>
        </ModalBody>
        <ModalFooter 
          primaryLabel="Switch Now" 
          onPrimaryPress={onConfirmSwitch} 
          secondaryLabel="Cancel" 
          onSecondaryPress={() => setEnvVisible(false)} 
        />
      </BaseModal>
    </View>
  );
}