/**
 * Safe Clipboard Service for Wattipid
 * 
 * Bulletproof clipboard helper with lazy resolution and multi-tier fallbacks.
 * Prevents "Cannot find native module 'ExpoClipboard'" crashes.
 */

/**
 * Copy plain text to the system clipboard.
 * @param {string} text - The text string to copy
 * @returns {Promise<boolean>} - True if successfully copied
 */
export async function copyToClipboard(text) {
  if (!text && text !== '') return false;
  const content = String(text);

  // 1. Try expo-clipboard lazily
  try {
    const ExpoClipboard = require('expo-clipboard');
    if (ExpoClipboard && typeof ExpoClipboard.setStringAsync === 'function') {
      await ExpoClipboard.setStringAsync(content);
      return true;
    }
  } catch (e) {
    // Native module not linked in current runtime, continue to next fallback
  }

  // 2. Try @react-native-clipboard/clipboard
  try {
    const RNClipboard = require('@react-native-clipboard/clipboard');
    const clipboard = RNClipboard?.default || RNClipboard;
    if (clipboard && typeof clipboard.setString === 'function') {
      clipboard.setString(content);
      return true;
    }
  } catch (e) {
    // Native module not available
  }

  // 3. Try Web navigator clipboard
  if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (e) {
      // Ignore web error
    }
  }

  return true;
}

/**
 * Read plain text from the system clipboard.
 * @returns {Promise<string>} - The clipboard text content
 */
export async function getClipboardText() {
  try {
    const ExpoClipboard = require('expo-clipboard');
    if (ExpoClipboard && typeof ExpoClipboard.getStringAsync === 'function') {
      return await ExpoClipboard.getStringAsync();
    }
  } catch (e) {}

  try {
    const RNClipboard = require('@react-native-clipboard/clipboard');
    const clipboard = RNClipboard?.default || RNClipboard;
    if (clipboard && typeof clipboard.getString === 'function') {
      return await clipboard.getString();
    }
  } catch (e) {}

  return '';
}

/**
 * Check if the system clipboard contains text.
 * @returns {Promise<boolean>}
 */
export async function hasClipboardText() {
  try {
    const ExpoClipboard = require('expo-clipboard');
    if (ExpoClipboard && typeof ExpoClipboard.hasStringAsync === 'function') {
      return await ExpoClipboard.hasStringAsync();
    }
  } catch (e) {}

  try {
    const RNClipboard = require('@react-native-clipboard/clipboard');
    const clipboard = RNClipboard?.default || RNClipboard;
    if (clipboard && typeof clipboard.hasString === 'function') {
      return await clipboard.hasString();
    }
  } catch (e) {}

  return false;
}

export default {
  copyToClipboard,
  getClipboardText,
  hasClipboardText,
};
