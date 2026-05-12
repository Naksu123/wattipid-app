import React, { useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../services/config';
import WattipidAuthContext from './AuthContextInstance';
import { getPushToken, registerPushTokenWithBackend } from '../services/notificationService';
import { apiCall } from '../services/api';

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Register push token in background
          getPushToken().then(token => {
            if (token) registerPushTokenWithBackend(token, parsedUser.id);
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Auth session load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();

    // Session monitor: Periodically check if token still exists (handles background 401s)
    const interval = setInterval(async () => {
      if (isAuthenticated) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s for tunnel stability
      
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ action: 'login', email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[Auth] Login non-JSON:", text.substring(0, 100));
        return { success: false, message: "Server returned an invalid response. Check XAMPP/Localtunnel." };
      }

      if (result.success) {
        const userData = result.data;
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
        await AsyncStorage.setItem('@auth_token', result.authToken);
        setUser(userData);
        setIsAuthenticated(true);
        getPushToken().then(token => { if (token) registerPushTokenWithBackend(token, userData.id); }).catch(() => {});
        return { success: true, user: userData };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: "Cannot reach server." };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password, role = 'tenant', extraCode = null) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ action: 'register', name, email, password, role, code: extraCode }),
      });
      const result = await response.json();
      if (result.success && result.authToken) {
        const userData = result.data;
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
        await AsyncStorage.setItem('@auth_token', result.authToken);
        setUser(userData);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      return { success: false, message: "Cannot reach server." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 1. Instantly stop all ongoing API requests
      const { cancelAllRequests } = require('../services/api');
      cancelAllRequests();

      // 2. Clear ALL sensitive storage keys
      const keysToClear = ['@auth_user', '@auth_token', '@rooms_cache', '@consumption_cache'];
      await AsyncStorage.multiRemove(keysToClear);

      // 3. Reset internal state immediately to trigger UI/Navigation reset
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // Fallback: Ensure state is reset even if storage fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  const verifyEmail = async (email, code) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ action: 'verifyOTP', email, code, type: 'verification' }),
      });
      const result = await response.json();
      return {
        success: result.success,
        message: result.message,
        status: result.data?.status || (result.success ? 'valid' : 'invalid'),
      };
    } catch (error) {
      return { success: false, message: 'Cannot reach server. Check your connection.', status: 'error' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ action: 'resendVerificationCode', email }),
      });
      const result = await response.json();
      return {
        success: result.success,
        message: result.message,
        mockCode: result.data?.mockCode || null,
      };
    } catch (error) {
      return { success: false, message: 'Cannot reach server.' };
    }
  };

  const performProfileUpdate = async (name, email) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ action: 'updateUserProfile', id: user.id, name, email }),
      });
      const result = await response.json();
      if (result.success) {
        const newUser = { ...user, name, email };
        await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));
        setUser(newUser);
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Cannot reach server.' };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const token = await AsyncStorage.getItem('@auth_token');
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: 'Cannot reach server.' };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WattipidAuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register, verifyEmail, resendVerificationCode, updateProfile: performProfileUpdate, changePassword }}>
      {children}
    </WattipidAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(WattipidAuthContext);
  if (!context) {

    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
