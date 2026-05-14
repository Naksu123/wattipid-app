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
        today: today.data,
        week: week.data,
        month: month.data
      }
    };
  } catch (error) {
    return { success: false, message: 'Failed to fetch dashboard data' };
  }
};

export const getDailyBreakdown = async (roomId, year, month) => {
  const response = await apiClient.post('/api.php?action=getDailyBreakdownFiltered', {
    roomId,
    year,
    month
  });
  return response.data;
};

export const getHourlyBreakdown = async (roomId) => {
  const response = await apiClient.post('/api.php?action=getHourlyBreakdown', { roomId });
  return response.data;
};

export const getForecast = async (roomId) => {
    // This uses the new ForecastEngine on the backend
    const response = await apiClient.post('/api.php?action=getMonthlyForecast', { roomId });
    return response.data;
};
