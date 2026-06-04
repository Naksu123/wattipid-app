import React, { createContext, useState, useContext, useEffect } from 'react';
import Storage from '../services/storage';
import apiClient, { setIsLoggingOut } from '../services/apiClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const authData = await Storage.getObject('user_data');
      if (authData) {
        setUser(authData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load auth data', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api.php?action=login', { email, password });
      
      if (response.data.success) {
        // 1. Force a clean slate to prevent session bleeding
        setUser(null);
        await Storage.deleteItem('user_data');
        
        const { user: userData, token, refreshToken } = response.data.data;
        
        // 2. Commit new secure session
        await Storage.setItem('user_token', token);
        await Storage.setItem('refresh_token', refreshToken);
        await Storage.setObject('user_data', userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        const requiresTerms = response.data.data.requires_terms_acceptance || false;
        return { success: true, user: userData, requiresTerms };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Cannot reach server.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'tenant', extraCode = null, termsVersionId = null, ipAddress = null, deviceInfo = null) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api.php?action=register', { 
        name, email, password, role, code: extraCode, terms_version_id: termsVersionId, ip_address: ipAddress, device_info: deviceInfo 
      });
      
      if (response.data.success) {
        // Registration success often sends tokens directly
        if (response.data.data?.token) {
          const { user: userData, token, refreshToken } = response.data.data;
          await Storage.setItem('user_token', token);
          await Storage.setItem('refresh_token', refreshToken);
          await Storage.setObject('user_data', userData);
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/api.php?action=logout');
    } catch (e) {
      console.log('Logout API error', e);
    } finally {
      await Storage.deleteItem('user_token');
      await Storage.deleteItem('refresh_token');
      await Storage.deleteItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
      // Reset flag after a short delay to let any in-flight requests resolve
      setTimeout(() => setIsLoggingOut(false), 2000);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await apiClient.post('/api.php?action=verifyOTP', { 
        email, code, type: 'verification' 
      });
      
      if (response.data.success && response.data.data?.token) {
        const { user: userData, token, refreshToken } = response.data.data;
        await Storage.setItem('user_token', token);
        await Storage.setItem('refresh_token', refreshToken);
        await Storage.setObject('user_data', userData);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return response.data;
    } catch (error) {
      return { success: false, message: 'Verification failed' };
    }
  };

  const updateProfile = async (name, email) => {
    try {
      const response = await apiClient.post('/api.php?action=updateUserProfile', { name, email });
      if (response.data.success) {
        const updatedUser = { ...user, name, email };
        await Storage.setObject('user_data', updatedUser);
        setUser(updatedUser);
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.post('/api.php?action=changePassword', { 
        currentPassword, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Password update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoading: loading, 
      isAuthenticated, 
      login, 
      logout, 
      register, 
      verifyEmail,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
