import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';
import styles from '../styles/terms.styles';
import { getActiveTerms } from '../services/termsApi';

// Default sections matching Screenshot 1 to ensure instant and offline display
const DEFAULT_SECTIONS = [
  {
    id: '1',
    title: '1. ACCEPTANCE OF TERMS',
    content: 'By creating an account, accessing the application, or using Wattipid services, users agree to comply with all terms, conditions, billing policies, and payment regulations established by the property owner and system administrator.',
  },
  {
    id: '2',
    title: '2. DESCRIPTION OF SERVICES',
    content: 'Wattipid provides IoT-based smart energy submetering, real-time consumption monitoring, automated billing, and payment facilitation services for residential tenants and property managers.',
  },
  {
    id: '3',
    title: '3. ELECTRICITY BILLING POLICY',
    content: 'Electricity consumption is measured via certified IoT hardware submeters. Bills are calculated based on actual kWh usage multiplied by the landlord utility rate and applicable fees.',
  },
  {
    id: '4',
    title: '4. USER ACCOUNTS & SECURITY',
    content: 'Users are responsible for maintaining the confidentiality of their credentials and monitoring device access. Tampering with IoT hardware is strictly prohibited.',
  },
  {
    id: '5',
    title: '5. DATA PRIVACY & USAGE',
    content: 'Wattipid collects energy consumption metrics and account information strictly to calculate billing, generate energy insights, and facilitate property management communications.',
  },
  {
    id: '6',
    title: '6. TERMINATION & MODIFICATION',
    content: 'System administrators reserve the right to modify these terms, update rate calculations, or terminate accounts in violation of safety or billing compliance.',
  },
];

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set(['1'])); // Default expand first section (as shown in Screenshot 1)
  const [accepted, setAccepted] = useState(false);
  
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await getActiveTerms();
      if (response && response.success && response.data) {
        setTermsData(response.data);
      }
    } catch (error) {
      console.warn('[TermsScreen] Network fallback:', error);
    }
  };

  const toggleSection = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const sectionsList = useMemo(() => {
    if (termsData?.sections && Array.isArray(termsData.sections) && termsData.sections.length > 0) {
      return termsData.sections.map((sec, idx) => ({
        id: String(sec.id || idx + 1),
        title: sec.title.startsWith(`${idx + 1}.`) ? sec.title.toUpperCase() : `${idx + 1}. ${sec.title.toUpperCase()}`,
        content: sec.content,
      }));
    }
    return DEFAULT_SECTIONS;
  }, [termsData]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sectionsList;
    const q = searchQuery.toLowerCase();
    return sectionsList.filter(
      sec => sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)
    );
  }, [searchQuery, sectionsList]);

  const handleAccept = () => {
    if (accepted) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tenant)/settings');
      }
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tenant)/settings');
    }
  };

  const effectiveDateStr = useMemo(() => {
    if (termsData?.version?.effective_date) {
      try {
        const d = new Date(termsData.version.effective_date);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      } catch (_e) {}
    }
    return '6/4/2026';
  }, [termsData?.version?.effective_date]);

  const versionNumberStr = termsData?.version?.version_number || '1.0';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* ================= HEADER (Matches Screenshot 1) ================= */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <Text style={styles.lastUpdated}>
              Version {versionNumberStr} • Effective {effectiveDateStr}
            </Text>
          </View>
        </View>

        {/* ================= SEARCH BAR (Matches Screenshot 1) ================= */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search terms or topics..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ================= CONTENT (Matches Screenshot 1) ================= */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introductory Note */}
          <Text style={styles.introText}>
            Welcome to Wattipid. Please read these terms carefully before using our platform.
          </Text>

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptyText}>Loading Terms and Conditions...</Text>
            </View>
          ) : errorMsg && filteredSections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <Text style={styles.emptyText}>{errorMsg}</Text>
              <TouchableOpacity onPress={fetchTerms} style={{ marginTop: 10, padding: 10 }}>
                <Text style={{ color: '#10B981', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={36} color="#64748B" />
              <Text style={styles.emptyText}>No matching terms found.</Text>
            </View>
          ) : (
            filteredSections.map(section => {
              const isExpanded = expandedIds.has(section.id) || searchQuery.length > 0;
              return (
                <View key={section.id} style={styles.sectionCard}>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${section.title}. ${isExpanded ? 'Collapse' : 'Expand'} section.`}
                  >
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={18} 
                      color="#10B981" 
                    />
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.sectionContent}>
                      <Text style={styles.sectionText}>{section.content}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ================= BOTTOM ACCEPTANCE AREA (Matches Screenshot 1) ================= */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
              {accepted && <Ionicons name="checkmark" size={15} color="#042F2E" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read, understood, and accept the Terms and Conditions.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
            disabled={!accepted}
            onPress={handleAccept}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Accept Terms and Conditions"
          >
            <Text style={[styles.acceptButtonText, !accepted && styles.acceptButtonTextDisabled]}>
              I Accept
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
