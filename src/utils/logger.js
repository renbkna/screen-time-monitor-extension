// Logging utility
export const logger = {
  info: (message, ...args) => {
    console.log(`[Screen Time Monitor] ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`[Screen Time Monitor] Error: ${message}`, ...args);
  },

  warn: (message, ...args) => {
    console.warn(`[Screen Time Monitor] Warning: ${message}`, ...args);
  }
};
