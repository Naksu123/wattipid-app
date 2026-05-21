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
  const [tipOfTheDay, setTipOfTheDay] = useState(null);
  const [trendingTips, setTrendingTips] = useState([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Smart Insights State
  const [smartTips, setSmartTips] = useState([]);
  const [lastSmartUpdate, setLastSmartUpdate] = useState(null);

  // All Tips State
  const [allTips, setAllTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Air Conditioning',
    'Fan Usage',
    'Charging Devices',
    'Kitchen Appliances',
    'Refrigerator Usage',
    'Laundry',
    'Study Setup',
    'Shared Room Efficiency',
    'Gaming & Entertainment',
    'Appliance Maintenance',
    'Daily Habits'
  ];

  const loadCommunityTip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use smart recommendation (server-side no-repeat engine)
      const res = await tipsService.getSmartRecommendation();
      if (res.success && res.data) {
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

      // Also load Tip of the Day and Trending (parallel)
      const [todRes, trendRes] = await Promise.all([
        tipsService.getTipOfTheDay(),
        tipsService.getTrendingTips(3),
      ]);
      if (todRes.success && todRes.data) setTipOfTheDay(todRes.data);
      if (trendRes.success && trendRes.data) setTrendingTips(trendRes.data);

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
        // Preserve local like state from previous session
        setAllTips(prev => {
          const likedIds = new Set(prev.filter(t => t._hasLikedLocal).map(t => t.id));
          return (res.data || []).map(t => ({ ...t, _hasLikedLocal: likedIds.has(t.id) }));
        });
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

  // Real-time Background Polling for Engagement Stats
  useEffect(() => {
    let interval;
    if (activeTab === 'browse' || activeTab === 'community') {
      interval = setInterval(async () => {
        try {
          const res = await tipsService.getAllTips(selectedCategory === 'All' ? null : selectedCategory);
          if (res.success) {
            // Sync allTips invisibly — preserve local like state
            setAllTips(currentTips => currentTips.map(t => {
              const updatedTip = res.data.find(ut => ut.id === t.id);
              return updatedTip ? { ...t, likesCount: updatedTip.likesCount, viewsCount: updatedTip.viewsCount, _hasLikedLocal: t._hasLikedLocal || false } : t;
            }));
            
            // Sync currentTip if it exists
            setCurrentTip(currentTip => {
              if (!currentTip) return null;
              const updatedTip = res.data.find(ut => ut.id === currentTip.id);
              return updatedTip ? { ...currentTip, likesCount: updatedTip.likesCount, viewsCount: updatedTip.viewsCount } : currentTip;
            });
          }
        } catch (err) {}
      }, 5000); // 5-second polling for real-time feel
    }
    return () => clearInterval(interval);
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
    
    // Optimistic Update
    setLiked(true);
    setCurrentTip(prev => ({ ...prev, likesCount: parseInt(prev.likesCount) + 1 }));

    try {
      const res = await tipsService.likeTip(currentTip.id);
      if (res.success && res.data?.likes_count) {
        // Sync with absolute server truth
        setCurrentTip(prev => ({ ...prev, likesCount: res.data.likes_count }));
      }
    } catch (err) {
      // Rollback on failure
      setLiked(false);
      setCurrentTip(prev => ({ ...prev, likesCount: parseInt(prev.likesCount) - 1 }));
    }
  };

  const handleLikeAllTip = async (tipId) => {
    // Optimistic Update
    setAllTips(prev => prev.map(t => 
      t.id === tipId ? { ...t, likesCount: parseInt(t.likesCount) + 1, _hasLikedLocal: true } : t
    ));

    try {
      const res = await tipsService.likeTip(tipId);
      if (res.success && res.data?.likes_count) {
        setAllTips(prev => prev.map(t => 
          t.id === tipId ? { ...t, likesCount: res.data.likes_count } : t
        ));
      } else if (!res.success) {
        // Rollback
        setAllTips(prev => prev.map(t => 
          t.id === tipId ? { ...t, likesCount: parseInt(t.likesCount) - 1, _hasLikedLocal: false } : t
        ));
      }
    } catch (err) {
      // Rollback
      setAllTips(prev => prev.map(t => 
        t.id === tipId ? { ...t, likesCount: parseInt(t.likesCount) - 1, _hasLikedLocal: false } : t
      ));
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
              <>
                {/* ---- Recommended For You ---- */}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                    <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>RECOMMENDED FOR YOU</Text>
                  </View>
                  <GlassCard gradient style={[s.interactiveCard, { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}>
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
                            onPress={() => loadCommunityTip()}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="shuffle" size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : null}
                  </GlassCard>
                </Animated.View>

                {/* ---- Tip of the Day ---- */}
                {tipOfTheDay && (
                  <View style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                      <Ionicons name="today" size={16} color={COLORS.warning} />
                      <Text style={{ color: COLORS.warning, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>TIP OF THE DAY</Text>
                    </View>
                    <GlassCard style={[s.interactiveCard, { borderLeftWidth: 3, borderLeftColor: COLORS.warning }]}>
                      <View style={s.tipCatRow}>
                        <Ionicons name={tipOfTheDay.icon || 'bulb'} size={16} color={COLORS.warning} />
                        <Text style={[s.tipCatLabel, { color: COLORS.warning }]}>{tipOfTheDay.category}</Text>
                      </View>
                      <Text style={s.tipMainTitle}>{tipOfTheDay.title}</Text>
                      <Text style={s.tipMainMessage}>{tipOfTheDay.message}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="heart" size={14} color={COLORS.danger} />
                          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{tipOfTheDay.likesCount}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="eye" size={14} color={COLORS.info} />
                          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{tipOfTheDay.viewsCount}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </View>
                )}

                {/* ---- Trending Tips ---- */}
                {trendingTips.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                      <Ionicons name="trending-up" size={16} color={COLORS.info} />
                      <Text style={{ color: COLORS.info, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>TRENDING IN DORMS</Text>
                    </View>
                    {trendingTips.map((tip, idx) => (
                      <GlassCard key={tip.id} style={{ marginBottom: 10, padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${COLORS.info}15`, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: COLORS.info, fontWeight: '800', fontSize: 14 }}>#{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{tip.title}</Text>
                          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{tip.category}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="heart" size={12} color={COLORS.danger} />
                          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{tip.likesCount}</Text>
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                )}
              </>
            )}
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
                  <GlassCard key={i} style={[s.dynamicCard, { borderLeftWidth: 3, borderLeftColor: pColor }]}>
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
              <GlassCard key={tip.id} style={[s.tipCard, { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}>
                <View style={s.tipIcon}>
                  <Ionicons name={tip.icon || 'bulb'} size={22} color={COLORS.primary} />
                </View>
                <View style={s.tipContent}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipCategory}>{tip.category}</Text>
                  <Text style={s.tipText}>{tip.message}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      onPress={() => handleLikeAllTip(tip.id)}
                      disabled={tip._hasLikedLocal}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={tip._hasLikedLocal ? "heart" : "heart-outline"} size={14} color={tip._hasLikedLocal ? COLORS.danger : COLORS.textMuted} />
                      <Text style={{ fontSize: 12, color: tip._hasLikedLocal ? COLORS.danger : COLORS.textMuted, fontWeight: tip._hasLikedLocal ? 'bold' : 'normal' }}>{tip.likesCount}</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye" size={14} color={COLORS.info} />
                      <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{tip.viewsCount}</Text>
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
