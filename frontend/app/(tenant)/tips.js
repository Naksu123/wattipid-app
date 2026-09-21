import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConsumption } from '@/contexts/ConsumptionContext';
import { tipsService } from '@/services/tipsService';
import { generateDynamicTips } from '@/services/tipsEngine';
import { COLORS } from '@/styles/theme';
import s from '@/styles/tenant/tips.styles';

const CopilotView = walkthroughable(View);
const TIPS_PER_PAGE = 3;

export default function TipsScreen() {
  const { user } = useAuth();
  const { data: sensorData, deviceOnline } = useConsumption();
  const roomId = user?.room_id || 'Room 1';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Tips Data
  const [tipOfTheDay, setTipOfTheDay] = useState(null);
  const [smartInsight, setSmartInsight] = useState(null);
  const [allTips, setAllTips] = useState([]);
  const [trendingTips, setTrendingTips] = useState([]);

  // Filter, Search, Pagination & View Mode
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedTipIds, setLikedTipIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'carousel'
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);

  const scrollViewRef = useRef(null);
  useTourAutoStart('tips', !loading, scrollViewRef);

  // Dynamic Categories derived from loaded tips
  const categories = useMemo(() => {
    const rawCategories = allTips.map(t => t.category).filter(Boolean);
    const unique = Array.from(new Set(rawCategories)).sort();
    return ['All', ...unique];
  }, [allTips]);

  // Reset to page 1 whenever category or search changes
  useEffect(() => {
    setCurrentPage(1);
    setActiveCarouselIdx(0);
  }, [selectedCategory, searchQuery]);

  const hasTipsRef = useRef(false);

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCachedTips = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_tenant_tips');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            if (parsed.tipOfTheDay) setTipOfTheDay(parsed.tipOfTheDay);
            if (Array.isArray(parsed.trendingTips)) setTrendingTips(parsed.trendingTips);
            if (Array.isArray(parsed.allTips) && parsed.allTips.length > 0) {
              setAllTips(parsed.allTips);
              hasTipsRef.current = true;
              setLoading(false);
            }
            if (parsed.smartInsight) setSmartInsight(parsed.smartInsight);
          }
        }
      } catch (err) {
        console.warn('[TipsScreen] Cache restore error:', err);
      }
    };
    restoreCachedTips();
    return () => { isMounted = false; };
  }, []);

  // Load all tip data from real database and dynamic engine
  const loadData = useCallback(async () => {
    try {
      setError(null);

      const [todRes, trendingRes, allTipsRes] = await Promise.allSettled([
        tipsService.getTipOfTheDay(),
        tipsService.getTrendingTips(3),
        tipsService.getAllTips()
      ]);

      let currentTod = null;
      // 1. Tip of the Day
      if (todRes.status === 'fulfilled' && todRes.value?.success && todRes.value?.data) {
        currentTod = todRes.value.data;
        setTipOfTheDay(currentTod);
      }

      let currentTrending = [];
      // 2. Trending Tips
      if (trendingRes.status === 'fulfilled' && trendingRes.value?.success && Array.isArray(trendingRes.value?.data)) {
        currentTrending = trendingRes.value.data;
        setTrendingTips(currentTrending);
      }

      // 3. All Tips (General repository)
      let generalTipsList = [];
      if (allTipsRes.status === 'fulfilled' && allTipsRes.value?.success && Array.isArray(allTipsRes.value?.data)) {
        generalTipsList = allTipsRes.value.data;
        setAllTips(generalTipsList);
        hasTipsRef.current = true;
      }

      // 4. Smart Insight based on real-time consumption data (no appliance-specific claims)
      let currentInsight = null;
      try {
        const livePower = sensorData?.power ? Number(sensorData.power) : 0;
        const dynamicTips = await generateDynamicTips(roomId, livePower, user);
        if (Array.isArray(dynamicTips) && dynamicTips.length > 0) {
          currentInsight = dynamicTips[0];
          setSmartInsight(currentInsight);
        } else {
          // Fallback to behavior recommendation
          const recRes = await tipsService.getSmartRecommendation({ user });
          if (recRes.success && recRes.data) {
            currentInsight = recRes.data;
            setSmartInsight(currentInsight);
          }
        }
      } catch (err) {
        console.warn('[TipsScreen] Smart insight generation fallback:', err);
      }

      // Save to cache
      AsyncStorage.setItem('@cached_tenant_tips', JSON.stringify({
        tipOfTheDay: currentTod,
        trendingTips: currentTrending,
        allTips: generalTipsList,
        smartInsight: currentInsight
      })).catch(() => {});

    } catch (err) {
      console.error('[TipsScreen] Load data error:', err);
      if (!hasTipsRef.current) {
        setError('Unable to load tips right now. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomId, user?.id, sensorData?.power]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Like interaction with optimistic update
  const handleLikeTip = async (tipId) => {
    if (likedTipIds.has(tipId)) return;

    // Optimistically mark as liked
    setLikedTipIds(prev => new Set(prev).add(tipId));

    // Update in allTips list
    setAllTips(prev => prev.map(t => 
      t.id === tipId ? { ...t, likesCount: (parseInt(t.likesCount, 10) || 0) + 1 } : t
    ));

    // Update in tipOfTheDay if it matches
    if (tipOfTheDay?.id === tipId) {
      setTipOfTheDay(prev => prev ? { ...prev, likesCount: (parseInt(prev.likesCount, 10) || 0) + 1 } : prev);
    }

    try {
      await tipsService.likeTip(tipId);
    } catch (err) {
      // Rollback on failure
      setLikedTipIds(prev => {
        const next = new Set(prev);
        next.delete(tipId);
        return next;
      });
      setAllTips(prev => prev.map(t => 
        t.id === tipId ? { ...t, likesCount: Math.max(0, (parseInt(t.likesCount, 10) || 1) - 1) } : t
      ));
    }
  };

  // Filtered tips based on category and search query
  const filteredTips = useMemo(() => {
    let result = [...allTips];

    if (selectedCategory !== 'All') {
      result = result.filter(tip => tip.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tip => 
        tip.title?.toLowerCase().includes(q) ||
        tip.message?.toLowerCase().includes(q) ||
        tip.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allTips, selectedCategory, searchQuery]);

  // Paginated tips (3 tips per page to prevent long vertical clutter)
  const totalPages = Math.ceil(filteredTips.length / TIPS_PER_PAGE) || 1;
  const paginatedTips = useMemo(() => {
    const start = (currentPage - 1) * TIPS_PER_PAGE;
    return filteredTips.slice(start, start + TIPS_PER_PAGE);
  }, [filteredTips, currentPage]);

  const getVisiblePageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (current >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total];
    }
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getImpactConfig = (level) => {
    switch (level) {
      case 'High':
        return { pct: '85%', color: '#10B981', label: 'High' };
      case 'Moderate':
        return { pct: '55%', color: '#06B6D4', label: 'Medium' };
      case 'Low':
      default:
        return { pct: '30%', color: '#F59E0B', label: 'Low' };
    }
  };

  const renderTipCard = (tip, isCarousel = false) => {
    const isLiked = likedTipIds.has(tip.id);
    const impact = getImpactConfig(tip.savings_level || 'Low');
    const screenWidth = Dimensions.get('window').width;
    const cardStyle = isCarousel 
      ? [s.carouselCard, { width: screenWidth - 64 }]
      : s.tipCard;

    return (
      <View key={tip.id} style={cardStyle}>
        <View style={s.tipCardHeader}>
          <View style={s.tipCardHeaderLeft}>
            <View style={s.tipIconBadge}>
              <Ionicons name={tip.icon || 'leaf'} size={16} color="#10B981" />
            </View>
            <Text style={s.tipCategoryLabel} numberOfLines={1}>{tip.category}</Text>
          </View>

          {tip.savings_amount ? (
            <View style={s.savingsBadge}>
              <Text style={s.savingsText}>~₱{tip.savings_amount}/mo</Text>
            </View>
          ) : tip.savings_level ? (
            <View style={s.savingsBadge}>
              <Text style={s.savingsText}>
                {tip.savings_level === 'High' ? '⚡ High Impact' : (tip.savings_level === 'Moderate' ? '💡 Moderate' : '✨ Daily Tip')}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={s.tipTitle}>{tip.title}</Text>
        <Text style={s.tipDesc} numberOfLines={3}>{tip.message}</Text>

        {/* Impact Level Progress Bar (matches energy-tips.png) */}
        <View style={s.impactRow}>
          <Text style={s.impactLabel}>Impact Level</Text>
          <Text style={[s.impactValue, { color: impact.color }]}>{impact.label}</Text>
        </View>
        <View style={s.impactTrack}>
          <View style={[s.impactFill, { width: impact.pct, backgroundColor: impact.color }]} />
        </View>

        <View style={s.tipCardFooter}>
          <TouchableOpacity 
            style={s.tipLikeBtn} 
            onPress={() => handleLikeTip(tip.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={15} 
              color={isLiked ? "#EF4444" : "#64748B"} 
            />
            <Text style={[s.tipLikeText, isLiked && { color: "#EF4444", fontWeight: '700' }]}>
              {tip.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <Text style={s.tipViewsCount}>
            {tip.viewsCount ? `${tip.viewsCount} views` : '1 min read'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ================= 1. COMPACT HEADER (NO LARGE HERO) ================= */}
        <View style={s.compactHeader}>
          <Text style={s.pageTitle}>Energy Tips</Text>
          <Text style={s.pageSubtitle}>Simple ways to understand and reduce your electricity use.</Text>
        </View>

        {/* ================= 2. SEARCH BAR & CATEGORY FILTER ================= */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={17} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search tips or habits..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips */}
        <View style={s.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={s.categoryList}
          >
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[s.categoryChip, isActive && s.categoryChipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.categoryText, isActive && s.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= ERROR STATE ================= */}
        {error && allTips.length === 0 && (
          <View style={s.errorCard}>
            <Ionicons name="cloud-offline-outline" size={32} color="#EF4444" />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <Text style={s.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= LOADING STATE ================= */}
        {loading && !refreshing && allTips.length === 0 && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={s.loadingText}>Loading energy recommendations...</Text>
          </View>
        )}

        {(!loading || allTips.length > 0) && (!error || allTips.length > 0) && (
          <>
            {/* ================= 3. SMART INSIGHT (COMPACT CARD) ================= */}
            {selectedCategory === 'All' && !searchQuery && smartInsight && (
              <View style={s.smartCard}>
                <View style={s.smartTopRow}>
                  <View style={s.smartBadge}>
                    <Ionicons name="pulse" size={15} color="#10B981" />
                    <Text style={s.smartBadgeText}>SMART INSIGHT</Text>
                  </View>
                  {sensorData?.power > 0 && deviceOnline ? (
                    <Text style={s.smartMetric}>Live: {Math.round(sensorData.power)}W</Text>
                  ) : null}
                </View>

                <Text style={s.smartTitle}>
                  {smartInsight.title || 'Consumption Observation'}
                </Text>
                <Text style={s.smartMessage}>
                  {smartInsight.message || smartInsight.tip || 'Monitoring your real-time electricity usage to help you maintain efficient daily habits.'}
                </Text>
              </View>
            )}

            {/* ================= 4. TIP OF THE DAY (COMPACT HIGHLIGHTED CARD) ================= */}
            {selectedCategory === 'All' && !searchQuery && tipOfTheDay && (
              <CopilotStep
                text="Tip of the Day provides a daily electricity-saving recommendation to help you develop better energy-saving habits."
                order={10}
                name="tips_of_the_day"
              >
                <CopilotView>
                  <View style={s.todCard}>
                    <View style={s.todHeaderRow}>
                      <View style={s.todBadge}>
                        <Ionicons name="sparkles" size={13} color="#F59E0B" />
                        <Text style={s.todBadgeText}>TIP OF THE DAY</Text>
                      </View>
                      <Text style={s.todCategoryText}>
                        {tipOfTheDay.category || 'Daily Habit'}
                      </Text>
                    </View>

                    <Text style={s.todTitle}>{tipOfTheDay.title}</Text>
                    <Text style={s.todMessage}>{tipOfTheDay.message}</Text>

                    <View style={s.todFooter}>
                      <View style={s.todStatsRow}>
                        <View style={s.todStatItem}>
                          <Ionicons name="eye-outline" size={14} color="#64748B" />
                          <Text style={s.todStatText}>{tipOfTheDay.viewsCount || 0} views</Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        style={[s.todLikeBtn, likedTipIds.has(tipOfTheDay.id) && s.todLikeBtnActive]}
                        onPress={() => handleLikeTip(tipOfTheDay.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons 
                          name={likedTipIds.has(tipOfTheDay.id) ? "heart" : "heart-outline"} 
                          size={14} 
                          color="#EF4444" 
                        />
                        <Text style={s.todLikeText}>
                          {tipOfTheDay.likesCount || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </CopilotView>
              </CopilotStep>
            )}

            {/* ================= 5. GENERAL TIPS (REORGANIZED COMPACT SECTION) ================= */}
            <CopilotStep
              text="This section provides electricity-saving recommendations designed to help you understand and improve your electricity consumption behavior."
              order={9}
              name="tips_general"
            >
              <CopilotView>
                <View style={s.sectionHeaderRow}>
                  <View style={s.sectionTitleRow}>
                    <Ionicons name="bulb-outline" size={15} color="#10B981" />
                    <Text style={s.sectionTitle}>
                      {selectedCategory === 'All' ? 'ENERGY-SAVING TIPS' : selectedCategory.toUpperCase()}
                    </Text>
                    <Text style={s.sectionCountBadge}>
                      {viewMode === 'list' && filteredTips.length > TIPS_PER_PAGE
                        ? `Page ${currentPage}/${totalPages} (${filteredTips.length})`
                        : `${filteredTips.length} tips`}
                    </Text>
                  </View>

                  {/* View Mode Toggle */}
                  {filteredTips.length > 1 && (
                    <View style={s.viewModeToggle}>
                      <TouchableOpacity 
                        style={[s.viewModeBtn, viewMode === 'list' && s.viewModeBtnActive]}
                        onPress={() => setViewMode('list')}
                        activeOpacity={0.75}
                        accessibilityLabel="List View"
                      >
                        <Ionicons name="list" size={14} color={viewMode === 'list' ? '#10B981' : '#64748B'} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.viewModeBtn, viewMode === 'carousel' && s.viewModeBtnActive]}
                        onPress={() => setViewMode('carousel')}
                        activeOpacity={0.75}
                        accessibilityLabel="Horizontal Swipe View"
                      >
                        <Ionicons name="albums-outline" size={14} color={viewMode === 'carousel' ? '#10B981' : '#64748B'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {filteredTips.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Ionicons name="search-outline" size={36} color="#64748B" />
                    <Text style={s.emptyTitle}>No tips found</Text>
                    <Text style={s.emptySubtext}>
                      {searchQuery 
                        ? 'Try searching with a different term or select "All".' 
                        : 'No tips available in this category right now.'}
                    </Text>
                  </View>
                ) : viewMode === 'carousel' ? (
                  /* Horizontal Carousel Mode (Zero vertical clutter, easy horizontal swipe) */
                  <View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={Dimensions.get('window').width - 64 + 12}
                      decelerationRate="fast"
                      contentContainerStyle={{ paddingRight: 16 }}
                      style={s.carouselScroll}
                      onScroll={(e) => {
                        const cardWidth = Dimensions.get('window').width - 64 + 12;
                        const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
                        setActiveCarouselIdx(Math.min(filteredTips.length - 1, Math.max(0, idx)));
                      }}
                      scrollEventThrottle={32}
                    >
                      {filteredTips.map((tip) => renderTipCard(tip, true))}
                    </ScrollView>

                    {/* Carousel Dot Indicators */}
                    {filteredTips.length > 1 && (
                      <View style={s.carouselIndicators}>
                        {filteredTips.slice(0, 10).map((_, dotIdx) => (
                          <View 
                            key={dotIdx}
                            style={[s.carouselDot, activeCarouselIdx === dotIdx && s.carouselDotActive]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  /* Compact Paginated List Mode (3 tips per page) */
                  <View>
                    {paginatedTips.map((tip) => renderTipCard(tip, false))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <View style={s.paginationContainer}>
                        {/* Prev Button */}
                        <TouchableOpacity
                          style={[s.pageNavBtn, currentPage === 1 && s.pageNavBtnDisabled]}
                          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chevron-back" size={15} color={currentPage === 1 ? '#475569' : '#FFFFFF'} />
                          <Text style={[s.pageNavText, currentPage === 1 && s.pageNavTextDisabled]}>Prev</Text>
                        </TouchableOpacity>

                        {/* Page Pills */}
                        <View style={s.pagePillsRow}>
                          {getVisiblePageNumbers(currentPage, totalPages).map((pageNum) => (
                            <TouchableOpacity
                              key={pageNum}
                              style={[s.pagePill, currentPage === pageNum && s.pagePillActive]}
                              onPress={() => setCurrentPage(pageNum)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.pagePillText, currentPage === pageNum && s.pagePillTextActive]}>
                                {pageNum}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Next Button */}
                        <TouchableOpacity
                          style={[s.pageNavBtn, currentPage === totalPages && s.pageNavBtnDisabled]}
                          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.pageNavText, currentPage === totalPages && s.pageNavTextDisabled]}>Next</Text>
                          <Ionicons name="chevron-forward" size={15} color={currentPage === totalPages ? '#475569' : '#FFFFFF'} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </CopilotView>
            </CopilotStep>

            {/* ================= 6. TRENDING IN DORMS (COMPACT RANKED LIST) ================= */}
            {selectedCategory === 'All' && !searchQuery && trendingTips.length > 0 && (
              <CopilotStep
                text="This section presents useful electricity-saving trends or practices among dorm users."
                order={11}
                name="tips_trending"
              >
                <CopilotView style={{ marginTop: 12 }}>
                  <View style={s.sectionHeaderRow}>
                    <View style={s.sectionTitleRow}>
                      <Ionicons name="flame" size={15} color="#EF4444" />
                      <Text style={s.sectionTitle}>TRENDING IN DORMS</Text>
                    </View>
                  </View>

                  {trendingTips.map((tip, idx) => {
                    const rankStyles = [
                      { bg: 'rgba(250, 204, 21, 0.16)', text: '#FACC15', border: 'rgba(250, 204, 21, 0.3)' }, // #1 Gold
                      { bg: 'rgba(148, 163, 184, 0.16)', text: '#CBD5E1', border: 'rgba(148, 163, 184, 0.3)' }, // #2 Silver
                      { bg: 'rgba(217, 119, 6, 0.16)', text: '#F59E0B', border: 'rgba(217, 119, 6, 0.3)' },  // #3 Bronze
                    ];
                    const rank = rankStyles[idx] || rankStyles[2];

                    return (
                      <View key={tip.id} style={s.trendingCard}>
                        <View style={[s.rankSquircle, { backgroundColor: rank.bg, borderWidth: 1, borderColor: rank.border }]}>
                          <Text style={[s.rankNumber, { color: rank.text }]}>#{idx + 1}</Text>
                        </View>

                        <View style={s.trendingContent}>
                          <Text style={s.trendingTitle} numberOfLines={1}>{tip.title}</Text>
                          <Text style={s.trendingCat} numberOfLines={1}>{tip.category}</Text>
                        </View>

                        <View style={s.trendingLikesWrap}>
                          <Ionicons name="heart" size={13} color="#EF4444" />
                          <Text style={s.trendingLikesText}>{tip.likesCount || 0}</Text>
                        </View>
                      </View>
                    );
                  })}
                </CopilotView>
              </CopilotStep>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
