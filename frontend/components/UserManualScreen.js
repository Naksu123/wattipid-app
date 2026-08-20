import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTourContext } from '../contexts/TourContext';
import { TENANT_MANUAL, LANDLORD_MANUAL } from '../data/userManualContent';
import { COLORS } from '../styles/theme';
import s from '../styles/userManual.styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function UserManualScreen() {
  const { user } = useAuth();
  const isLandlord = user?.role === 'landlord';

  const manualData = isLandlord ? LANDLORD_MANUAL : TENANT_MANUAL;
  const roleLabel = isLandlord ? 'Landlord' : 'Tenant';

  const tourCtx = useTourContext();
  const startFullTour = tourCtx?.startFullTour || tourCtx?.startContinuousTour || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

  // ─── Search Filter ──────────────────────────────────────
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return manualData;

    const q = searchQuery.toLowerCase();
    return manualData
      .map(section => {
        const titleMatch = section.title.toLowerCase().includes(q);
        const matchingSteps = section.steps.filter(
          step =>
            step.heading.toLowerCase().includes(q) ||
            step.content.toLowerCase().includes(q)
        );

        if (titleMatch || matchingSteps.length > 0) {
          return {
            ...section,
            steps: titleMatch ? section.steps : matchingSteps,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [searchQuery, manualData]);

  // ─── Accordion Toggle ──────────────────────────────────
  const toggleSection = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ─── Render Step ────────────────────────────────────────
  const renderStep = (step, index, total) => (
    <View key={index} style={s.stepCard}>
      <View style={s.stepNumberWrap}>
        <View style={s.stepNumber}>
          <Text style={s.stepNumberText}>{index + 1}</Text>
        </View>
        {index < total - 1 && <View style={s.stepLine} />}
      </View>
      <View style={s.stepContent}>
        <Text style={s.stepHeading}>{step.heading}</Text>
        <Text style={s.stepText}>{step.content}</Text>
      </View>
    </View>
  );

  // ─── Render Section ─────────────────────────────────────
  const renderSection = (section) => {
    const isExpanded = expandedIds[section.id] || false;

    return (
      <View key={section.id} style={s.accordionContainer}>
        <TouchableOpacity
          style={[s.accordionHeader, isExpanded && s.accordionHeaderActive]}
          activeOpacity={0.7}
          onPress={() => toggleSection(section.id)}
          accessibilityRole="button"
          accessibilityLabel={`${section.title}. ${isExpanded ? 'Collapse' : 'Expand'} section.`}
        >
          <View style={s.headerLeft}>
            <View style={[s.iconBox, { backgroundColor: isExpanded ? section.iconColor : section.iconBg }]}>
              <Ionicons
                name={section.icon}
                size={20}
                color={isExpanded ? '#fff' : section.iconColor}
              />
            </View>
            <Text style={[s.sectionTitle, isExpanded && { color: section.iconColor }]}>
              {section.title}
            </Text>
          </View>
          <View style={s.chevron}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textMuted}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.accordionBody}>
            {section.steps.map((step, i) => renderStep(step, i, section.steps.length))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>User Manual</Text>
          <Text style={s.headerSubtitle}>
            {roleLabel} Guide • {filteredSections.length} sections
          </Text>
        </View>

        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{roleLabel}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search User Manual..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="Search user manual"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearBtn} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results indicator when searching */}
      {searchQuery.trim().length > 0 && (
        <View style={s.resultsBar}>
          <Text style={s.resultsText}>
            {filteredSections.length} {filteredSections.length === 1 ? 'result' : 'results'} for &quot;{searchQuery}&quot;
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearchBtn}>
            <Text style={s.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!searchQuery.trim() && !isLandlord && (
          <View style={{ marginBottom: 20 }}>
            {/* Full Tour Hero Card */}
            <TouchableOpacity 
              onPress={startFullTour} 
              activeOpacity={0.85}
              style={{ 
                backgroundColor: '#10B981', 
                padding: 16, 
                borderRadius: 18, 
                alignItems: 'center', 
                flexDirection: 'row', 
                justifyContent: 'center', 
                gap: 12, 
                shadowColor: '#10B981', 
                shadowOffset: { width: 0, height: 6 }, 
                shadowOpacity: 0.35, 
                shadowRadius: 10, 
                elevation: 6 
              }}
            >
              <Ionicons name="play-circle" size={26} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Start Full Interactive Tour</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 11 }}>Complete walkthrough across all 6 main screens</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {filteredSections.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="search-outline" size={32} color={COLORS.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptyText}>
              {'Try searching for "budget", "payment", "billing", or "analytics"'}
            </Text>
          </View>
        ) : (
          filteredSections.map(renderSection)
        )}
      </ScrollView>
    </View>
  );
}
