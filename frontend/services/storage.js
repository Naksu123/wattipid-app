import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Smart Storage Bridge (Isolated Version)
 * 
 * This version uses "Lazy Loading" to prevent the 'Cannot find native module' crash.
 * It does NOT import expo-secure-store at the top level.
 */

let SecureStore = null;

// Attempt to load the native module safely
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  console.log('ℹ️ ExpoSecureStore native module not found. Falling back to AsyncStorage.');
}

/**
 * Checks if the native SecureStore is physically present and usable.
 */
const isSecureUsable = async () => {
  if (!SecureStore) return false;
  try {
    // Some versions of Expo Go have the module but it's not "available"
    return await SecureStore.isAvailableAsync();
  } catch (e) {
    return false;
  }
};

const SENSITIVE_KEYS = ['user_token', 'refresh_token'];
const isSensitive = (key) => SENSITIVE_KEYS.includes(key);

const Storage = {
  setItem: async (key, value) => {
    try {
      if (await isSecureUsable()) {
        await SecureStore.setItemAsync(key, value);
      } else {
        if (isSensitive(key)) {
          console.error(`[Security Block] Cannot save sensitive key '${key}' in unencrypted storage.`);
          return;
        }
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[Storage] SetItem Error for ${key}:`, e.message);
    }
  },

  getItem: async (key) => {
    try {
      if (await isSecureUsable()) {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) return val;
      }
      
      if (isSensitive(key)) {
        return null; // Never fallback to unencrypted storage for sensitive keys
      }
      
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] GetItem Error for ${key}:`, e.message);
      return null;
    }
  },

  deleteItem: async (key) => {
    try {
      if (await isSecureUsable()) {
        await SecureStore.deleteItemAsync(key);
      }
      
      if (!isSensitive(key)) {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[Storage] DeleteItem Error for ${key}:`, e.message);
    }
  },

  // Helper for objects
  setObject: async (key, value) => {
    await Storage.setItem(key, JSON.stringify(value));
  },

  getObject: async (key) => {
    const val = await Storage.getItem(key);
    try {
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  }
};

export default Storage;
