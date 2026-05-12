import AsyncStorage from '@react-native-async-storage/async-storage';

const ENVIRONMENTS = {
  local: 'http://192.168.254.109/wattipid_backend',
  tunnel: 'https://graduate-ahead-lip-guidelines.trycloudflare.com/wattipid_backend', 
  hostinger: 'https://YOUR_DOMAIN/wattipid_backend', 
  production: 'https://wattipid-backend.infinityfreeapp.com',
};

const STORAGE_KEY = '@wattipid_api_env';

// Active: Local mode for XAMPP
export const API_URL = ENVIRONMENTS.local;

export async function getBaseUrl() {
  // Hardcode for troubleshooting to ensure phone uses the correct PC IP
  return API_URL;
}

export async function setApiEnvironment(env) {
  if (ENVIRONMENTS[env]) {
    await AsyncStorage.setItem(STORAGE_KEY, env);
    return true;
  }
  return false;
}

export async function getCurrentEnv() {
  return (await AsyncStorage.getItem(STORAGE_KEY)) || 'local';
}

export { ENVIRONMENTS };
