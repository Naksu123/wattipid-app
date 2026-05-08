import { API_URL } from './config';

/**
 * Service for the Dynamic Electricity-Saving Tips System (MySQL Backend)
 * Using native fetch to avoid external dependencies like axios.
 */
const TIPS_API = `${API_URL}/tips`;

export const tipsService = {
  /**
   * Get a random tip from the database
   */
  getRandomTip: async (lastId = 0) => {
    try {
      const response = await fetch(`${TIPS_API}/getRandomTip.php?last_id=${lastId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching random tip:', error);
      throw error;
    }
  },

  /**
   * Get the consistent tip of the day
   */
  getTipOfTheDay: async () => {
    try {
      const response = await fetch(`${TIPS_API}/tipOfTheDay.php`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching tip of the day:', error);
      throw error;
    }
  },

  /**
   * Get all active tips (with optional category filter)
   */
  getAllTips: async (category = null) => {
    try {
      const url = category 
        ? `${TIPS_API}/getAllTips.php?category=${encodeURIComponent(category)}`
        : `${TIPS_API}/getAllTips.php`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching all tips:', error);
      throw error;
    }
  },

  /**
   * Increment likes for a specific tip
   */
  likeTip: async (id) => {
    try {
      // Use URLSearchParams for simple POST requests in PHP
      const response = await fetch(`${TIPS_API}/likeTip.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `id=${id}`
      });
      return await response.json();
    } catch (error) {
      console.error('Error liking tip:', error);
      throw error;
    }
  },

  // --- Admin/Landlord CRUD Operations ---
  
  addTip: async (tipData) => {
    try {
      const response = await fetch(`${TIPS_API}/addTip.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding tip:', error);
      throw error;
    }
  },

  updateTip: async (tipData) => {
    try {
      const response = await fetch(`${TIPS_API}/updateTip.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating tip:', error);
      throw error;
    }
  },

  deleteTip: async (id) => {
    try {
      const response = await fetch(`${TIPS_API}/deleteTip.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `id=${id}`
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting tip:', error);
      throw error;
    }
  }
};
