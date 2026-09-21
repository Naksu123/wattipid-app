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
        const resData = response.data;
        if (!resData || !resData.success) {
            const serverMsg = resData?.message || (typeof resData === 'string' ? resData : null);
            const err = new Error(serverMsg || "Backend returned an unsuccessful response");
            err.responseData = resData;
            err.statusCode = response.status;
            throw err;
        }
        return resData;
    } catch (error) {
        const errorInfo = {
            status: error.statusCode || error.response?.status,
            statusText: error.response?.statusText,
            endpoint: '/api.php?action=submitPayment',
            message: error.message,
            responseData: error.responseData || error.response?.data,
            billingCycleId,
            roomId,
            amount
        };
        console.error('submitPayment error details:', errorInfo);

        // Handle Network Errors Gracefully
        if (!error.response && error.request) {
            throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
        }

        // Fallback to API error message or user-friendly message
        if (error.statusCode >= 500 || error.response?.status >= 500) {
            throw new Error(error.responseData?.message || error.response?.data?.message || "The payment could not be processed right now. Please try again later.");
        }

        throw error.responseData?.message || error.response?.data?.message || error.message || "Unable to submit payment. Please check your payment details and try again.";
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
