import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRoomByTenantCode,
  updateRoomStatus,
} from '../services/database';
import { sendVerificationCode, verifyCode, getLastMockCode } from '../services/emailService';

import { getBaseUrl } from '../services/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  // Check for stored token on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const result = await response.json();

      if (!result.success) {
        return { success: false, message: result.message };
      }
      
      const userData = result.data;
      
      await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@auth_token', result.authToken);

      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, message: 'Network error. Make sure your API URL is correct.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password, role, tenantCode = null) => {
    setIsLoading(true);
    try {
      let roomId = null;
      if (role === 'tenant') {
        if (!tenantCode) {
          return { success: false, message: 'Tenant access code is required' };
        }
        // Validate tenant code locally (or on API if migrated)
        const room = await getRoomByTenantCode(tenantCode);
        if (!room) {
          return { success: false, message: 'Invalid tenant access code' };
        }
        if (room.status === 'active') {
          return { success: false, message: 'This room is already occupied' };
        }
        roomId = room.room_id;
      }

      // Instead of storing locally, we send to the remote API
      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, roomId, tenantCode }),
      });
      
      const result = await response.json();

      if (!result.success) {
        return { success: false, message: result.message };
      }

      const userData = result.user;
      
      // Save session to device
      await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Update local room status
      if (roomId) {
        await updateRoomStatus(roomId, 'occupied', name, new Date().toISOString().split('T')[0]);
      }
      
      return { success: true, user: userData };

    } catch (error) {
      return { success: false, message: 'Network error connecting to Hostinger backend.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    // Left as legacy/placeholder. Email verification is handled on API now or skipped.
    return { success: true, message: 'Verified' };
  };

  const resendVerificationCode = async (email) => {
    setIsLoading(true);
    try {
      const emailResult = await sendVerificationCode(email);
      if (emailResult.success) {
        return {
          success: true,
          message: 'New verification code sent',
          mockCode: emailResult.mockCode,
        };
      }
      return { success: false, message: 'Failed to send verification code' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@auth_user');
    await AsyncStorage.removeItem('@auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setPendingRegistration(null);
  };

  const updateProfile = async (name, email) => {
    if (!user) return { success: false };
    try {
      // In a real app, send update to Hostinger API here
      // For now, just update local state session
      const updatedUser = { ...user, name, email };
      await AsyncStorage.setItem('@auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        pendingRegistration,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        logout,
        updateProfile,
        getLastMockCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
