import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

/**
 * Wattipid Smart Tips Service
 * 
 * Features:
 * - Persistent per-user history in AsyncStorage (@wattipid_tip_history_${userId})
 * - Multi-factor scoring recommendation engine (Behavior relevance + rotation + category diversity)
 * - Batch recommendations for Smart Insights without duplicates
 * - Deterministic Tip of the Day with cross-section deduplication
 * - Trending tips with exclusion support
 * - Optimistic like and view logging
 */

const MAX_HISTORY_LENGTH = 40;
const MAX_CATEGORY_HISTORY = 10;

const getStorageKey = (userId) => `@wattipid_tip_history_${userId || 'guest'}`;

// In-memory session cache for fast access
const _memHistory = {};

async function getUserHistory(userId) {
  const key = getStorageKey(userId);
  if (_memHistory[key]) return _memHistory[key];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      _memHistory[key] = {
        seenTipIds: Array.isArray(parsed.seenTipIds) ? parsed.seenTipIds : [],
        categoryHistory: Array.isArray(parsed.categoryHistory) ? parsed.categoryHistory : [],
        lastCategory: parsed.lastCategory || null
      };
      return _memHistory[key];
    }
  } catch (_e) {
    // Ignore storage read error
  }
  _memHistory[key] = { seenTipIds: [], categoryHistory: [], lastCategory: null };
  return _memHistory[key];
}

async function recordSeen(userId, tipId, category) {
  if (!tipId) return;
  const history = await getUserHistory(userId);
  const numId = Number(tipId);

  // Update seenTipIds (sliding window)
  const filtered = history.seenTipIds.filter(id => id !== numId);
  filtered.push(numId);
  history.seenTipIds = filtered.slice(-MAX_HISTORY_LENGTH);

  // Update category history
  if (category) {
    history.categoryHistory.push(category);
    history.categoryHistory = history.categoryHistory.slice(-MAX_CATEGORY_HISTORY);
    history.lastCategory = category;
  }

  const key = getStorageKey(userId);
  _memHistory[key] = history;

  try {
    await AsyncStorage.setItem(key, JSON.stringify(history));
  } catch (_e) {
    // Ignore storage write error
  }
}

export const tipsService = {
  /**
   * Get a smart, non-repeating tip recommendation for the current user.
   */
  getSmartRecommendation: async (options = {}) => {
    const { 
      user = null, 
      excludeIds = [], 
      lastCategory = null, 
      recentCategories = [], 
      relevantCategories = [] 
    } = options;

    const userId = user?.id || 0;
    const history = await getUserHistory(userId);

    const mergedExclude = Array.from(new Set([
      ...history.seenTipIds.slice(-30),
      ...excludeIds.map(Number)
    ]));

    const effectiveLastCat = lastCategory || history.lastCategory;
    const effectiveRecentCats = recentCategories.length > 0 
      ? recentCategories 
      : history.categoryHistory.slice(-5);

    try {
      const response = await apiClient.post('/api.php?action=getSmartRecommendation', {
        exclude_ids: mergedExclude,
        last_category: effectiveLastCat,
        recent_categories: effectiveRecentCats,
        relevant_categories: relevantCategories,
      });

      if (response.data.success && response.data.data) {
        const tip = response.data.data;
        await recordSeen(userId, tip.id, tip.category);
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching smart recommendation:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Batch Smart Recommendations: Returns multiple diverse, non-repeating tips for Smart Insights
   */
  getSmartRecommendationsBatch: async (options = {}) => {
    const { 
      user = null, 
      count = 3, 
      excludeIds = [], 
      lastCategory = null, 
      recentCategories = [], 
      relevantCategories = [] 
    } = options;

    const userId = user?.id || 0;
    const history = await getUserHistory(userId);

    const mergedExclude = Array.from(new Set([
      ...history.seenTipIds.slice(-30),
      ...excludeIds.map(Number)
    ]));

    const effectiveLastCat = lastCategory || history.lastCategory;
    const effectiveRecentCats = recentCategories.length > 0 
      ? recentCategories 
      : history.categoryHistory.slice(-5);

    try {
      const response = await apiClient.post('/api.php?action=getSmartRecommendationsBatch', {
        count,
        exclude_ids: mergedExclude,
        last_category: effectiveLastCat,
        recent_categories: effectiveRecentCats,
        relevant_categories: relevantCategories,
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        for (const tip of response.data.data) {
          await recordSeen(userId, tip.id, tip.category);
        }
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching batch recommendations:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get the Tip of the Day (same tip for all users on a given calendar day, with exclusion support)
   */
  getTipOfTheDay: async (excludeIds = []) => {
    try {
      const response = await apiClient.post('/api.php?action=getTipOfTheDay', {
        exclude_ids: excludeIds.map(Number)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tip of the day:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get trending tips (most engaged, with exclusion support)
   */
  getTrendingTips: async (limit = 3, excludeIds = []) => {
    try {
      const response = await apiClient.post('/api.php?action=getTrendingTips', { 
        limit,
        exclude_ids: excludeIds.map(Number)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending tips:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get all active tips (with optional category filter)
   */
  getAllTips: async (category = null) => {
    try {
      const response = await apiClient.post('/api.php?action=getElectricityTips');
      if (category && response.data.success) {
        response.data.data = response.data.data.filter(t => t.category === category);
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Increment likes for a specific tip
   */
  likeTip: async (id) => {
    try {
      const response = await apiClient.post('/api.php?action=likeTip', { id });
      return response.data;
    } catch (error) {
      console.error('Error liking tip:', error);
      throw error;
    }
  },

  /**
   * Increment views for a specific tip and record in user history
   */
  viewTip: async (id, userId = null) => {
    try {
      const response = await apiClient.post('/api.php?action=viewTip', { id });
      if (userId && id) {
        await recordSeen(userId, id);
      }
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },

  /**
   * Reset local history (e.g. on user logout)
   */
  resetSeenCache: (userId = null) => {
    if (userId) {
      const key = getStorageKey(userId);
      delete _memHistory[key];
      AsyncStorage.removeItem(key).catch(() => {});
    } else {
      Object.keys(_memHistory).forEach(k => delete _memHistory[k]);
    }
  },

  // --- Admin/Landlord CRUD Operations ---

  addTip: async (tipData) => {
    try {
      const response = await apiClient.post('/api.php?action=addTips', tipData);
      return response.data;
    } catch (error) {
      console.error('Error adding tip:', error);
      throw error;
    }
  },

  updateTip: async (tipData) => {
    try {
      const response = await apiClient.post('/api.php?action=updateTip', tipData);
      return response.data;
    } catch (error) {
      console.error('Error updating tip:', error);
      throw error;
    }
  },

  deleteTip: async (id) => {
    try {
      const response = await apiClient.post('/api.php?action=deleteTip', { id });
      return response.data;
    } catch (error) {
      console.error('Error deleting tip:', error);
      throw error;
    }
  }
};
