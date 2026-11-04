import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DeviceEventEmitter, NativeModules } from 'react-native';

// Current active development machine IP (updated for your current hotspot)
const FALLBACK_LOCAL_IP = '172.20.10.12';
const STORAGE_KEY = '@wattipid_api_env';
const CUSTOM_IP_KEY = '@wattipid_custom_local_ip';

/**
 * Dynamically extract development server host IP from all available Expo / React Native sources.
 * In development mode, React Native downloads the JS bundle from Metro,
 * so NativeModules.SourceCode.scriptURL and Expo debugger hosts always hold the active PC IP.
 */
export function getExpoDevHost() {
  try {
    // 1. NativeModules SourceCode scriptURL (Most reliable in React Native development)
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }

    // 2. Constants linkingUri (e.g. exp://172.20.10.12:8081)
    if (Constants?.linkingUri) {
      const match = Constants.linkingUri.match(/:\/\/(?:www\.)?([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }

    // 3. Constants experienceUrl
    if (Constants?.experienceUrl) {
      const match = Constants.experienceUrl.match(/:\/\/(?:www\.)?([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }

    // 4. Constants expoGoConfig
    if (Constants?.expoGoConfig?.debuggerHost) {
      const ip = Constants.expoGoConfig.debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // 5. Constants expoConfig hostUri
    if (Constants?.expoConfig?.hostUri) {
      const ip = Constants.expoConfig.hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // 6. Constants manifest2 / manifest debuggerHost
    const manifestDebugger = Constants?.manifest2?.extra?.expoGo?.debuggerHost || 
                             Constants?.manifest2?.extra?.expoClient?.hostUri ||
                             Constants?.manifest?.debuggerHost;
    if (manifestDebugger) {
      const ip = manifestDebugger.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {}
  return null;
}

/**
 * Resolves the active local URL dynamically.
 * Priority:
 * 1. Saved custom IP in AsyncStorage (if user manually set one)
 * 2. Auto-detected IP from Expo Metro bundler / scriptURL (if on Expo)
 * 3. Primary fallback IP (172.20.10.12)
 */
export function resolveLocalUrl(customIp = null) {
  if (customIp) {
    return `http://${customIp}/wattipid_backend`;
  }
  const detected = getExpoDevHost();
  const host = detected || FALLBACK_LOCAL_IP;
  return `http://${host}/wattipid_backend`;
}

// Hostinger Cloud Server configuration
const HOSTINGER_URL_KEY = '@wattipid_hostinger_url';
// When you deploy your backend to Hostinger, put your live domain here
// (e.g. 'https://yourdomain.com/wattipid_backend' or 'https://api.yourdomain.com')
export const DEFAULT_HOSTINGER_URL = 'https://YOUR_HOSTINGER_DOMAIN/wattipid_backend';

const ENVIRONMENTS = {
  local: resolveLocalUrl(),
  hostinger: DEFAULT_HOSTINGER_URL,
};

/**
 * Returns true if a Hostinger cloud domain has been deployed and configured.
 */
export function isHostingerConfigured(url = null) {
  const target = url || ENVIRONMENTS.hostinger;
  return Boolean(
    target &&
    typeof target === 'string' &&
    !target.includes('YOUR_HOSTINGER_DOMAIN') &&
    (target.startsWith('https://') || target.startsWith('http://'))
  );
}

/**
 * Update the Hostinger Cloud Server URL in storage and runtime memory.
 */
export async function setHostingerUrl(url) {
  if (url && typeof url === 'string') {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    await AsyncStorage.setItem(HOSTINGER_URL_KEY, clean);
    ENVIRONMENTS.hostinger = clean;
    if (activeBaseUrl === ENVIRONMENTS.hostinger) {
      activeBaseUrl = clean;
      API_URL = clean;
      DeviceEventEmitter.emit('apiBaseUrlChanged', clean);
    }
    console.log('[NETWORK] Hostinger cloud URL updated to:', clean);
    return clean;
  }
  return null;
}

let activeBaseUrl = ENVIRONMENTS.local;
export let API_URL = activeBaseUrl;

console.log(' [NETWORK] Active backend URL configured:', activeBaseUrl);

/**
 * Returns the currently active Base URL.
 * Automatically updates the local URL if the network IP changed in Expo.
 */
export async function getBaseUrl() {
  try {
    let savedEnv = (await AsyncStorage.getItem(STORAGE_KEY)) || 'local';
    const customIp = await AsyncStorage.getItem(CUSTOM_IP_KEY);
    const savedHostinger = await AsyncStorage.getItem(HOSTINGER_URL_KEY);
    if (savedHostinger) {
      ENVIRONMENTS.hostinger = savedHostinger;
    }

    // Refresh local environment URL dynamically in case network changed
    const dynamicLocal = resolveLocalUrl(customIp);
    if (ENVIRONMENTS.local !== dynamicLocal) {
      ENVIRONMENTS.local = dynamicLocal;
      if (savedEnv === 'local') {
        activeBaseUrl = dynamicLocal;
        API_URL = dynamicLocal;
        DeviceEventEmitter.emit('apiBaseUrlChanged', dynamicLocal);
        console.log('[NETWORK] Network change detected. Switched API URL to:', dynamicLocal);
      }
    }

    if (savedEnv === 'hostinger' && isHostingerConfigured()) {
      activeBaseUrl = ENVIRONMENTS.hostinger;
      API_URL = activeBaseUrl;
    } else {
      activeBaseUrl = dynamicLocal;
      API_URL = dynamicLocal;
    }
  } catch {}
  return activeBaseUrl;
}

/**
 * Synchronous getter for current in-memory active URL.
 * Checks Expo host dynamically.
 */
export function getActiveBaseUrl() {
  const detected = getExpoDevHost();
  if (detected) {
    const currentHost = activeBaseUrl.match(/https?:\/\/([^:/]+)/)?.[1];
    if (currentHost && currentHost !== detected && activeBaseUrl.includes('/wattipid_backend')) {
      const updated = `http://${detected}/wattipid_backend`;
      ENVIRONMENTS.local = updated;
      activeBaseUrl = updated;
      API_URL = updated;
      DeviceEventEmitter.emit('apiBaseUrlChanged', updated);
    }
  }
  return activeBaseUrl;
}

/**
 * Switches the API environment dynamically and notifies listeners.
 */
export async function setApiEnvironment(env, customUrl = null) {
  let targetUrl = null;
  if (customUrl) {
    targetUrl = customUrl;
  } else if (ENVIRONMENTS[env]) {
    targetUrl = ENVIRONMENTS[env];
  }

  if (targetUrl) {
    activeBaseUrl = targetUrl;
    API_URL = targetUrl;
    await AsyncStorage.setItem(STORAGE_KEY, env);
    DeviceEventEmitter.emit('apiBaseUrlChanged', targetUrl);
    console.log(`[NETWORK] API Environment switched to: ${env} (${targetUrl})`);
    return true;
  }
  return false;
}

/**
 * Allows user to manually set a custom local server IP (e.g. '172.20.10.12' or '192.168.1.100').
 */
export async function setCustomLocalIp(ip) {
  if (ip && typeof ip === 'string') {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    await AsyncStorage.setItem(CUSTOM_IP_KEY, cleanIp);
    const newUrl = `http://${cleanIp}/wattipid_backend`;
    ENVIRONMENTS.local = newUrl;
    activeBaseUrl = newUrl;
    API_URL = newUrl;
    DeviceEventEmitter.emit('apiBaseUrlChanged', newUrl);
    console.log('[NETWORK] Custom local IP set to:', cleanIp, 'URL:', newUrl);
    return true;
  }
  return false;
}

/**
 * Get the currently configured environment key ('local', 'production', etc.)
 */
export async function getCurrentEnv() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) || 'local';
  } catch {
    return 'local';
  }
}

/**
 * Initializes the environment configuration from storage at startup.
 */
export async function initApiEnvironment() {
  try {
    const customIp = await AsyncStorage.getItem(CUSTOM_IP_KEY);
    const savedHostinger = await AsyncStorage.getItem(HOSTINGER_URL_KEY);
    if (savedHostinger) {
      ENVIRONMENTS.hostinger = savedHostinger;
    }

    const dynamicLocal = resolveLocalUrl(customIp);
    ENVIRONMENTS.local = dynamicLocal;

    const env = await getCurrentEnv();
    if (env === 'hostinger' && isHostingerConfigured()) {
      activeBaseUrl = ENVIRONMENTS.hostinger;
    } else {
      activeBaseUrl = dynamicLocal;
    }
    API_URL = activeBaseUrl;
    DeviceEventEmitter.emit('apiBaseUrlChanged', activeBaseUrl);
  } catch (err) {
    console.warn('[Config] Failed to initialize API environment from storage:', err.message);
  }
  return activeBaseUrl;
}

export { ENVIRONMENTS };
