import apiClient from './apiClient';

export const getActiveTerms = async () => {
    try {
        const response = await apiClient.get('/api.php?action=getActiveTerms');
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Network error' };
    }
};

export const acceptTerms = async (versionId, ipAddress = null, deviceInfo = null) => {
    try {
        const response = await apiClient.post('/api.php?action=acceptTerms', {
            version_id: versionId,
            ip_address: ipAddress,
            device_info: deviceInfo
        });
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Network error' };
    }
};

export const checkTermsAcceptance = async () => {
    try {
        const response = await apiClient.get('/api.php?action=checkTermsAcceptance');
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Network error' };
    }
};
