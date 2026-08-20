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
        if (!response.data.success) throw new Error(response.data.message || "Backend returned an unsuccessful response");
        return response.data;
    } catch (error) {
        // 1. Detailed error logging as requested
        console.error('submitPayment error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            endpoint: '/api.php?action=submitPayment',
            message: error.message,
            responseData: error.response?.data,
            billingCycleId,
            roomId,
            amount
        });

        // 2. Handle Network Errors Gracefully
        if (!error.response && error.request) {
            throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
        }

        // 3. Fallback to API error message or generic server error
        if (error.response?.status >= 500) {
            throw new Error("The payment could not be processed right now. Please try again later.");
        }

        throw error.response?.data?.message || error.message || "An unexpected error occurred while processing your payment.";
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

export const sendManualReminder = async (roomId, tenantId, totalDue, daysOverdue) => {
    try {
        const response = await apiClient.post('/api.php', {
            action: 'send_manual_reminder',
            room_id: roomId,
            tenant_id: tenantId,
            total_due: totalDue,
            days_overdue: daysOverdue
        });
        if (!response.data.success) throw new Error(response.data.message);
        return response.data;
    } catch (error) {
        // Return a clean error string based on the backend response
        const errMessage = error.response?.data?.message || 'Something went wrong while sending the reminder. Please try again.';
        throw new Error(errMessage);
    }
};
