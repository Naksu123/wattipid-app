import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import { STATIC_TIPS, generateDynamicTips, getDailyStaticTip } from '../../services/tipsEngine';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/tips.styles';

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
