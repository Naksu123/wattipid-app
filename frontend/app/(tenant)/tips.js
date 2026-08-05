import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, ActivityIndicator, FlatList, TextInput } from 'react-native';
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

const SORT_OPTIONS = [
  { id: 'category', label: 'Category' },
  { id: 'az', label: 'A-Z' },
  { id: 'za', label: 'Z-A' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('category');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState(null);

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
      setBrowseLoading(true);
      setBrowseError(null);
      const res = await tipsService.getAllTips(cat === 'All' ? null : cat);
      if (res.success) {
        // Preserve local like state from previous session
        setAllTips(prev => {
          const likedIds = new Set(prev.filter(t => t._hasLikedLocal).map(t => t.id));
          return (res.data || []).map(t => ({ ...t, _hasLikedLocal: likedIds.has(t.id) }));
        });
      } else {
        setBrowseError('Unable to load tips. Please try again.');
      }
    } catch (err) {
      setBrowseError('Unable to load tips. Please try again.');
    } finally {
      setBrowseLoading(false);
    }
  };

  // Filtered and sorted tips (memoized for performance)
  const filteredTips = useMemo(() => {
    let result = [...allTips];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        (t.title || '').toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query) ||
        (t.message || '').toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (sortBy) {
      case 'az':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'za':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'newest':
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'oldest':
        result.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      case 'category':
      default:
        result.sort((a, b) => {
          const catCompare = (a.category || '').localeCompare(b.category || '');
          return catCompare !== 0 ? catCompare : (a.title || '').localeCompare(b.title || '');
        });
        break;
    }

    return result;
  }, [allTips, searchQuery, sortBy]);

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

  const getSavingsColor = (level) => {
    if (level === 'High') return COLORS.success || '#22c55e';
    if (level === 'Moderate') return COLORS.warning || '#f59e0b';
    return COLORS.info || '#3b82f6';
  };

  // FlatList render item for Browse tab
  const renderTipItem = useCallback(({ item: tip }) => (
    <GlassCard style={[s.tipCard, { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}>
      <View style={s.tipIcon}>
        <Ionicons name={tip.icon || 'bulb'} size={22} color={COLORS.primary} />
      </View>
      <View style={s.tipContent}>
        <View style={s.tipHeaderRow}>
          <Text style={s.tipTitle}>{tip.title}</Text>
          {tip.savings_level && (
            <View style={[s.impactBadge, { backgroundColor: `${getSavingsColor(tip.savings_level)}15` }]}>
              <Text style={[s.impactText, { color: getSavingsColor(tip.savings_level) }]}>
                {tip.savings_level === 'High' ? '⚡ HIGH SAVINGS' : tip.savings_level === 'Moderate' ? '💡 MODERATE' : '✨ LOW'}
              </Text>
            </View>
          )}
        </View>
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
  ), []);

  const renderBrowseHeader = () => (
    <>
      {/* Search Bar */}
      <View style={s.browseSearchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.browseSearchInput}
          placeholder="Search tips by title, category, or keyword..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Scroll */}
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

      {/* Sort & Count Row */}
      <View style={s.browseSortRow}>
        <Text style={s.browseCountText}>
          {filteredTips.length} {filteredTips.length === 1 ? 'tip' : 'tips'} found
        </Text>
        <TouchableOpacity
          style={s.browseSortBtn}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={COLORS.primary} />
          <Text style={s.browseSortLabel}>{SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort'}</Text>
          <Ionicons name={showSortMenu ? "chevron-up" : "chevron-down"} size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <View style={s.browseSortDropdown}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[s.browseSortOption, sortBy === option.id && s.browseSortOptionActive]}
              onPress={() => { setSortBy(option.id); setShowSortMenu(false); }}
            >
              <Text style={[s.browseSortOptionText, sortBy === option.id && s.browseSortOptionTextActive]}>
                {option.label}
              </Text>
              {sortBy === option.id && (
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderBrowseEmpty = () => (
    <GlassCard style={s.emptyState}>
      <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
      <Text style={s.emptyTitle}>
        {searchQuery ? 'No matching tips found' : 'No electricity-saving tips are available.'}
      </Text>
      <Text style={s.emptyDesc}>
        {searchQuery ? 'Try a different search term or category.' : 'Check back later for new energy-saving tips.'}
      </Text>
    </GlassCard>
  );

  return (
    <View style={s.container}>
      {activeTab === 'browse' ? (
        /* ================= BROWSE TAB (FlatList) ================= */
        <View style={{ flex: 1 }}>
          {/* Fixed Header Section */}
          <View style={{ paddingHorizontal: 20, paddingTop: 60 }}>
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
          </View>

          {browseLoading && allTips.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Loading tips...</Text>
            </View>
          ) : browseError && allTips.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <Ionicons name="cloud-offline-outline" size={48} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, marginTop: 12, fontSize: 14, textAlign: 'center' }}>{browseError}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => loadAllTips(selectedCategory)}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 20 }}>
                {renderBrowseHeader()}
              </View>
              <FlatList
                data={filteredTips}
                renderItem={renderTipItem}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={renderBrowseEmpty}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
              />
            </View>
          )}
        </View>
      ) : (
        /* ================= COMMUNITY & SMART TABS (ScrollView) ================= */
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}>
          <View style={{ marginBottom: 20 }}>
            <Text style={s.title}>Energy Saving Tips</Text>
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
        </ScrollView>
      )}
    </View>
  );
}
