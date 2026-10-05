import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { getSetting, setSetting } from '../../services/database';
import { updatePenaltySettings, getPenaltySettings } from '../../services/penaltyService';
import { BaseModal, ModalHeader, SignOutModal } from '../../components/modals/BaseModal';
import EditProfileModal from '@/components/landlord/EditProfileModal';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/settings.styles';

const CopilotView = walkthroughable(View);

export default function LandlordSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showModal } = useModal();
  const scrollViewRef = useRef(null);

  useTourAutoStart('settings', true, scrollViewRef, 'landlord');
  
  // Rate state
  const [rateVisible, setRateVisible] = useState(false);
  const [rate, setRate] = useState('');
  const [newRate, setNewRate] = useState('');

  // Edit Profile / Account Details state
  const [editing, setEditing] = useState(false);

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
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const r = await getSetting('rate_per_kwh');
        if (!isMounted) return;
        if (r) setRate(r);

        const nb = await getSetting('landlord_notif_budget');
        if (!isMounted) return;
        if (nb !== null) setNotifBudget(nb !== 'false');
        const nhc = await getSetting('landlord_notif_high_cons');
        if (!isMounted) return;
        if (nhc !== null) setNotifHighCons(nhc !== 'false');
        const nnt = await getSetting('landlord_notif_new_tenant');
        if (!isMounted) return;
        if (nnt !== null) setNotifNewTenant(nnt !== 'false');
        const nr = await getSetting('landlord_notif_revoke');
        if (!isMounted) return;
        if (nr !== null) setNotifRevoke(nr !== 'false');
      } catch (err) {
        if (isMounted) console.warn('[LandlordSettings] Failed to load settings:', err);
      }

      try {
        const pen = await getPenaltySettings();
        if (!isMounted) return;
        if (pen?.penalty_grace_period_days) setPenaltyGrace(pen.penalty_grace_period_days);
        if (pen?.penalty_rate) setPenaltyRate(pen.penalty_rate);
      } catch (e) {
        if (isMounted) console.warn('[LandlordSettings] Failed to load penalty config:', e);
      }
    };

    loadSettings(); 
    return () => { isMounted = false; };
  }, []);

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
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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

        {/* ================= PROFILE CARD (Step 13) ================= */}
        <CopilotStep
          text="Manage landlord administrator credentials, name, and contact information."
          order={13}
          name="landlord_settings_profile"
        >
          <CopilotView style={{ width: '100%' }}>
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
          </CopilotView>
        </CopilotStep>

        {/* ================= ACCOUNT & SECURITY ================= */}
        <Text style={styles.groupTitle}>ACCOUNT & SECURITY</Text>
        <View style={styles.menuCard}>
          <MenuItem 
            icon="key-outline" 
            label="Change Password" 
            value="Update administrator login password" 
            onPress={() => setEditing(true)} 
            iconColor="#10B981"
          />
        </View>

        {/* ================= FACILITY TOOLS (Step 14) ================= */}
        <CopilotStep
          text="Configure electricity billing rates (₱/kWh), penalty grace periods, and dorm energy tips."
          order={14}
          name="landlord_facility_tools"
        >
          <CopilotView style={{ width: '100%' }}>
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
          </CopilotView>
        </CopilotStep>

        {/* ================= SYSTEM CONFIG (Step 15) ================= */}
        <CopilotStep
          text="Access app guides, hardware wiring documentation, or replay this interactive landlord walkthrough anytime."
          order={15}
          name="landlord_system_config"
        >
          <CopilotView style={{ width: '100%' }}>
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
          </CopilotView>
        </CopilotStep>

        {/* ================= SIGN OUT ACCOUNT ================= */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>Wattipid Energy Management • Build 2026.05</Text>
      </ScrollView>

      {/* ================= MODALS ================= */}
      {/* 1. Rate Change Modal (Floating Centered) */}
      <BaseModal visible={rateVisible} onClose={() => setRateVisible(false)} centered={true}>
        <ModalHeader title="Electricity Billing Rate" icon="flash" iconColor="#10B981" onClose={() => setRateVisible(false)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          {/* Current Rate Pill */}
          <View style={styles.modalPill}>
            <Ionicons name="information-circle-outline" size={13} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.modalPillText}>
              Current Rate: ₱{rate || '12.50'} / kWh
            </Text>
          </View>

          {/* Numeric Input with Currency & Unit */}
          <Text style={styles.label}>NEW RATE PER KILOWATT-HOUR</Text>
          <View style={styles.numericInputWrap}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput 
              style={styles.numericInput} 
              value={newRate} 
              onChangeText={setNewRate} 
              placeholder="12.50" 
              placeholderTextColor="#475569" 
              keyboardType="numeric" 
              selectionColor="#10B981"
            />
            <Text style={styles.unitSymbol}>/ kWh</Text>
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetRow}>
            {['10.00', '12.50', '15.00', '18.00'].map((preset) => {
              const isSelected = newRate === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setNewRate(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    ₱{preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Live Consumption Preview Hint */}
          <View style={styles.calculationHint}>
            <Ionicons name="sparkles" size={11} color="#10B981" />
            <Text style={styles.calculationHintText}>
              {parseFloat(newRate) > 0 
                ? `100 kWh usage will cost ₱${(parseFloat(newRate) * 100).toFixed(2)}`
                : 'Enter a valid rate to preview calculation'}
            </Text>
          </View>

          {/* Action Row - Integrated safely inside modal box */}
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => setRateVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={handleSaveRate}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnPrimaryText}>Save Rate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BaseModal>

      {/* 2. Edit Account Details Floating Centered Modal */}
      <EditProfileModal
        visible={editing}
        onClose={() => setEditing(false)}
      />

      {/* 3. Notifications Modal (Floating Centered) */}
      <BaseModal visible={notifVisible} onClose={() => setNotifVisible(false)} centered={true}>
        <ModalHeader title="Notification Alerts" icon="notifications" iconColor="#10B981" onClose={() => setNotifVisible(false)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          <Text style={styles.helperText}>
            Choose which dormitory events trigger real-time push alerts to your device.
          </Text>

          <View style={styles.toggleCard}>
            <View style={styles.toggleRowItem}>
              <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="wallet-outline" size={15} color="#F59E0B" />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Budget Exceeded</Text>
                <Text style={styles.toggleDesc}>When a tenant exceeds allowance</Text>
              </View>
              <Switch
                value={notifBudget}
                onValueChange={setNotifBudget}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                thumbColor={notifBudget ? '#10B981' : '#64748B'}
              />
            </View>

            <View style={styles.toggleDivider} />

            <View style={styles.toggleRowItem}>
              <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="flash-outline" size={15} color="#EF4444" />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>High Consumption</Text>
                <Text style={styles.toggleDesc}>When sudden power spikes occur</Text>
              </View>
              <Switch
                value={notifHighCons}
                onValueChange={setNotifHighCons}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                thumbColor={notifHighCons ? '#10B981' : '#64748B'}
              />
            </View>

            <View style={styles.toggleDivider} />

            <View style={styles.toggleRowItem}>
              <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="person-add-outline" size={15} color="#10B981" />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>New Tenant Registration</Text>
                <Text style={styles.toggleDesc}>When a tenant signs up</Text>
              </View>
              <Switch
                value={notifNewTenant}
                onValueChange={setNotifNewTenant}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                thumbColor={notifNewTenant ? '#10B981' : '#64748B'}
              />
            </View>

            <View style={styles.toggleDivider} />

            <View style={styles.toggleRowItem}>
              <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(100, 116, 139, 0.12)' }]}>
                <Ionicons name="person-remove-outline" size={15} color="#94A3B8" />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Tenant Revocation</Text>
                <Text style={styles.toggleDesc}>When access rights are removed</Text>
              </View>
              <Switch
                value={notifRevoke}
                onValueChange={setNotifRevoke}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                thumbColor={notifRevoke ? '#10B981' : '#64748B'}
              />
            </View>
          </View>

          {/* Action Row - Integrated safely inside modal box */}
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => setNotifVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnSecondaryText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={handleSaveNotifications}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnPrimaryText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BaseModal>

      {/* 4. Penalty Settings Modal (Floating Centered) */}
      <BaseModal visible={penaltyVisible} onClose={() => setPenaltyVisible(false)} centered={true}>
        <ModalHeader title="Penalty Settings" icon="warning" iconColor="#F59E0B" onClose={() => setPenaltyVisible(false)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          {/* Policy Info Card */}
          <View style={[styles.modalPill, styles.modalPillWarning]}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={[styles.modalPillText, { color: '#F59E0B' }]}>
              3-Day Settlement Policy Active
            </Text>
          </View>

          <Text style={styles.helperText}>
            Tenants receive a 3-day grace period from the billing date before late surcharges are applied.
          </Text>

          {/* Fixed Due Period Badge */}
          <View style={styles.fixedPolicyRow}>
            <View style={styles.fixedPolicyLeft}>
              <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
              <View>
                <Text style={styles.fixedPolicyTitle}>Settlement Window</Text>
                <Text style={styles.fixedPolicySub}>Standard tenant policy</Text>
              </View>
            </View>
            <View style={styles.fixedPolicyBadge}>
              <Text style={styles.fixedPolicyBadgeText}>3 DAYS</Text>
            </View>
          </View>

          {/* Penalty Rate Input */}
          <Text style={[styles.label, { marginTop: 4 }]}>LATE PENALTY RATE (% OF BILL)</Text>
          <View style={[styles.numericInputWrap, { borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
            <TextInput 
              style={styles.numericInput} 
              value={penaltyRate} 
              onChangeText={setPenaltyRate} 
              placeholder="2.00" 
              placeholderTextColor="#475569" 
              keyboardType="numeric" 
              selectionColor="#F59E0B"
            />
            <Text style={[styles.unitSymbol, { color: '#F59E0B' }]}>%</Text>
          </View>

          {/* Quick Penalty Presets */}
          <View style={styles.presetRow}>
            {['1.00', '2.00', '3.00', '5.00'].map((preset) => {
              const isSelected = penaltyRate === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isSelected && styles.presetChipActiveWarning]}
                  onPress={() => setPenaltyRate(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, isSelected && { color: '#F59E0B', fontWeight: '800' }]}>
                    {preset}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Live Penalty Preview */}
          <View style={styles.calculationHint}>
            <Ionicons name="calculator-outline" size={11} color="#F59E0B" />
            <Text style={styles.calculationHintText}>
              {parseFloat(penaltyRate) > 0 
                ? `₱1,000 overdue bill incurs a ₱${((1000 * parseFloat(penaltyRate)) / 100).toFixed(2)} penalty`
                : 'Enter a penalty percentage'}
            </Text>
          </View>

          {/* Action Row - Integrated safely inside modal box */}
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => setPenaltyVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnSecondaryText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnPrimary, { backgroundColor: '#F59E0B' }]}
              onPress={handleSavePenalty}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalBtnPrimaryText, { color: '#451A03' }]}>Save Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BaseModal>

      {/* 5. About System Modal (Floating Centered) */}
      <BaseModal visible={aboutVisible} onClose={() => setAboutVisible(false)} centered={true}>
        <ModalHeader title="Wattipid Smart System" icon="flash" iconColor="#10B981" onClose={() => setAboutVisible(false)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          <View style={styles.modalPill}>
            <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 5 }} />
            <Text style={styles.modalPillText}>v2.1.0 • Enterprise Cloud Architecture</Text>
          </View>
          <Text style={{ color: '#94A3B8', lineHeight: 18, fontSize: 11.5, marginBottom: 8 }}>
            Wattipid is an enterprise-grade IoT electricity monitoring platform designed for modern rental facilities. It utilizes ESP32 microcontrollers, purely Cloud-Based synchronization, and real-time analytics to help landlords and tenants track consumption securely and efficiently without physical LAN restrictions.
          </Text>
          <Text style={{ color: '#64748B', fontSize: 10.5, fontWeight: '600', marginBottom: 10 }}>
            © 2026 Wattipid Technologies • All Rights Reserved
          </Text>
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={[styles.modalBtnPrimary, { flex: 1 }]}
              onPress={() => setAboutVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnPrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
