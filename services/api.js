import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from './config';

export async function apiCall(action, data = {}) {
  try {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('@auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/api.php`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ action, ...data })
    });
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    } else {
      const text = await response.text();
      console.error('Non-JSON response from API:', text);
      return null;
    }
  } catch (error) {
    console.error(`API Error [${action}]:`, error);
    return null;
  }
}
