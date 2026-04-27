export const API_BASE_URL = 'http://172.20.10.12/wattipid_backend';

export async function apiCall(action, data = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action, ...data })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  } catch (error) {
    console.error(`API Error [${action}]:`, error);
    return null;
  }
}
