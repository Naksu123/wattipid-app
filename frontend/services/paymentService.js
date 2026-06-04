import apiClient from './apiClient';

export const submitPayment = async (billingCycleId, roomId, amount, proofUrl, referenceNumber, paymentMethod = 'Cash', paymentDate = null) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'submitPayment',
            billingCycleId, 
            roomId, 
            amount, 
            proofUrl, 
            referenceNumber,
            paymentMethod,
            paymentDate
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('submitPayment error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const submitOfflinePayment = async (billingCycleId, roomId, amount) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'submitOfflinePayment',
            billingCycleId, 
            roomId, 
            amount
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('submitOfflinePayment error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const verifyPayment = async (paymentId, action, reason = null, actualAmount = null) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'verifyPayment',
            paymentId, 
            action_type: action, 
            reason,
            actual_amount: actualAmount
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        console.error('verifyPayment error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const getPaymentHistory = async (roomId = null) => {
    try {
        const response = await apiClient.post('/api.php', { 
            action: 'getPaymentHistory',
            roomId 
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data.data;
    } catch (error) {
        console.error('getPaymentHistory error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};

export const getPaymentWidgets = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getPaymentWidgets' });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data.data;
    } catch (error) {
        console.error('getPaymentWidgets error:', error);
        throw error.response?.data?.message || error.message || error;
    }
};
