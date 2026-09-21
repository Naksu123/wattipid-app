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
                size={18}
                color={isExpanded ? '#FFFFFF' : section.iconColor}
              />
            </View>
            <Text style={[s.sectionTitle, isExpanded && { color: '#FFFFFF' }]}>
              {section.title}
            </Text>
          </View>
          <View style={s.chevron}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={isExpanded ? '#10B981' : '#64748B'}
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
      {/* Header (Matches Screenshot 2) */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
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

      {/* Search Field */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={17} color="#64748B" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search User Manual..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="Search user manual"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearBtn} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color="#64748B" />
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
        {/* Full Tour CTA Card (Matches Screenshot 2) */}
        {!searchQuery.trim() && !isLandlord && (
          <TouchableOpacity 
            onPress={startFullTour} 
            activeOpacity={0.85}
            style={s.tourCard}
            accessibilityRole="button"
            accessibilityLabel="Start Full Tour"
          >
            <View style={s.tourIconWrap}>
              <Ionicons name="play-circle" size={28} color="#FFFFFF" />
            </View>
            <View style={s.tourContent}>
              <Text style={s.tourTitle}>Start Full Tour</Text>
              <Text style={s.tourSubtitle}>Complete walkthrough across all 6 main screens (23 steps)</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {filteredSections.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="search-outline" size={28} color="#64748B" />
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
