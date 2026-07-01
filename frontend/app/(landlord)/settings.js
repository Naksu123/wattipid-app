import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Switch, SafeAreaView, StatusBar, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../contexts/AuthContext';
import { getSetting, setSetting } from '../../services/database';
import { updatePenaltySettings, getPenaltySettings } from '../../services/penaltyService';
import { setESP32BaseUrl, getConnectionStatus } from '../../services/esp32Api';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import { COLORS, GRADIENTS } from '../../styles/theme';
import styles from '../../styles/landlord/settings.styles';

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

  // Payment Methods state
  const [paymentMethodsVisible, setPaymentMethodsVisible] = useState(false);
  const [partialPayments, setPartialPayments] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashQrBase64, setGcashQrBase64] = useState(null);
  const [mayaName, setMayaName] = useState('');
  const [mayaNumber, setMayaNumber] = useState('');
  const [mayaQrBase64, setMayaQrBase64] = useState(null);

  // Penalty Config Modal
  const [penaltyVisible, setPenaltyVisible] = useState(false);
  const [penaltyGrace, setPenaltyGrace] = useState('3');
  const [penaltyRate, setPenaltyRate] = useState('2.00');

  // Confirmation Modals
  const [rateConfirmVisible, setRateConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
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

      const pp = await getSetting('partial_payments_enabled');
      if (pp !== null) setPartialPayments(pp === 'true');
      const gn = await getSetting('gcash_name');
      if (gn) setGcashName(gn);
      const gnum = await getSetting('gcash_number');
      if (gnum) setGcashNumber(gnum);
      const gqr = await getSetting('gcash_qr');
      if (gqr) setGcashQrBase64(gqr);
      const mn = await getSetting('maya_name');
      if (mn) setMayaName(mn);
      const mnum = await getSetting('maya_number');
      if (mnum) setMayaNumber(mnum);
      const mqr = await getSetting('maya_qr');
      if (mqr) setMayaQrBase64(mqr);

    } catch (err) {
      console.warn("Failed to load settings:", err);
    }

    const status = getConnectionStatus();
    setIsMockMode(status.isMock);

    try {
      const pen = await getPenaltySettings();
      if (pen.penalty_grace_period_days) setPenaltyGrace(pen.penalty_grace_period_days);
      if (pen.penalty_rate) setPenaltyRate(pen.penalty_rate);
    } catch (e) {
      console.warn("Failed to load penalty config:", e);
    }
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

  const handleLogout = () => setLogoutConfirmVisible(true);

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
    Alert.alert('Saved', `ESP32 IP set to ${esp32Ip.trim()}`);
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

  const handleSavePenalty = async () => {
    try {
      await updatePenaltySettings({
        penalty_grace_period_days: penaltyGrace,
        penalty_rate: penaltyRate
      });
      setPenaltyVisible(false);
      Alert.alert('Saved', 'Penalty configuration updated successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update penalty config');
    }
  };

  const pickImage = async (setter) => {
    try {
      const requestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync || ImagePicker.default?.requestMediaLibraryPermissionsAsync;
      const launchLibrary = ImagePicker.launchImageLibraryAsync || ImagePicker.default?.launchImageLibraryAsync;
      
      const { status } = await requestPermissions();
      if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your photo library to upload QR codes.');
          return;
      }

      let result = await launchLibrary({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
          setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (err) {
      console.warn('Image picker error, attempting DocumentPicker fallback:', err);
      try {
          const result = await DocumentPicker.getDocumentAsync({
              type: ['image/*'],
              copyToCacheDirectory: true,
          });
          
          if (!result.canceled && result.assets?.[0]) {
              const file = result.assets[0];
              const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
              const mimeType = file.mimeType || 'image/jpeg';
              setter(`data:${mimeType};base64,${base64}`);
          }
      } catch (fallbackErr) {
          console.warn('DocumentPicker Error:', fallbackErr);
          Alert.alert('Error', 'Unable to open file picker. This device may not support file selection.');
      }
    }
  };

  const handleSavePaymentMethods = async () => {
    await Promise.all([
      setSetting('partial_payments_enabled', partialPayments.toString()),
      setSetting('gcash_name', gcashName),
      setSetting('gcash_number', gcashNumber),
      setSetting('maya_name', mayaName),
      setSetting('maya_number', mayaNumber),
      ...(gcashQrBase64 ? [setSetting('gcash_qr', gcashQrBase64)] : []),
      ...(mayaQrBase64 ? [setSetting('maya_qr', mayaQrBase64)] : []),
    ]);
    setPaymentMethodsVisible(false);
    Alert.alert('Saved', 'Payment method settings updated successfully.');
  };

  const MenuItem = ({ icon, label, value, onPress, danger, highlighted }) => (
    <TouchableOpacity 
      style={[styles.menuItem, highlighted && styles.highlightedItem]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }, highlighted && { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : (highlighted ? COLORS.primary : COLORS.primary)} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && { color: COLORS.danger }, highlighted && { fontWeight: 'bold' }]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
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
        trackColor={{ false: COLORS.surfaceLight, true: 'rgba(34,197,94,0.35)' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Admin Settings</Text>
        <Text style={styles.subtitle}>Facility & system configuration</Text>

        <GlassCard gradient style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Administrator'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>LANDLORD ADMIN</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editProfileBtn}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editProfileText}>Edit Account Details</Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <View style={styles.rateIcon}>
              <Ionicons name="cash" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.rateTitle}>Electricity Billing Rate</Text>
          </View>
          <Text style={styles.rateDesc}>Set the price per kWh for tenant billing calculations.</Text>
          <View style={styles.rateInputRow}>
            <View style={styles.currencyInput}>
              <Text style={styles.currency}>₱</Text>
              <TextInput
                style={styles.rateInput} value={rate} onChangeText={setRate}
                keyboardType="numeric" placeholder="12.50"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <TouchableOpacity onPress={handleSaveRate} activeOpacity={0.8} style={styles.updateBtn}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.updateBtnGradient}>
                <Text style={styles.updateBtnText}>Update</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={styles.groupTitle}>FACILITY TOOLS</Text>
        <GlassCard style={styles.menuCard}>
          <MenuItem icon="card-outline" label="Payment Methods" value="Manage GCash, Maya & Partial Payments" onPress={() => setPaymentMethodsVisible(true)} />
          <MenuItem icon="shield-checkmark-outline" label="System Audit Logs" value="Immutable compliance records" onPress={() => router.push('/(landlord)/audit')} />
          <MenuItem icon="warning-outline" label="Penalty Configuration" value="Grace period & late fees" onPress={() => setPenaltyVisible(true)} />
          <MenuItem icon="bulb" label="Manage Electricity Tips" value="Curate tips for student saving habits" highlighted={true} onPress={() => router.push('/(landlord)/manage-tips')} />
          <MenuItem icon="notifications-outline" label="Notification Alerts" value="Configure system triggers" onPress={() => setNotifVisible(true)} />
        </GlassCard>

        <Text style={styles.groupTitle}>SYSTEM CONFIG</Text>
        <GlassCard style={styles.menuCard}>
          <MenuItem icon="book-outline" label="Installation & User Manual" value="System documentation & wiring" onPress={() => router.push('/(landlord)/manual')} />
          <MenuItem icon="wifi-outline" label="Hardware Connection" value={isMockMode ? 'Mocking active' : `Gateway: ${esp32Ip}`} onPress={() => { setEsp32IpError(''); setEsp32Visible(true); }} />
          <MenuItem icon="document-text-outline" label="Terms and Conditions" value="System Legal Policies" onPress={() => router.push('/terms')} />
          <MenuItem icon="information-circle-outline" label="About System" value="Wattipid v2.1.0-prod" onPress={() => setAboutVisible(true)} />
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>Wattipid Energy Management • Build 2026.05</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODALS --- */}
      
      <BaseModal visible={rateConfirmVisible} onClose={() => setRateConfirmVisible(false)}>
        <ModalHeader title="Confirm Rate Change" icon="cash" onClose={() => setRateConfirmVisible(false)} />
        <ModalBody><Text style={styles.confirmMsg}>Apply new rate of ₱{parseFloat(rate||0).toFixed(2)}/kWh to all billing?</Text></ModalBody>
        <ModalFooter primaryLabel="Update" onPrimaryPress={handleConfirmSaveRate} secondaryLabel="Cancel" onSecondaryPress={() => setRateConfirmVisible(false)} />
      </BaseModal>

      <BaseModal visible={logoutConfirmVisible} onClose={() => setLogoutConfirmVisible(false)}>
        <ModalHeader title="Sign Out" icon="log-out" iconColor={COLORS.danger} onClose={() => setLogoutConfirmVisible(false)} />
        <ModalBody><Text style={styles.confirmMsg}>Are you sure you want to end your current session?</Text></ModalBody>
        <ModalFooter primaryLabel="Sign Out" primaryDanger onPrimaryPress={handleConfirmLogout} secondaryLabel="Cancel" onSecondaryPress={() => setLogoutConfirmVisible(false)} />
      </BaseModal>

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

      <Modal visible={esp32Visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEsp32Visible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><Ionicons name="wifi" size={32} color={COLORS.primary} /></View>
            <Text style={styles.modalTitle}>Hardware Gateway</Text>
            <Text style={styles.modalDesc}>Enter the local IP of your ESP32 monitor.</Text>
            <TextInput style={styles.modalInput} value={esp32Ip} onChangeText={t => { setEsp32Ip(t); setEsp32IpError(''); }} placeholder="192.168.1.100" placeholderTextColor={COLORS.textMuted} />
            {esp32IpError ? <Text style={styles.errorText}>{esp32IpError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setEsp32Visible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEsp32} style={styles.modalSave}><Text style={styles.modalSaveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={notifVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNotifVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><Ionicons name="notifications" size={32} color={COLORS.primary} /></View>
            <Text style={styles.modalTitle}>Notification Alerts</Text>
            <Text style={styles.modalDesc}>Choose which events trigger alerts for you.</Text>
            <View style={styles.toggleList}>
              <ToggleRow label="Budget Exceeded" desc="When a tenant hits their limit" value={notifBudget} onToggle={setNotifBudget} />
              <ToggleRow label="High Consumption" desc="When usage spikes unexpectedly" value={notifHighCons} onToggle={setNotifHighCons} />
              <ToggleRow label="New Tenant" desc="When a new account is registered" value={notifNewTenant} onToggle={setNotifNewTenant} />
              <ToggleRow label="Tenant Revoked" desc="When access is removed" value={notifRevoke} onToggle={setNotifRevoke} />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setNotifVisible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Discard</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotifications} style={styles.modalSave}><Text style={styles.modalSaveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={penaltyVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPenaltyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}><Ionicons name="warning" size={32} color={COLORS.danger} /></View>
            <Text style={styles.modalTitle}>Penalty Settings</Text>
            <Text style={styles.modalDesc}>3-Day Payment Policy: Tenants must settle within 3 calendar days after receiving the billing statement.</Text>
            
            <View style={[styles.form, { marginTop: 10 }]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAYMENT DUE PERIOD (DAYS)</Text>
                <TextInput style={[styles.input, { opacity: 0.5 }]} value="3" editable={false} keyboardType="numeric" />
                <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Fixed at 3 days per billing policy</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PENALTY RATE (% OF TOTAL BILL)</Text>
                <TextInput style={styles.input} value={penaltyRate} onChangeText={setPenaltyRate} keyboardType="numeric" placeholder="2.00" placeholderTextColor={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>One-time flat penalty applied after due date</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setPenaltyVisible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSavePenalty} style={styles.modalSave}><Text style={styles.modalSaveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={paymentMethodsVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPaymentMethodsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingHorizontal: 16 }]}>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <View style={[styles.modalIconBox, { alignSelf: 'center' }]}><Ionicons name="card" size={32} color={COLORS.primary} /></View>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Payment Settings</Text>
              <Text style={styles.modalDesc}>Configure options for tenants</Text>
              
              <View style={{ marginBottom: 20 }}>
                <ToggleRow label="Enable Partial Payments" desc="Allow tenants to pay bills partially" value={partialPayments} onToggle={setPartialPayments} />
              </View>

              <Text style={[styles.groupTitle, { marginLeft: 0 }]}>GCASH DETAILS</Text>
              <View style={[styles.form, { marginBottom: 24 }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ACCOUNT NAME</Text>
                  <TextInput style={styles.input} value={gcashName} onChangeText={setGcashName} placeholder="e.g. Juan Dela Cruz" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ACCOUNT NUMBER</Text>
                  <TextInput style={styles.input} value={gcashNumber} onChangeText={setGcashNumber} placeholder="e.g. 09123456789" placeholderTextColor={COLORS.textMuted} />
                </View>
                <TouchableOpacity style={styles.qrUploadBtn} onPress={() => pickImage(setGcashQrBase64)}>
                  <Ionicons name="qr-code-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.qrUploadText}>{gcashQrBase64 ? 'Change GCash QR Code' : 'Upload GCash QR Code'}</Text>
                </TouchableOpacity>
                {gcashQrBase64 && <Image source={{uri: gcashQrBase64}} style={styles.qrPreview} resizeMode="contain" />}
              </View>

              <Text style={[styles.groupTitle, { marginLeft: 0 }]}>MAYA DETAILS</Text>
              <View style={[styles.form, { marginBottom: 10 }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ACCOUNT NAME</Text>
                  <TextInput style={styles.input} value={mayaName} onChangeText={setMayaName} placeholder="e.g. Juan Dela Cruz" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ACCOUNT NUMBER</Text>
                  <TextInput style={styles.input} value={mayaNumber} onChangeText={setMayaNumber} placeholder="e.g. 09123456789" placeholderTextColor={COLORS.textMuted} />
                </View>
                <TouchableOpacity style={styles.qrUploadBtn} onPress={() => pickImage(setMayaQrBase64)}>
                  <Ionicons name="qr-code-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.qrUploadText}>{mayaQrBase64 ? 'Change Maya QR Code' : 'Upload Maya QR Code'}</Text>
                </TouchableOpacity>
                {mayaQrBase64 && <Image source={{uri: mayaQrBase64}} style={styles.qrPreview} resizeMode="contain" />}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { marginTop: 16 }]}>
              <TouchableOpacity onPress={() => setPaymentMethodsVisible(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSavePaymentMethods} style={styles.modalSave}><Text style={styles.modalSaveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={aboutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><Ionicons name="flash" size={36} color={COLORS.primary} /></View>
            <Text style={styles.modalTitle}>Wattipid Smart System</Text>
            <Text style={styles.modalDesc}>v2.1.0-prod • Cloud-Native Architecture</Text>
            <View style={styles.aboutBox}>
              <Text style={styles.aboutText}>
                Wattipid is an enterprise-grade IoT electricity monitoring platform designed for modern rental facilities. It utilizes ESP32 microcontrollers, purely Cloud-Based synchronization, and real-time analytics to help landlords and tenants track consumption securely and efficiently without physical LAN restrictions.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAboutVisible(false)} style={[styles.modalSave, { width: '100%', marginTop: 24, flex: 0 }]}><Text style={styles.modalSaveText}>Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
