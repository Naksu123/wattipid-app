import apiClient from './apiClient';

/**
 * Wattipid Consumption Service
 * Handles all energy-related data fetching
 */

export const getDashboardSummary = async (roomId) => {
  try {
    const [today, week, month] = await Promise.all([
      apiClient.post('/api.php?action=getTotalConsumptionToday', { roomId }),
      apiClient.post('/api.php?action=getTotalConsumptionWeek', { roomId }),
      apiClient.post('/api.php?action=getTotalConsumptionMonth', { roomId }),
    ]);

    return {
      success: true,
      data: {
        today: today.data?.data || { totalEnergy: 0, totalCost: 0 },
        week: week.data?.data || { totalEnergy: 0, totalCost: 0 },
        month: month.data?.data || { totalEnergy: 0, totalCost: 0 }
      }
    };
  } catch (error) {
    return { success: false, message: 'Failed to fetch dashboard data' };
  }
};

export const getDailyBreakdown = async (roomId, year, month) => {
  try {
    const response = await apiClient.post('/api.php?action=getDailyBreakdownFiltered', {
      roomId,
      year,
      month
    });
    return response.data;
  } catch (error) {
    console.warn('[API Error] getDailyBreakdownFiltered:', error.message);
    return [];
  }
};

export const getHourlyBreakdown = async (roomId) => {
  try {
    const response = await apiClient.post('/api.php?action=getHourlyBreakdown', { roomId });
    return response.data;
  } catch (error) {
    console.warn('[API Error] getHourlyBreakdown:', error.message);
    return [];
  }
};

export const getForecast = async (roomId) => {
  try {
    // This uses the new ForecastEngine on the backend
    const response = await apiClient.post('/api.php?action=getMonthlyForecast', { roomId });
    return response.data;
  } catch (error) {
    console.warn('[API Error] getForecast:', error.message);
    return null;
  }
};
