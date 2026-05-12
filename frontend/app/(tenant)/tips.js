import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import { generateDynamicTips } from '../../services/tipsEngine';
import { tipsService } from '../../services/tipsService';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/tips.styles';

const TABS = [
  { id: 'community', label: 'General Tips', icon: 'people-outline' },
  { id: 'smart', label: 'Smart Insights', icon: 'pulse-outline' },
  { id: 'browse', label: 'All Tips', icon: 'book-outline' }
];

export default function TipsScreen() {
  const { user } = useAuth();
  const roomId = user?.room_id || 'Room 1';
  
  const [activeTab, setActiveTab] = useState('community');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Community Tips State
  const [currentTip, setCurrentTip] = useState(null);
  const [liked, setLiked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Smart Insights State
  const [smartTips, setSmartTips] = useState([]);
  const [lastSmartUpdate, setLastSmartUpdate] = useState(null);

  // All Tips State
  const [allTips, setAllTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Energy Saving', 'Appliance Safety', 'Budget Friendly', 'Smart Dorm Living'];

  const loadCommunityTip = async (lastId = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await tipsService.getRandomTip(lastId);
      if (res.success) {
        // Animate transition
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
        ]).start();
        
        setTimeout(() => {
          setCurrentTip(res.data);
          setLiked(false);
        }, 200);
      }
    } catch (err) {
      setError('Could not connect to Tips API. Please check your XAMPP connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadSmartTips = useCallback(async () => {
    try {
      const sensorData = await fetchRealtimeData(roomId);
      const tips = await generateDynamicTips(roomId, sensorData.power || 0);
      setSmartTips(tips);
      setLastSmartUpdate(new Date());
    } catch (err) {
      console.warn('Smart tips load error:', err);
    }
  }, [roomId]);

  const loadAllTips = async (cat = 'All') => {
    try {
      const res = await tipsService.getAllTips(cat === 'All' ? null : cat);
      if (res.success) {
        setAllTips(res.data);
      }
    } catch (err) {
      console.warn('All tips load error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'community' && !currentTip) {
      loadCommunityTip();
    } else if (activeTab === 'smart') {
      loadSmartTips();
    } else if (activeTab === 'browse') {
      loadAllTips(selectedCategory);
    }
  }, [activeTab, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'community') await loadCommunityTip(currentTip?.id);
    else if (activeTab === 'smart') await loadSmartTips();
    else if (activeTab === 'browse') await loadAllTips(selectedCategory);
    setRefreshing(false);
  };

  const handleLike = async () => {
    if (liked || !currentTip) return;
    try {
      const res = await tipsService.likeTip(currentTip.id);
      if (res.success) {
        setLiked(true);
        setCurrentTip(prev => ({ ...prev, likesCount: parseInt(prev.likesCount) + 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 0) return COLORS.danger;
    if (priority === 1) return COLORS.warning;
    return COLORS.primary;
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}>
        <View style={{ marginBottom: 20 }}>
          <Text style={s.title}>Energy Savings</Text>
          <Text style={s.subtitle}>Smart tips to lower your electric bill</Text>
        </View>

        {/* Tab Selector */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              onPress={() => setActiveTab(tab.id)}
              style={[s.tabBtn, activeTab === tab.id && s.tabActive]}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.id ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================= COMMUNITY TAB ================= */}
        {activeTab === 'community' && (
          <View>
            {error && (
              <View style={s.errorBox}>
                <Ionicons name="cloud-offline-outline" size={32} color={COLORS.danger} />
                <Text style={s.errorText}>{error}</Text>
                <TouchableOpacity style={s.retryBtn} onPress={() => loadCommunityTip()}>
                  <Text style={s.retryText}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            )}

            {!error && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <GlassCard gradient style={s.interactiveCard}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.primary} size="large" />
                  ) : currentTip ? (
                    <>
                      <View style={s.tipCatRow}>
                        <Ionicons name={currentTip.icon || 'bulb'} size={16} color={COLORS.primary} />
                        <Text style={s.tipCatLabel}>{currentTip.category}</Text>
                      </View>
                      
                      <Text style={s.tipMainTitle}>{currentTip.title}</Text>
                      <Text style={s.tipMainMessage}>{currentTip.message}</Text>

                      <View style={s.interactiveFooter}>
                        <TouchableOpacity 
                          style={[s.likeBtn, liked && s.likeBtnActive]} 
                          onPress={handleLike}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={liked ? "heart" : "heart-outline"} 
                            size={20} 
                            color={liked ? COLORS.danger : COLORS.textSecondary} 
                          />
                          <Text style={s.likeCount}>{currentTip.likesCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={s.refreshBtn} 
                          onPress={() => loadCommunityTip(currentTip.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="refresh" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : null}
                </GlassCard>
              </Animated.View>
            )}

            <GlassCard style={s.howCard}>
              <View style={s.howHeader}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                <Text style={s.howTitle}>About General Tips</Text>
              </View>
              <Text style={s.howText}>
                These tips are specifically curated for Filipino student dormitories. They focus on common appliances like electric fans, rice cookers, and laptop usage. Like your favorites to help other students find the best advice!
              </Text>
            </GlassCard>
          </View>
        )}

        {/* ================= SMART INSIGHTS TAB ================= */}
        {activeTab === 'smart' && (
          <View>
            <GlassCard style={s.statusBanner}>
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: smartTips.length > 0 ? COLORS.primary : COLORS.textMuted }]} />
                <Text style={s.statusText}>
                  {smartTips.length > 0 
                    ? `${smartTips.length} insights based on real-time data` 
                    : 'Monitoring your consumption...'}
                </Text>
              </View>
              {lastSmartUpdate && (
                <Text style={s.statusTime}>{lastSmartUpdate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
              )}
            </GlassCard>

            {smartTips.length > 0 ? (
              smartTips.map((tip, i) => {
                const pColor = getPriorityColor(tip.priority);
                return (
                  <GlassCard key={i} style={s.dynamicCard}>
                    <View style={s.dynamicHeader}>
                      <View style={[s.dynamicIcon, { backgroundColor: `${pColor}15` }]}>
                        <Ionicons name={tip.icon || 'analytics'} size={20} color={pColor} />
                      </View>
                      <View style={s.dynamicMeta}>
                        <Text style={s.dynamicCat}>{tip.category}</Text>
                        <View style={[s.priorityBadge, { backgroundColor: `${pColor}20` }]}>
                          <Text style={[s.priorityText, { color: pColor }]}>
                            {tip.priority === 0 ? 'URGENT' : tip.priority === 1 ? 'IMPORTANT' : 'STABLE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={s.dynamicTip}>{tip.tip}</Text>
                  </GlassCard>
                )
              })
            ) : (
              <GlassCard style={s.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.primary} />
                <Text style={s.emptyTitle}>Everything looks great!</Text>
                <Text style={s.emptyDesc}>No high consumption patterns detected right now.</Text>
              </GlassCard>
            )}
          </View>
        )}

        {/* ================= BROWSE TAB ================= */}
        {activeTab === 'browse' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContainer}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setSelectedCategory(cat)}
                  style={[s.catBtn, selectedCategory === cat && s.catActive]}
                >
                  <Text style={[s.catText, selectedCategory === cat && s.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allTips.map((tip) => (
              <GlassCard key={tip.id} style={s.tipCard}>
                <View style={s.tipIcon}>
                  <Ionicons name={tip.icon || 'bulb'} size={22} color={COLORS.primary} />
                </View>
                <View style={s.tipContent}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipCategory}>{tip.category}</Text>
                  <Text style={s.tipText}>{tip.message}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="heart" size={12} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{tip.likesCount}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye" size={12} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{tip.viewsCount}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
