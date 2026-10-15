import apiClient, { getIsLoggingOut } from './apiClient';

/**
 * Service to manage Dormitory Business Information & Official Documents
 */

export const getDormitoryBusinessInfo = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getDormitoryBusinessInfo' });
        if (response?.data?.isLoggingOut) return null;
        if (!response?.data?.success) {
            return null;
        }
        return response.data.data || null;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.message === 'Session expired' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return null;
        }
        console.warn('[dormitoryService] getDormitoryBusinessInfo error:', error?.message || error);
        return null;
    }
};

export const updateDormitoryBusinessInfo = async (infoData) => {
    try {
        const response = await apiClient.post('/api.php', {
            action: 'updateDormitoryBusinessInfo',
            ...infoData,
        });
        if (response?.data?.isLoggingOut) return { success: false, message: 'Logging out' };
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || 'Failed to update dormitory business information');
        }
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false, message: 'Logging out' };
        }
        const message = error.response?.data?.message || error.message || 'Failed to update business information';
        console.warn('[dormitoryService] updateDormitoryBusinessInfo error:', message);
        throw new Error(message);
    }
};

export const getDormitoryDocuments = async () => {
    try {
        const response = await apiClient.post('/api.php', { action: 'getDormitoryDocuments' });
        if (response?.data?.isLoggingOut) return [];
        if (!response?.data?.success) {
            return [];
        }
        return response.data.data || [];
    } catch (error) {
        if (error?.message === 'Logging out' || error?.message === 'Session expired' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return [];
        }
        console.warn('[dormitoryService] getDormitoryDocuments error:', error?.message || error);
        return [];
    }
};

export const saveDormitoryDocument = async (docData) => {
    try {
        const response = await apiClient.post('/api.php', {
            action: 'saveDormitoryDocument',
            ...docData,
        });
        if (response?.data?.isLoggingOut) return { success: false, message: 'Logging out' };
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || 'Failed to save document');
        }
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false, message: 'Logging out' };
        }
        const message = error.response?.data?.message || error.message || 'Failed to save document';
        console.warn('[dormitoryService] saveDormitoryDocument error:', message);
        throw new Error(message);
    }
};

export const deleteDormitoryDocument = async (id) => {
    try {
        const response = await apiClient.post('/api.php', {
            action: 'deleteDormitoryDocument',
            id,
        });
        if (response?.data?.isLoggingOut) return { success: false, message: 'Logging out' };
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || 'Failed to delete document');
        }
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false, message: 'Logging out' };
        }
        const message = error.response?.data?.message || error.message || 'Failed to delete document';
        console.warn('[dormitoryService] deleteDormitoryDocument error:', message);
        throw new Error(message);
    }
};

export const verifyDormitoryDocument = async (id, verificationStatus, verificationNotes = null) => {
    try {
        const response = await apiClient.post('/api.php', {
            action: 'verifyDormitoryDocument',
            id,
            verification_status: verificationStatus,
            verification_notes: verificationNotes,
        });
        if (response?.data?.isLoggingOut) return { success: false, message: 'Logging out' };
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || 'Failed to update verification status');
        }
        return response.data;
    } catch (error) {
        if (error?.message === 'Logging out' || error?.name === 'CanceledError' || getIsLoggingOut()) {
            return { success: false, message: 'Logging out' };
        }
        const message = error.response?.data?.message || error.message || 'Failed to update verification';
        console.warn('[dormitoryService] verifyDormitoryDocument error:', message);
        throw new Error(message);
    }
};
