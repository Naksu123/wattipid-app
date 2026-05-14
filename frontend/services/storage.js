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

const Storage = {
  setItem: async (key, value) => {
    try {
      if (await isSecureUsable()) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[Storage] SetItem Error for ${key}:`, e.message);
    }
  },

  getItem: async (key) => {
    try {
      if (await isSecureUsable()) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage] GetItem Error for ${key}:`, e.message);
      return null;
    }
  },

  deleteItem: async (key) => {
    try {
      if (await isSecureUsable()) {
        await SecureStore.deleteItemAsync(key);
      } else {
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
