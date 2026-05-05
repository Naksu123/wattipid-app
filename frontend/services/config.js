import AsyncStorage from '@react-native-async-storage/async-storage';

const ENVIRONMENTS = {
  local: 'http://192.168.254.109/wattipid_backend',
  production: 'https://wattipid-backend.infinityfreeapp.com', // Placeholder - update with your actual Hostinger URL
};

const STORAGE_KEY = '@wattipid_api_env';

export async function getBaseUrl() {
  // Hardcode for troubleshooting to ensure phone uses the correct PC IP
  return ENVIRONMENTS.local;
  
  // const saved = await AsyncStorage.getItem(STORAGE_KEY);
  // return ENVIRONMENTS[saved] || ENVIRONMENTS.local;
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
