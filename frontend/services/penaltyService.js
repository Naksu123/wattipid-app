import apiClient, { getIsLoggingOut } from './apiClient';

export const getPenaltySettings = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getPenaltySettings' });
        if (response?.data?.isLoggingOut) return {};
        if (!response?.data?.success) {
            if (response?.data?.message === 'Logging out' || response?.data?.message === 'Session expired') {
                return {};
            }
            throw new Error(response?.data?.message || 'Failed to fetch penalty settings');
        }
        return response.data.data || {};
    } catch (error) {
        if (error?.message === 'Logging out' || error?.message === 'Session expired' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return {};
        }
        console.warn('[penaltyService] getPenaltySettings error:', error?.message || error);
        return {};
    }
};

export const updatePenaltySettings = async (settings) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'updatePenaltySettings',
            ...settings
        });
        if (response?.data?.isLoggingOut) return { success: false, message: 'Logging out' };
        if (!response?.data?.success) throw new Error(response?.data?.message || 'Failed to update penalty settings');
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false, message: 'Logging out' };
        }
        console.warn('[penaltyService] updatePenaltySettings error:', error?.message || error);
        throw error;
    }
};

export const getOverdueAccounts = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getOverdueAccounts' });
        if (response?.data?.isLoggingOut) return [];
        if (!response?.data?.success) {
            if (response?.data?.message === 'Logging out' || response?.data?.message === 'Session expired') {
                return [];
            }
            throw new Error(response?.data?.message || 'Failed to fetch overdue accounts');
        }
        return response.data.data || [];
    } catch (error) {
        if (error?.message === 'Logging out' || error?.message === 'Session expired' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return [];
        }
        const message = error.response?.data?.message || error.message || 'Unknown error occurred while fetching overdue accounts';
        console.warn('[penaltyService] getOverdueAccounts error:', message);
        throw new Error(message);
    }
};

export const triggerPenaltyCalculation = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'triggerPenaltyCalculation' });
        if (response?.data?.isLoggingOut) return { success: false };
        if (!response?.data?.success) throw new Error(response?.data?.message || 'Failed to trigger penalty calculation');
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false };
        }
        console.warn('[penaltyService] triggerPenaltyCalculation error:', error?.message || error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const waivePenalty = async (billingCycleId) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'waivePenalty',
            billing_cycle_id: billingCycleId
        });
        if (response?.data?.isLoggingOut) return { success: false };
        if (!response?.data?.success) throw new Error(response?.data?.message || 'Failed to waive penalty');
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false };
        }
        console.warn('[penaltyService] waivePenalty error:', error?.message || error);
        throw error.response?.data?.message || error.message || error;
    }
};

