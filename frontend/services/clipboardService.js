/**
 * Clipboard Service for Wattipid
 * 
 * Modern, supported replacement for deprecated React Native core Clipboard.
 * Uses expo-clipboard with fallbacks and haptic feedback.
 */

let ExpoClipboard = null;
try {
  ExpoClipboard = require('expo-clipboard');
} catch (e) {
  console.warn('[ClipboardService] expo-clipboard not available:', e?.message || e);
}

/**
 * Copy plain text to the system clipboard.
 * @param {string} text - The text string to copy
 * @returns {Promise<boolean>} - True if successfully copied
 */
export async function copyToClipboard(text) {
  if (!text && text !== '') return false;
  const content = String(text);
  
  if (ExpoClipboard?.setStringAsync) {
    try {
      await ExpoClipboard.setStringAsync(content);
      return true;
    } catch (e) {
      console.warn('[ClipboardService] Failed to copy text with expo-clipboard:', e?.message || e);
    }
  }

  return false;
}

/**
 * Read plain text from the system clipboard.
 * @returns {Promise<string>} - The clipboard text content
 */
export async function getClipboardText() {
  if (ExpoClipboard?.getStringAsync) {
    try {
      return await ExpoClipboard.getStringAsync();
    } catch (e) {
      console.warn('[ClipboardService] Failed to read clipboard:', e?.message || e);
    }
  }
  return '';
}

/**
 * Check if the system clipboard contains text.
 * @returns {Promise<boolean>}
 */
export async function hasClipboardText() {
  if (ExpoClipboard?.hasStringAsync) {
    try {
      return await ExpoClipboard.hasStringAsync();
    } catch (e) {
      console.warn('[ClipboardService] Failed to check clipboard:', e?.message || e);
    }
  }
  return false;
}

export default {
  copyToClipboard,
  getClipboardText,
  hasClipboardText,
};
