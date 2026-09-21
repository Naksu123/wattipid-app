import apiClient from './apiClient';

export const getPenaltySettings = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getPenaltySettings' });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data.data;
    } catch (error) {
        console.error('getPenaltySettings error:', error);
        throw error;
    }
};

export const updatePenaltySettings = async (settings) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'updatePenaltySettings',
            ...settings
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('updatePenaltySettings error:', error);
        throw error;
    }
};

export const getOverdueAccounts = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getOverdueAccounts' });
        if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch overdue accounts');
        return response.data.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Unknown error occurred while fetching overdue accounts';
        console.error('getOverdueAccounts error:', message, error.response?.data || error);
        throw new Error(message);
    }
};

export const triggerPenaltyCalculation = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'triggerPenaltyCalculation' });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('triggerPenaltyCalculation error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const waivePenalty = async (billingCycleId) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'waivePenalty',
            billing_cycle_id: billingCycleId
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('waivePenalty error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};
