import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Share,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import {
  getDormitoryBusinessInfo,
  updateDormitoryBusinessInfo,
  getDormitoryDocuments,
  saveDormitoryDocument,
  deleteDormitoryDocument,
  verifyDormitoryDocument,
} from '../services/dormitoryService';
import styles from '../styles/about.styles';

// Standard document categories reflecting Philippine & local government requirements
const DOCUMENT_CATEGORIES = [
  "Business Permit / Mayor's Permit",
  'Barangay Business Clearance',
  'DTI Business Name Registration',
  'SEC Registration',
  'BIR Certificate of Registration (Form 2303)',
  'Fire Safety Inspection Certificate (FSIC)',
  'Occupancy Permit',
  'Sanitary Permit',
  'Other Applicable Document',
];

const REGISTRATION_STRUCTURES = [
  'Sole Proprietorship (DTI)',
  'SEC Registered Corporation',
  'SEC Registered Partnership',
  'CDA Cooperative',
  'Other Business Entity',
];

export default function AboutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { showModal } = useModal();

  const isLandlord = user?.role === 'landlord';

  // Navigation segment tab: 'all' | 'system' | 'business' | 'documents'
  const [activeTab, setActiveTab] = useState(params?.tab || 'all');

  useEffect(() => {
    if (params?.tab) {
      setActiveTab(params.tab);
    }
  }, [params?.tab]);

  // Viewer Modal state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Landlord: Edit Business Info Modal state
  const [editInfoVisible, setEditInfoVisible] = useState(false);
  const [infoForm, setInfoForm] = useState({
    registered_business_name: '',
    property_name: '',
    business_address: '',
    owner_operator_name: '',
    registration_type: '',
    registration_number: '',
    contact_phone: '',
    contact_email: '',
    date_established: '',
    tin_number: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // Landlord: Upload / Edit Document Modal state
  const [uploadDocVisible, setUploadDocVisible] = useState(false);

  // Back Navigation Handler
  // Strictly navigates back to Settings page (Settings -> About -> Back -> Settings)
  // Uses replace to respect navigation history without creating duplicate stack entries
  const handleGoBack = useCallback(() => {
    if (viewerVisible) {
      setViewerVisible(false);
      return;
    }
    if (editInfoVisible) {
      setEditInfoVisible(false);
      return;
    }
    if (uploadDocVisible) {
      setUploadDocVisible(false);
      return;
    }
    const target = isLandlord ? '/(landlord)/settings' : '/(tenant)/settings';
    router.replace(target);
  }, [viewerVisible, editInfoVisible, uploadDocVisible, isLandlord, router]);

  // Handle Android physical hardware back button
  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  // Data states
  const [businessInfo, setBusinessInfo] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const [editingDocId, setEditingDocId] = useState(null);
  const [docForm, setDocForm] = useState({
    document_name: '',
    document_type: DOCUMENT_CATEGORIES[0],
    issuing_authority: '',
    permit_number: '',
    issue_date: '',
    expiration_date: '',
    file_url: '',
    file_name: '',
    file_type: 'image/jpeg',
    file_size_kb: null,
    is_public_for_tenants: true,
    verification_status: 'verified',
    verification_notes: '',
  });
  const [savingDoc, setSavingDoc] = useState(false);

  // Initial data fetch
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [infoRes, docsRes] = await Promise.all([
        getDormitoryBusinessInfo(),
        getDormitoryDocuments(),
      ]);

      if (infoRes) setBusinessInfo(infoRes);
      if (Array.isArray(docsRes)) setDocuments(docsRes);
    } catch (err) {
      console.warn('[AboutScreen] Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Edit Business Info Modal
  const handleOpenEditInfo = () => {
    setInfoForm({
      registered_business_name: businessInfo?.registered_business_name || '',
      property_name: businessInfo?.property_name || '',
      business_address: businessInfo?.business_address || '',
      owner_operator_name: businessInfo?.owner_operator_name || '',
      registration_type: businessInfo?.registration_type || REGISTRATION_STRUCTURES[0],
      registration_number: businessInfo?.registration_number || '',
      contact_phone: businessInfo?.contact_phone || '',
      contact_email: businessInfo?.contact_email || '',
      date_established: businessInfo?.date_established || '',
      tin_number: businessInfo?.tin_number || '',
    });
    setEditInfoVisible(true);
  };

  // Save Business Info (Single-record upsert)
  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await updateDormitoryBusinessInfo(infoForm);
      if (res.success) {
        setBusinessInfo(res.data);
        setEditInfoVisible(false);
        if (showModal) {
          showModal({
            type: 'success',
            title: 'Information Updated',
            message: 'Dormitory business information was saved successfully.',
          });
        }
      }
    } catch (err) {
      if (showModal) {
        showModal({
          type: 'error',
          title: 'Update Failed',
          message: err.message || 'Unable to update dormitory information.',
        });
      }
    } finally {
      setSavingInfo(false);
    }
  };

  // Open Upload / Edit Document Modal
  const handleOpenUploadDoc = (docToEdit = null) => {
    if (docToEdit) {
      setEditingDocId(docToEdit.id);
      setDocForm({
        document_name: docToEdit.document_name || '',
        document_type: docToEdit.document_type || DOCUMENT_CATEGORIES[0],
        issuing_authority: docToEdit.issuing_authority || '',
        permit_number: docToEdit.permit_number || '',
        issue_date: docToEdit.issue_date || '',
        expiration_date: docToEdit.expiration_date || '',
        file_url: docToEdit.file_url || '',
        file_name: docToEdit.file_name || 'Attached Document',
        file_type: docToEdit.file_type || 'image/jpeg',
        file_size_kb: docToEdit.file_size_kb || null,
        is_public_for_tenants: docToEdit.is_public_for_tenants !== 0,
        verification_status: docToEdit.verification_status || 'verified',
        verification_notes: docToEdit.verification_notes || '',
      });
    } else {
      setEditingDocId(null);
      setDocForm({
        document_name: '',
        document_type: DOCUMENT_CATEGORIES[0],
        issuing_authority: '',
        permit_number: '',
        issue_date: '',
        expiration_date: '',
        file_url: '',
        file_name: '',
        file_type: 'image/jpeg',
        file_size_kb: null,
        is_public_for_tenants: true,
        verification_status: 'verified',
        verification_notes: '',
      });
    }
    setUploadDocVisible(true);
  };

  // Image & Document Pickers
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload documents.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const base64Data = asset.base64
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;

        setDocForm(prev => ({
          ...prev,
          file_url: base64Data,
          file_name: asset.fileName || 'document_image.jpg',
          file_type: mime,
          file_size_kb: asset.fileSize ? Math.round(asset.fileSize / 1024) : null,
          document_name: prev.document_name || (asset.fileName ? asset.fileName.replace(/\.[^/.]+$/, '') : ''),
        }));
      }
    } catch (e) {
      console.warn('Error picking image:', e);
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        let base64 = null;
        try {
          base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        } catch (readErr) {
          console.warn('Could not read file base64:', readErr);
        }

        const mime = file.mimeType || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        const finalUrl = base64 ? `data:${mime};base64,${base64}` : file.uri;

        setDocForm(prev => ({
          ...prev,
          file_url: finalUrl,
          file_name: file.name,
          file_type: mime,
          file_size_kb: file.size ? Math.round(file.size / 1024) : null,
          document_name: prev.document_name || file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    } catch (e) {
      console.warn('Error picking document:', e);
    }
  };

  // Save Document
  const handleSaveDoc = async () => {
    if (!docForm.document_name.trim()) {
      Alert.alert('Required', 'Please enter a Document Name.');
      return;
    }
    if (!docForm.file_url) {
      Alert.alert('Required', 'Please select a document image or PDF file.');
      return;
    }

    setSavingDoc(true);
    try {
      const payload = {
        id: editingDocId,
        ...docForm,
      };
      const res = await saveDormitoryDocument(payload);
      if (res.success) {
        setUploadDocVisible(false);
        fetchData();
        if (showModal) {
          showModal({
            type: 'success',
            title: editingDocId ? 'Document Updated' : 'Document Uploaded',
            message: `${docForm.document_name} was saved successfully.`,
          });
        }
      }
    } catch (err) {
      if (showModal) {
        showModal({
          type: 'error',
          title: 'Save Failed',
          message: err.message || 'Unable to save document.',
        });
      }
    } finally {
      setSavingDoc(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id, docName) => {
    Alert.alert(
      'Remove Document',
      `Are you sure you want to remove "${docName}" from the official records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDormitoryDocument(id);
              fetchData();
              if (showModal) {
                showModal({
                  type: 'success',
                  title: 'Document Removed',
                  message: 'The document was removed from official records.',
                });
              }
            } catch (err) {
              if (showModal) {
                showModal({
                  type: 'error',
                  title: 'Deletion Failed',
                  message: err.message || 'Could not delete document.',
                });
              }
            }
          },
        },
      ]
    );
  };

  // Toggle Verification status (Landlord only)
  const handleToggleVerification = async (doc) => {
    const nextStatus = doc.verification_status === 'verified' ? 'pending_verification' : 'verified';
    try {
      await verifyDormitoryDocument(doc.id, nextStatus);
      fetchData();
      if (showModal) {
        showModal({
          type: 'success',
          title: 'Status Updated',
          message: `Document status changed to ${nextStatus === 'verified' ? 'Verified' : 'Pending Verification'}.`,
        });
      }
    } catch (err) {
      if (showModal) {
        showModal({
          type: 'error',
          title: 'Update Error',
          message: err.message || 'Could not change verification status.',
        });
      }
    }
  };

  // Open Document in Viewer
  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setViewerVisible(true);
  };

  // Share / Export Document
  const handleShareDocument = async () => {
    if (!selectedDoc?.file_url) return;
    try {
      if (selectedDoc.file_url.startsWith('data:')) {
        const ext = selectedDoc.file_type === 'application/pdf' ? 'pdf' : 'jpg';
        const fileUri = `${FileSystem.cacheDirectory}${selectedDoc.document_name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
        const base64Data = selectedDoc.file_url.split(',')[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Sharing', 'File saved to cache.');
        }
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(selectedDoc.file_url);
        } else {
          await Share.share({ url: selectedDoc.file_url, message: selectedDoc.document_name });
        }
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (doc) => {
    const status = doc.effective_status || doc.verification_status;
    if (status === 'expired') {
      return (
        <View style={[styles.statusBadge, styles.badgeExpired]}>
          <Ionicons name="alert-circle" size={11} color="#EF4444" />
          <Text style={styles.badgeExpiredText}>Expired</Text>
        </View>
      );
    }
    if (status === 'verified') {
      return (
        <View style={[styles.statusBadge, styles.badgeValid]}>
          <Ionicons name="checkmark-circle" size={11} color="#10B981" />
          <Text style={styles.badgeValidText}>Valid</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.badgePending]}>
        <Ionicons name="time" size={11} color="#F59E0B" />
        <Text style={styles.badgePendingText}>Pending Verification</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ================= HEADER BAR ================= */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Settings"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>About Wattipid</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>System & Dormitory Profile</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => fetchData(true)}
              activeOpacity={0.7}
              accessibilityLabel="Refresh Data"
              accessibilityRole="button"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Ionicons name="refresh-outline" size={17} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= COMPACT SEGMENT TABS ================= */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'system' && styles.tabBtnActive]}
            onPress={() => setActiveTab('system')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'system' && styles.tabBtnTextActive]}>
              System
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'business' && styles.tabBtnActive]}
            onPress={() => setActiveTab('business')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'business' && styles.tabBtnTextActive]}>
              Business
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
            onPress={() => setActiveTab('documents')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'documents' && styles.tabBtnTextActive]}>
              Permits
            </Text>
            {documents.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{documents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= MAIN SCROLLABLE CONTENT ================= */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 13 }}>
            Loading System & Business Records...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* FLOATING CENTERED CONTAINER FOR BALANCED PRESENTATION */}
          <View style={styles.floatingContainer}>
            {/* ============================================================== */}
            {/* 1. HERO CARD (Proportionate, centered, moderate logo size)      */}
            {/* ============================================================== */}
            {(activeTab === 'all' || activeTab === 'system') && (
              <View style={styles.heroCard}>
                {/* Resized Logo Frame: moderate, balanced, padded */}
                <View style={styles.logoFrame}>
                  <Image
                    source={require('../assets/images/Wattipid-icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.heroTitle}>Wattipid Smart Electricity Monitoring System</Text>

                <Text style={styles.heroDesc}>
                  IoT-based energy monitoring designed for student rental housing. Empowers tenants with transparent analytics and automated billing.
                </Text>

                <View style={styles.heroBadgeRow}>
                  <View style={styles.versionPill}>
                    <Text style={styles.versionPillText}>v2.1.0 Enterprise</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>Cloud IoT Platform</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 2. APP INFORMATION CARD                                        */}
            {/* ============================================================== */}
            {(activeTab === 'all' || activeTab === 'system') && (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>App Information</Text>
                    <Text style={styles.sectionSubtitle}>
                      Architecture, system type, and monitoring parameters.
                    </Text>
                  </View>
                </View>

                {/* Two-tier flexible rows preventing any text overflow */}
                <View style={styles.infoRowsContainer}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="information-circle-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>Application Version</Text>
                    </View>
                    <Text style={styles.infoValue}>v2.1.0 (Production Build 2026.05)</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="phone-portrait-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>Platform</Text>
                    </View>
                    <Text style={styles.infoValue}>Mobile Application (iOS / Android / Web)</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="layers-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>System Type</Text>
                    </View>
                    <Text style={styles.infoValue}>IoT Smart Submetering & Energy Management</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="hardware-chip-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>Hardware Units</Text>
                    </View>
                    <Text style={styles.infoValue}>ESP32 Microcontrollers with Non-Invasive CT Sensors</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="cloud-done-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>Cloud Telemetry</Text>
                    </View>
                    <Text style={styles.infoValue}>Pure Cloud-Based Synchronization (Zero LAN restrictions)</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="shield-checkmark-outline" size={13} color="#10B981" />
                      <Text style={styles.infoLabel}>Monitoring Scope</Text>
                    </View>
                    <Text style={styles.infoValue}>Whole-Room Aggregate Electricity Consumption</Text>
                  </View>
                </View>

                {/* Mandatory General Consumption Notice */}
                <View style={styles.noticeBox}>
                  <View style={styles.noticeHeaderRow}>
                    <Ionicons name="information-circle" size={15} color="#38BDF8" />
                    <Text style={styles.noticeTitle}>General Electricity Consumption Notice</Text>
                  </View>
                  <Text style={styles.noticeBody}>
                    Wattipid monitors overall/general room electricity consumption (including aggregate voltage, current, power factor, active Watts, and total kWh). It measures whole-room electrical loads and does not identify or profile individual appliance consumption.
                  </Text>
                </View>

                <View style={{ alignItems: 'center', paddingTop: 2 }}>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                    © 2026 Wattipid Technologies • All Rights Reserved
                  </Text>
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 3. DORMITORY BUSINESS INFORMATION                              */}
            {/* ============================================================== */}
            {(activeTab === 'all' || activeTab === 'business') && (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Dormitory Business Information</Text>
                    <Text style={styles.sectionSubtitle}>
                      Official property identity and operator records.
                    </Text>
                  </View>

                  {isLandlord && (
                    <TouchableOpacity
                      style={styles.sectionActionBtn}
                      onPress={handleOpenEditInfo}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={13} color="#10B981" />
                      <Text style={styles.sectionActionBtnText}>Edit Info</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Provider Verification Notice */}
                <View style={[styles.noticeBox, { backgroundColor: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.22)' }]}>
                  <View style={styles.noticeHeaderRow}>
                    <Ionicons name="business" size={14} color="#10B981" />
                    <Text style={[styles.noticeTitle, { color: '#10B981' }]}>Property Management Profile</Text>
                  </View>
                  <Text style={styles.noticeBody}>
                    Information in this section is maintained directly by the authorized property management for tenant review and compliance.
                  </Text>
                </View>

                {/* Two-Tier Key-Value Rows (No text overflow on long addresses or names) */}
                <View style={styles.infoRowsContainer}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="business-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Registered Business Name</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.registered_business_name && styles.infoValueMuted]}>
                      {businessInfo?.registered_business_name || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="home-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Dormitory Name</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.property_name && styles.infoValueMuted]}>
                      {businessInfo?.property_name || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="location-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Property Address</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.business_address && styles.infoValueMuted]}>
                      {businessInfo?.business_address || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="person-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Owner / Operator</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.owner_operator_name && styles.infoValueMuted]}>
                      {businessInfo?.owner_operator_name || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="briefcase-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Business Category / Structure</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.registration_type && styles.infoValueMuted]}>
                      {businessInfo?.registration_type || 'Not Available'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="document-text-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Registration Number (DTI / SEC)</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.registration_number && styles.infoValueMuted]}>
                      {businessInfo?.registration_number || 'Not Available'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="call-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Contact Phone</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.contact_phone && styles.infoValueMuted]}>
                      {businessInfo?.contact_phone || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="mail-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Contact Email</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.contact_email && styles.infoValueMuted]}>
                      {businessInfo?.contact_email || 'Not Provided'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoRowHeader}>
                      <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                      <Text style={styles.infoLabel}>Date Established</Text>
                    </View>
                    <Text style={[styles.infoValue, !businessInfo?.date_established && styles.infoValueMuted]}>
                      {businessInfo?.date_established || 'Not Available'}
                    </Text>
                  </View>

                  {businessInfo?.updated_at && (
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                      <View style={styles.infoRowHeader}>
                        <Ionicons name="time-outline" size={13} color="#94A3B8" />
                        <Text style={styles.infoLabel}>Last Updated</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: '#94A3B8', fontSize: 11.5 }]}>
                        {new Date(businessInfo.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ============================================================== */}
            {/* 4. BUSINESS PERMITS & LEGAL DOCUMENTS                          */}
            {/* ============================================================== */}
            {(activeTab === 'all' || activeTab === 'documents') && (
              <View style={{ gap: 12 }}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Business Permits & Documents</Text>
                    <Text style={styles.sectionSubtitle}>
                      Official clearances, registrations, and certificates on file.
                    </Text>
                  </View>

                  {isLandlord && (
                    <TouchableOpacity
                      style={styles.sectionActionBtn}
                      onPress={() => handleOpenUploadDoc(null)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="cloud-upload-outline" size={13} color="#10B981" />
                      <Text style={styles.sectionActionBtnText}>+ Upload Permit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Jurisdictional Disclaimer Box */}
                <View style={styles.disclaimerBox}>
                  <View style={styles.disclaimerHeaderRow}>
                    <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                    <Text style={styles.disclaimerTitle}>Regulatory Notice</Text>
                  </View>
                  <Text style={styles.disclaimerBody}>
                    Compliance requirements vary depending on local government unit (LGU) regulations, property classification, and business structure. Only officially submitted documents are displayed.
                  </Text>
                </View>

                {/* Empty State or Document List */}
                {documents.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="folder-open-outline" size={24} color="#64748B" />
                    </View>
                    <Text style={styles.emptyTitle}>No Business Permits Uploaded Yet</Text>
                    <Text style={styles.emptyDesc}>
                      The dormitory management has not yet uploaded public business permits or certifications for this property.
                    </Text>
                    {isLandlord && (
                      <TouchableOpacity
                        style={styles.emptyActionBtn}
                        onPress={() => handleOpenUploadDoc(null)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={15} color="#041F16" />
                        <Text style={styles.emptyActionBtnText}>Upload First Document</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  documents.map((doc) => (
                    <View key={doc.id} style={styles.docCard}>
                      {/* Document Card Header */}
                      <View style={styles.docHeaderRow}>
                        <View style={styles.docTitleWrap}>
                          <Text style={styles.docName} numberOfLines={2}>
                            {doc.document_name}
                          </Text>
                          <View style={styles.docCategoryPill}>
                            <Text style={styles.docCategoryText}>{doc.document_type}</Text>
                          </View>
                        </View>
                        {renderStatusBadge(doc)}
                      </View>

                      {/* Metadata Grid */}
                      <View style={styles.docDetailsBox}>
                        <View style={styles.docDetailRow}>
                          <Text style={styles.docDetailLabel}>Issuing Authority</Text>
                          <Text style={styles.docDetailVal} numberOfLines={1}>
                            {doc.issuing_authority || 'Not Provided'}
                          </Text>
                        </View>

                        <View style={styles.docDetailRow}>
                          <Text style={styles.docDetailLabel}>Permit / Cert No.</Text>
                          <Text style={styles.docDetailVal} numberOfLines={1}>
                            {doc.permit_number || 'Not Available'}
                          </Text>
                        </View>

                        <View style={styles.docDetailRow}>
                          <Text style={styles.docDetailLabel}>Issue Date</Text>
                          <Text style={styles.docDetailVal}>
                            {doc.issue_date || 'Not Provided'}
                          </Text>
                        </View>

                        <View style={styles.docDetailRow}>
                          <Text style={styles.docDetailLabel}>Expiration Date</Text>
                          <Text style={[styles.docDetailVal, doc.is_expired && { color: '#EF4444', fontWeight: '700' }]}>
                            {doc.expiration_date || 'No Expiration / Not Applicable'}
                          </Text>
                        </View>

                        {doc.updated_at && (
                          <View style={styles.docDetailRow}>
                            <Text style={styles.docDetailLabel}>Last Updated</Text>
                            <Text style={[styles.docDetailVal, { color: '#94A3B8' }]}>
                              {new Date(doc.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.docActionsRow}>
                        <TouchableOpacity
                          style={styles.viewDocBtn}
                          onPress={() => handleViewDocument(doc)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="eye-outline" size={14} color="#041F16" />
                          <Text style={styles.viewDocBtnText}>View Document</Text>
                        </TouchableOpacity>

                        {isLandlord && (
                          <>
                            <TouchableOpacity
                              style={styles.editDocBtn}
                              onPress={() => handleOpenUploadDoc(doc)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="create-outline" size={13} color="#CBD5E1" />
                              <Text style={styles.editDocBtnText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.editDocBtn}
                              onPress={() => handleToggleVerification(doc)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={doc.verification_status === 'verified' ? 'checkmark-circle' : 'time-outline'}
                                size={13}
                                color={doc.verification_status === 'verified' ? '#10B981' : '#F59E0B'}
                              />
                              <Text style={[styles.editDocBtnText, doc.verification_status === 'verified' && { color: '#10B981' }]}>
                                {doc.verification_status === 'verified' ? 'Verified' : 'Verify'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.deleteDocBtn}
                              onPress={() => handleDeleteDoc(doc.id, doc.document_name)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={15} color="#EF4444" />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= COPYRIGHT FOOTER ================= */}
            <View style={styles.footerBlock}>
              <Text style={styles.footerText}>Wattipid Smart Electricity Monitoring System</Text>
              <Text style={styles.footerSub}>Production Release v2.1.0 • Build 2026.05</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: FULLSCREEN SECURE DOCUMENT VIEWER                     */}
      {/* ============================================================== */}
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerBox}>
          {/* Top Viewer Bar */}
          <View style={styles.viewerHeader}>
            <View style={styles.viewerTitleWrap}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {selectedDoc?.document_name}
              </Text>
              <Text style={styles.viewerSub} numberOfLines={1}>
                {selectedDoc?.document_type} • {selectedDoc?.issuing_authority || 'Official Record'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={handleShareDocument}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={18} color="#10B981" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setViewerVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.viewerBody}>
            {selectedDoc?.file_type === 'application/pdf' ? (
              <View style={{ alignItems: 'center', padding: 24, gap: 14 }}>
                <Ionicons name="document-text" size={68} color="#EF4444" />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
                  {selectedDoc?.file_name || selectedDoc?.document_name}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>
                  Portable Document Format (PDF)
                </Text>
                <TouchableOpacity
                  style={[styles.emptyActionBtn, { backgroundColor: '#38BDF8' }]}
                  onPress={handleShareDocument}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={15} color="#041F16" />
                  <Text style={[styles.emptyActionBtnText, { color: '#041F16' }]}>Open / Export PDF</Text>
                </TouchableOpacity>
              </View>
            ) : selectedDoc?.file_url ? (
              <Image
                source={{ uri: selectedDoc.file_url }}
                style={styles.viewerImage}
              />
            ) : (
              <Text style={{ color: '#64748B' }}>Document preview not available</Text>
            )}
          </View>

          {/* Bottom Metadata Drawer */}
          <View style={styles.viewerDrawer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 12.5 }}>
                Permit No: {selectedDoc?.permit_number || 'Not Available'}
              </Text>
              {selectedDoc && renderStatusBadge(selectedDoc)}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                Issued: {selectedDoc?.issue_date || 'Not Provided'}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                Expires: {selectedDoc?.expiration_date || 'No Expiration / N/A'}
              </Text>
            </View>

            <Text style={{ color: '#64748B', fontSize: 10.5, fontStyle: 'italic', marginTop: 2 }}>
              Official Document Record • Verified by Property Administration
            </Text>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: LANDLORD EDIT BUSINESS INFORMATION                    */}
      {/* ============================================================== */}
      <Modal
        visible={editInfoVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Text style={styles.modalHeaderTitle}>Dormitory Business Profile</Text>
                <Text style={styles.modalHeaderSub}>Edit property identification and operator records</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditInfoVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Registered Business Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.registered_business_name}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, registered_business_name: v }))}
                  placeholder="e.g. Taft Student Housing Corp."
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dormitory / Property Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.property_name}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, property_name: v }))}
                  placeholder="e.g. Wattipid Student Residences"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Address</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  value={infoForm.business_address}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, business_address: v }))}
                  placeholder="e.g. 1234 Taft Ave, Malate, Manila, Metro Manila"
                  placeholderTextColor="#64748B"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Owner / Operator</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.owner_operator_name}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, owner_operator_name: v }))}
                  placeholder="e.g. Engr. Juan Dela Cruz"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Structure / Registration Type</Text>
                <View style={styles.pickerChipRow}>
                  {REGISTRATION_STRUCTURES.map((struct) => (
                    <TouchableOpacity
                      key={struct}
                      style={[styles.pickerChip, infoForm.registration_type === struct && styles.pickerChipActive]}
                      onPress={() => setInfoForm(prev => ({ ...prev, registration_type: struct }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerChipText, infoForm.registration_type === struct && styles.pickerChipTextActive]}>
                        {struct}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Registration Number (DTI / SEC)</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.registration_number}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, registration_number: v }))}
                  placeholder="e.g. CS202401928 or DTI BN No."
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.contact_phone}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, contact_phone: v }))}
                  placeholder="e.g. +63 917 123 4567"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Email Address</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.contact_email}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, contact_email: v }))}
                  placeholder="e.g. admin@dormitory.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date Established (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={infoForm.date_established}
                  onChangeText={(v) => setInfoForm(prev => ({ ...prev, date_established: v }))}
                  placeholder="e.g. 2022-08-15"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalBtnSecondary}
                  onPress={() => setEditInfoVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={handleSaveInfo}
                  disabled={savingInfo}
                  activeOpacity={0.8}
                >
                  {savingInfo ? (
                    <ActivityIndicator size="small" color="#041F16" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Save Business Info</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: LANDLORD UPLOAD / EDIT PERMIT DOCUMENT               */}
      {/* ============================================================== */}
      <Modal
        visible={uploadDocVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUploadDocVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Text style={styles.modalHeaderTitle}>
                  {editingDocId ? 'Edit Permit Document' : 'Upload Official Permit'}
                </Text>
                <Text style={styles.modalHeaderSub}>Attach and classify government certifications</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setUploadDocVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Attachment Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document File (Image or PDF)</Text>
                {docForm.file_url ? (
                  <View style={{ gap: 8 }}>
                    {docForm.file_type === 'application/pdf' ? (
                      <View style={[styles.uploadArea, { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                        <Ionicons name="document-text" size={30} color="#38BDF8" />
                        <Text style={[styles.uploadAreaText, { color: '#38BDF8' }]}>
                          {docForm.file_name || 'PDF Document Attached'}
                        </Text>
                        <Text style={styles.uploadAreaSub}>
                          {docForm.file_size_kb ? `${docForm.file_size_kb} KB` : 'Ready to upload'}
                        </Text>
                      </View>
                    ) : (
                      <Image source={{ uri: docForm.file_url }} style={styles.previewThumb} />
                    )}

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.editDocBtn, { flex: 1 }]}
                        onPress={handlePickImage}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="image-outline" size={14} color="#10B981" />
                        <Text style={[styles.editDocBtnText, { color: '#10B981' }]}>Change Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.editDocBtn, { flex: 1 }]}
                        onPress={handlePickDocument}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="document-attach-outline" size={14} color="#38BDF8" />
                        <Text style={[styles.editDocBtnText, { color: '#38BDF8' }]}>Change PDF</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.uploadArea, { flex: 1 }]}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="images-outline" size={24} color="#10B981" />
                      <Text style={styles.uploadAreaText}>Photo / Image</Text>
                      <Text style={styles.uploadAreaSub}>Gallery scan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.uploadArea, { flex: 1, borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.04)' }]}
                      onPress={handlePickDocument}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text-outline" size={24} color="#38BDF8" />
                      <Text style={[styles.uploadAreaText, { color: '#38BDF8' }]}>PDF Document</Text>
                      <Text style={styles.uploadAreaSub}>Official PDF</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Document Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document Title / Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={docForm.document_name}
                  onChangeText={(v) => setDocForm(prev => ({ ...prev, document_name: v }))}
                  placeholder="e.g. 2026 Mayor's Business Permit"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Category Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document Category / Type</Text>
                <View style={styles.pickerChipRow}>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pickerChip, docForm.document_type === cat && styles.pickerChipActive]}
                      onPress={() => setDocForm(prev => ({ ...prev, document_type: cat }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerChipText, docForm.document_type === cat && styles.pickerChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Issuing Authority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Issuing Authority</Text>
                <TextInput
                  style={styles.formInput}
                  value={docForm.issuing_authority}
                  onChangeText={(v) => setDocForm(prev => ({ ...prev, issuing_authority: v }))}
                  placeholder="e.g. City Government of Manila / BPLO"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Permit / Document Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document / Permit Number (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={docForm.permit_number}
                  onChangeText={(v) => setDocForm(prev => ({ ...prev, permit_number: v }))}
                  placeholder="e.g. BP-2026-004921"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Issue Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Issue Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={docForm.issue_date}
                  onChangeText={(v) => setDocForm(prev => ({ ...prev, issue_date: v }))}
                  placeholder="e.g. 2026-01-15"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Expiration Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expiration Date (YYYY-MM-DD, Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={docForm.expiration_date}
                  onChangeText={(v) => setDocForm(prev => ({ ...prev, expiration_date: v }))}
                  placeholder="e.g. 2026-12-31 (Leave blank if none)"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Tenant Safe Public Visibility */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelWrap}>
                  <Text style={styles.switchLabel}>Make Visible to Tenants</Text>
                  <Text style={styles.switchDesc}>Allow dormitory tenants to view and inspect this document</Text>
                </View>
                <Switch
                  value={docForm.is_public_for_tenants}
                  onValueChange={(val) => setDocForm(prev => ({ ...prev, is_public_for_tenants: val }))}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                  thumbColor={docForm.is_public_for_tenants ? '#10B981' : '#64748B'}
                />
              </View>

              {/* Verification Record */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelWrap}>
                  <Text style={styles.switchLabel}>Mark as Verified</Text>
                  <Text style={styles.switchDesc}>Record official administrator verification for this permit</Text>
                </View>
                <Switch
                  value={docForm.verification_status === 'verified'}
                  onValueChange={(val) => setDocForm(prev => ({ ...prev, verification_status: val ? 'verified' : 'pending_verification' }))}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.35)' }}
                  thumbColor={docForm.verification_status === 'verified' ? '#10B981' : '#64748B'}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalBtnSecondary}
                  onPress={() => setUploadDocVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={handleSaveDoc}
                  disabled={savingDoc}
                  activeOpacity={0.8}
                >
                  {savingDoc ? (
                    <ActivityIndicator size="small" color="#041F16" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>
                      {editingDocId ? 'Update Document' : 'Save & Publish Permit'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
