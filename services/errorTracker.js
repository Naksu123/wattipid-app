/**
 * Global Error Tracker for Wattipid
 * Centralizes all error logging and provides fix suggestions.
 */

class ErrorTracker {
  static logs = [];

  /**
   * Log an error with context and optional suggestion.
   */
  static log(source, message, originalError = null, suggestion = '') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      source,
      message,
      error: originalError?.message || String(originalError),
      suggestion
    };

    this.logs.push(logEntry);

    // Development logging
    if (__DEV__) {
      console.group(`🔴 Error [${source}]`);
      console.error(`Message: ${message}`);
      if (originalError) console.error('Original Error:', originalError);
      if (suggestion) console.info(`💡 Suggestion: ${suggestion}`);
      console.groupEnd();
    }

    // In a real app, you would send this to a service like Sentry or LogRocket here.
  }

  /**
   * Get all logs for debugging screen.
   */
  static getLogs() {
    return [...this.logs].reverse();
  }

  /**
   * Clear logs.
   */
  static clear() {
    this.logs = [];
  }
}

export default ErrorTracker;
