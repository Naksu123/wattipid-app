import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import { STATIC_TIPS, generateDynamicTips, getDailyStaticTip } from '../../services/tipsEngine';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/styles/theme';

const TABS = ['dynamic', 'static'];
const STATIC_CATEGORIES = ['All', ...new Set(STATIC_TIPS.map(t => t.category))];

export default function TipsScreen() {
  const { user } = useAuth();
  const roomId = user?.room_id || 'Room 1';
  const [activeTab, setActiveTab] = useState('dynamic');
  const [dynamicTips, setDynamicTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTip, setDailyTip] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDynamicTips = useCallback(async () => {
    try {
      const sensorData = await fetchRealtimeData(roomId);
      const tips = await generateDynamicTips(roomId, sensorData.power || 0);
      setDynamicTips(tips);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Tips load error:', err);
    }
  }, [roomId]);

  useEffect(() => {
    setDailyTip(getDailyStaticTip());
    loadDynamicTips();
    // Auto-refresh dynamic tips every 60 seconds
    const interval = setInterval(loadDynamicTips, 60000);
    return () => clearInterval(interval);
  }, [loadDynamicTips]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDynamicTips();
    setRefreshing(false);
  };

  const filteredStaticTips = selectedCategory === 'All'
    ? STATIC_TIPS
    : STATIC_TIPS.filter(t => t.category === selectedCategory);

  const getPriorityColor = (priority) => {
    if (priority === 0) return COLORS.danger;
    if (priority === 1) return COLORS.warning;
    return COLORS.primary;
  };

  const getPriorityLabel = (priority) => {
    if (priority === 0) return 'URGENT';
    if (priority === 1) return 'IMPORTANT';
    return 'GOOD';
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <Text style={s.title}>Wattipid Tips</Text>
        <Text style={s.subtitle}>Smart insights to save energy & money</Text>

        {/* Tip of the Day */}
        {dailyTip && (
          <GlassCard gradient style={s.dailyCard}>
            <View style={s.dailyBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={s.dailyBadgeText}>Tip of the Day</Text>
            </View>
            <View style={s.dailyContent}>
              <View style={s.dailyIcon}>
                <Ionicons name={dailyTip.icon || 'leaf'} size={24} color={COLORS.primary} />
              </View>
              <View style={s.dailyText}>
                <Text style={s.dailyCat}>{dailyTip.category}</Text>
                <Text style={s.dailyTip}>{dailyTip.tip}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Tab Selector */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
              style={[s.tabBtn, activeTab === tab && s.tabActive]} activeOpacity={0.7}>
              <Ionicons name={tab === 'dynamic' ? 'pulse-outline' : 'book-outline'} size={16}
                color={activeTab === tab ? COLORS.primary : COLORS.textMuted} />
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'dynamic' ? 'Dynamic' : 'Static'}
              </Text>
              {tab === 'dynamic' && dynamicTips.length > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{dynamicTips.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ========= DYNAMIC TIPS TAB ========= */}
        {activeTab === 'dynamic' && (
          <>
            {/* Status Banner */}
            <GlassCard style={s.statusBanner}>
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: dynamicTips.length > 0 ? COLORS.primary : COLORS.textMuted }]} />
                <Text style={s.statusText}>
                  {dynamicTips.length > 0
                    ? `${dynamicTips.length} personalized tip${dynamicTips.length > 1 ? 's' : ''} based on your usage`
                    : 'Analyzing your consumption patterns...'}
                </Text>
              </View>
              {lastUpdated && (
                <Text style={s.statusTime}>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              )}
            </GlassCard>

            {/* Dynamic Tips List */}
            {dynamicTips.length > 0 ? (
              dynamicTips.map((tip, i) => {
                const pColor = getPriorityColor(tip.priority);
                return (
                  <GlassCard key={i} style={s.dynamicCard}>
                    <View style={s.dynamicHeader}>
                      <View style={[s.dynamicIcon, { backgroundColor: `${pColor}15` }]}>
                        <Ionicons name={tip.icon || 'bulb'} size={20} color={pColor} />
                      </View>
                      <View style={s.dynamicMeta}>
                        <Text style={s.dynamicCat}>{tip.category}</Text>
                        <View style={[s.priorityBadge, { backgroundColor: `${pColor}20` }]}>
                          <Text style={[s.priorityText, { color: pColor }]}>{getPriorityLabel(tip.priority)}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={s.dynamicTip}>{tip.tip}</Text>
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard style={s.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.primary} />
                <Text style={s.emptyTitle}>All Good!</Text>
                <Text style={s.emptyDesc}>Your consumption looks efficient. Keep it up!</Text>
              </GlassCard>
            )}

            {/* How it Works */}
            <GlassCard style={s.howCard}>
              <View style={s.howHeader}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                <Text style={s.howTitle}>How Dynamic Tips Work</Text>
              </View>
              <Text style={s.howText}>
                Dynamic tips are generated automatically by analyzing your real consumption data. They update whenever your usage patterns change — checking your budget status, comparing with previous periods, and monitoring real-time power draw.
              </Text>
            </GlassCard>
          </>
        )}

        {/* ========= STATIC TIPS TAB ========= */}
        {activeTab === 'static' && (
          <>
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}
              contentContainerStyle={s.catContainer}>
              {STATIC_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}
                  style={[s.catBtn, selectedCategory === cat && s.catActive]} activeOpacity={0.7}>
                  <Text style={[s.catText, selectedCategory === cat && s.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Summary */}
            <GlassCard style={s.summaryBar}>
              <Ionicons name="book" size={16} color={COLORS.primary} />
              <Text style={s.summaryBarText}>
                {filteredStaticTips.length} tip{filteredStaticTips.length !== 1 ? 's' : ''} • General energy-saving practices
              </Text>
            </GlassCard>

            {/* Static Tips List */}
            {filteredStaticTips.map((item, i) => (
              <GlassCard key={item.id} style={s.tipCard}>
                <View style={s.tipIcon}>
                  <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <View style={s.tipContent}>
                  <View style={s.tipHeaderRow}>
                    <Text style={s.tipTitle}>{item.title}</Text>
                    <View style={[s.impactBadge, { backgroundColor: item.impact === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)' }]}>
                      <Text numberOfLines={1} style={[s.impactText, { color: item.impact === 'High' ? COLORS.danger : COLORS.info }]}>{item.impact} Impact</Text>
                    </View>
                  </View>
                  <Text style={s.tipText}>{item.tip}</Text>
                  {item.reason && (
                    <View style={s.reasonBox}>
                      <Ionicons name="bulb" size={12} color={COLORS.warning} />
                      <Text style={s.reasonText}>{item.reason}</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            ))}

            {filteredStaticTips.length === 0 && (
              <View style={s.emptyState2}>
                <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
                <Text style={s.emptyTitle}>No tips in this category</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl + 60 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  // Daily Tip
  dailyCard: { marginBottom: SPACING.lg, paddingTop: SPACING.xl },
  dailyBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  dailyBadgeText: { fontSize: 10, color: '#fff', fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  dailyContent: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  dailyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' },
  dailyText: { flex: 1 },
  dailyCat: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  dailyTip: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  // Tabs
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceGlass, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  tabTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  tabBadge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: FONT_WEIGHT.bold },
  // Status
  statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, flex: 1 },
  statusTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  // Dynamic Cards
  dynamicCard: { marginBottom: SPACING.sm },
  dynamicHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  dynamicIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dynamicMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dynamicCat: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  priorityText: { fontSize: 9, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },
  dynamicTip: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyState2: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.semibold },
  emptyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  // How it Works
  howCard: { marginTop: SPACING.md, marginBottom: SPACING.xxl },
  howHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  howTitle: { fontSize: FONT_SIZE.sm, color: COLORS.info, fontWeight: FONT_WEIGHT.semibold },
  howText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, lineHeight: 18 },
  // Static Categories
  catScroll: { marginBottom: SPACING.md },
  catContainer: { gap: SPACING.sm },
  catBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceGlass, borderWidth: 1, borderColor: COLORS.border },
  catActive: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: COLORS.primary },
  catText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  catTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  // Summary Bar
  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md },
  summaryBarText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  // Static Tip Cards
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
  tipIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipContent: { flex: 1 },
  tipHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: SPACING.sm },
  tipTitle: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.bold },
  impactBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: RADIUS.sm, 
    flexShrink: 0, 
    alignSelf: 'flex-start',
    marginTop: 2
  },
  impactText: { 
    fontSize: 8, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tipCategory: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  tipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.sm, borderLeftWidth: 2, borderLeftColor: COLORS.warning },
  reasonText: { flex: 1, fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 16, flexWrap: 'wrap' },
});
