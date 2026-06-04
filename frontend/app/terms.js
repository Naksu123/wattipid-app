import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../styles/theme';
import GlassCard from '../components/ui/GlassCard';
import { getActiveTerms } from '../services/termsApi';

export default function TermsAndConditionsScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set(['1'])); // Default expand first section
    const [accepted, setAccepted] = useState(false);
    
    const [termsData, setTermsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            const response = await getActiveTerms();
            if (response.success && response.data) {
                setTermsData(response.data);
            } else {
                setErrorMsg('Failed to load terms.');
            }
        } catch (error) {
            setErrorMsg('Network error.');
        } finally {
            setLoading(false);
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

    const filteredSections = useMemo(() => {
        if (!termsData) return [];
        if (!searchQuery.trim()) return termsData.sections;
        const q = searchQuery.toLowerCase();
        return termsData.sections.filter(
            sec => sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)
        );
    }, [searchQuery, termsData]);

    const handleAccept = () => {
        if (accepted) {
            router.navigate('/(tenant)/settings');
        }
    };

    const handleGoBack = () => {
        router.navigate('/(tenant)/settings');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Terms & Conditions</Text>
                        {!loading && termsData && (
                            <Text style={styles.lastUpdated}>
                                Version {termsData.version.version_number} • Effective {new Date(termsData.version.effective_date).toLocaleDateString('en-US')}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search terms or topics..."
                            placeholderTextColor={COLORS.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Content */}
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.introText}>
                        Welcome to Wattipid. Please read these terms carefully before using our platform.
                    </Text>

                    {loading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.emptyText}>Loading Terms and Conditions...</Text>
                        </View>
                    ) : errorMsg ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                            <Text style={styles.emptyText}>{errorMsg}</Text>
                            <TouchableOpacity onPress={fetchTerms} style={{marginTop: 10, padding: 10}}>
                                <Text style={{color: COLORS.primary}}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredSections.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No matching terms found.</Text>
                        </View>
                    ) : (
                        filteredSections.map(section => {
                            const isExpanded = expandedIds.has(section.id) || searchQuery.length > 0;
                            return (
                                <GlassCard key={section.id} style={styles.sectionCard}>
                                    <TouchableOpacity 
                                        style={styles.sectionHeader}
                                        onPress={() => toggleSection(section.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.sectionTitle}>{section.title}</Text>
                                        <Ionicons 
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                                            size={20} 
                                            color={COLORS.primary} 
                                        />
                                    </TouchableOpacity>
                                    
                                    {isExpanded && (
                                        <View style={styles.sectionContent}>
                                            <Text style={styles.sectionText}>{section.content}</Text>
                                        </View>
                                    )}
                                </GlassCard>
                            );
                        })
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Footer / Accept Area */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.checkboxContainer} 
                        onPress={() => setAccepted(!accepted)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                            {accepted && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                        </View>
                        <Text style={styles.checkboxLabel}>
                            I have read, understood, and accept the Terms and Conditions.
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
                        disabled={!accepted}
                        onPress={handleAccept}
                    >
                        <Text style={styles.acceptButtonText}>I Accept</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? 40 : SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.textPrimary,
    },
    lastUpdated: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.bold,
        marginTop: 2,
    },
    searchContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        height: 48,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.md,
        marginLeft: SPACING.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    introText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    sectionCard: {
        marginBottom: SPACING.sm,
        padding: 0,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
        flex: 1,
        paddingRight: SPACING.md,
    },
    sectionContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: SPACING.sm,
    },
    sectionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.bold,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        height: 54,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButtonDisabled: {
        backgroundColor: 'rgba(34,197,94,0.3)',
    },
    acceptButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
    }
});
