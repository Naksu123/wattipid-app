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
        if (!response.data.success) throw new Error(response.data.message);
        return response.data.data;
    } catch (error) {
        console.error('getOverdueAccounts error:', error);
        throw error;
    }
};

export const triggerPenaltyCalculation = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'triggerPenaltyCalculation' });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('triggerPenaltyCalculation error:', error);
        throw error;
    }
};
