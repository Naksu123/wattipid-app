import apiClient from './apiClient';

/**
 * Wattipid Smart Tips Service
 * 
 * Features:
 * - Server-side smart recommendation (no-repeat within 24h)
 * - Local seen-tip cache as fallback deduplication
 * - Tip of the Day (deterministic per calendar day)
 * - Trending tips (engagement-weighted)
 * - Optimistic like with server truth sync
 */

// Local memory cache of recently seen tip IDs (survives tab switches but resets on app restart)
let _seenTipIds = [];
let _lastCategory = null;
const MAX_LOCAL_HISTORY = 20;

function trackSeen(tipId) {
  if (tipId && !_seenTipIds.includes(tipId)) {
    _seenTipIds.push(tipId);
    if (_seenTipIds.length > MAX_LOCAL_HISTORY) {
      _seenTipIds = _seenTipIds.slice(-MAX_LOCAL_HISTORY);
    }
  }
}

function trackCategory(category) {
  if (category) _lastCategory = category;
}

export const tipsService = {
  /**
   * Get a smart, non-repeating tip recommendation for the current user.
   * The backend excludes tips the user has viewed in the last 24 hours,
   * rotates categories, and applies engagement-weighted ranking.
   */
  getSmartRecommendation: async () => {
    try {
      const response = await apiClient.post('/api.php?action=getSmartRecommendation', {
        exclude_ids: _seenTipIds.slice(-10), // Send last 10 as extra safety
        last_category: _lastCategory,
      });
      if (response.data.success && response.data.data) {
        trackSeen(response.data.data.id);
        trackCategory(response.data.data.category);
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching smart recommendation:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get a random tip (legacy fallback). Uses local dedup.
   */
  getRandomTip: async () => {
    try {
      // Use smart recommendation if available (authenticated users)
      const smartRes = await apiClient.post('/api.php?action=getSmartRecommendation', {
        exclude_ids: _seenTipIds.slice(-10),
        last_category: _lastCategory,
      });
      if (smartRes.data.success && smartRes.data.data) {
        trackSeen(smartRes.data.data.id);
        trackCategory(smartRes.data.data.category);
        return smartRes.data;
      }
    } catch (e) {
      // Fallback to legacy random if smart endpoint fails
    }

    try {
      const response = await apiClient.post('/api.php?action=getElectricityTips');
      if (response.data.success && Array.isArray(response.data.data)) {
        const tips = response.data.data;
        // Local dedup: filter out recently seen tips
        const unseenTips = tips.filter(t => !_seenTipIds.includes(t.id));
        const pool = unseenTips.length > 0 ? unseenTips : tips;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        trackSeen(chosen.id);
        trackCategory(chosen.category);
        response.data.data = chosen;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching random tip:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get the Tip of the Day (same tip for all users on a given calendar day)
   */
  getTipOfTheDay: async () => {
    try {
      const response = await apiClient.post('/api.php?action=getTipOfTheDay');
      return response.data;
    } catch (error) {
      console.error('Error fetching tip of the day:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get trending tips (most engaged)
   */
  getTrendingTips: async (limit = 5) => {
    try {
      const response = await apiClient.post('/api.php?action=getTrendingTips', { limit });
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
      // Suppressed console.error to prevent console spam during 5-second polling if network drops
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
   * Increment views for a specific tip
   */
  viewTip: async (id) => {
    try {
      const response = await apiClient.post('/api.php?action=viewTip', { id });
      trackSeen(id);
      return response.data;
    } catch (error) {
      console.error('Error viewing tip:', error);
      // Fail silently for views so it doesn't interrupt UX
      return { success: false };
    }
  },

  /**
   * Reset the local seen-tips cache (useful on logout)
   */
  resetSeenCache: () => {
    _seenTipIds = [];
    _lastCategory = null;
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
