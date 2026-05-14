import apiClient from './apiClient';

/**
 * Service for the Dynamic Electricity-Saving Tips System (MySQL Backend)
 */
export const tipsService = {
  /**
   * Get a random tip from the database
   */
  getRandomTip: async (lastId = 0) => {
    try {
      const response = await apiClient.post('/api.php?action=getElectricityTips');
      if (response.data.success && Array.isArray(response.data.data)) {
        const tips = response.data.data;
        response.data.data = tips[Math.floor(Math.random() * tips.length)];
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching random tip:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get the consistent tip of the day
   */
  getTipOfTheDay: async () => {
    try {
      const response = await apiClient.post('/api.php?action=getElectricityTips');
      if (response.data.success && Array.isArray(response.data.data)) {
        response.data.data = response.data.data[0]; // Just pick the first one
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching tip of the day:', error);
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
      console.error('Error fetching all tips:', error);
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
