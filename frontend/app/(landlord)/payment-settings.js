import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getSetting, setSetting } from '../../services/database';
import { useModal } from '../../contexts/ModalContext';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '../../styles/theme';
import { Switch } from 'react-native';

export default function PaymentSettings() {
  const router = useRouter();
  const { showModal } = useModal();

  const [partialPayments, setPartialPayments] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashQrBase64, setGcashQrBase64] = useState(null);
  const [mayaName, setMayaName] = useState('');
  const [mayaNumber, setMayaNumber] = useState('');
  const [mayaQrBase64, setMayaQrBase64] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
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
      console.warn("Failed to load payment settings:", err);
    }
  };

  const pickImage = async (setter) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
          showModal({ type: 'warning', title: 'Permission Required', message: 'Please allow access to your photo library to upload QR codes.' });
          return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
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
              const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
              const mimeType = file.mimeType || 'image/jpeg';
              setter(`data:${mimeType};base64,${base64}`);
          }
      } catch (fallbackErr) {
          console.warn('DocumentPicker Error:', fallbackErr);
          showModal({ type: 'error', title: 'Error', message: 'Unable to open file picker. This device may not support file selection.' });
      }
    }
  };

  const handleSavePaymentMethods = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setSetting('partial_payments_enabled', partialPayments.toString()),
        setSetting('gcash_name', gcashName),
        setSetting('gcash_number', gcashNumber),
        setSetting('maya_name', mayaName),
        setSetting('maya_number', mayaNumber),
        ...(gcashQrBase64 ? [setSetting('gcash_qr', gcashQrBase64)] : []),
        ...(mayaQrBase64 ? [setSetting('maya_qr', mayaQrBase64)] : []),
      ]);
      showModal({ type: 'success', title: 'Saved', message: 'Payment method settings updated successfully.' });
      router.back();
    } catch (e) {
      showModal({ type: 'error', title: 'Error', message: 'Failed to save payment settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Enable Partial Payments</Text>
              <Text style={styles.toggleDesc}>Allow tenants to pay their bills partially</Text>
            </View>
            <Switch
              value={partialPayments}
              onValueChange={setPartialPayments}
              trackColor={{ false: COLORS.surfaceLight, true: 'rgba(34,197,94,0.35)' }}
              thumbColor={partialPayments ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>GCASH DETAILS</Text>
        <GlassCard style={styles.card}>
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
        </GlassCard>

        <Text style={styles.sectionTitle}>MAYA DETAILS</Text>
        <GlassCard style={styles.card}>
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
        </GlassCard>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={handleSavePaymentMethods}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  scroll: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted, marginTop: 24, marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  card: { padding: 20, borderRadius: 24, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleContent: { flex: 1, paddingRight: 16 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  toggleDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: COLORS.textPrimary, fontSize: 15 },
  qrUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 4 },
  qrUploadText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  qrPreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold' }
});
