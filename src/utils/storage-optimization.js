/**
 * Storage optimization utilities for the Screen Time Monitor extension
 */

import { getDataSize } from './performance';

// Constants
const MAX_STORAGE_DAYS = 90; // Keep data for 90 days
const STORAGE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of quota

/**
 * Get current storage usage information
 * @returns {Promise<{used: number, total: number, percentage: number}>}
 */
export const getStorageUsage = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      const quota = chrome.storage.local.QUOTA_BYTES;
      resolve({
        used: bytesInUse,
        total: quota,
        percentage: (bytesInUse / quota) * 100
      });
    });
  });
};

/**
 * Clean up old data from storage
 * @returns {Promise<void>}
 */
export const cleanupOldData = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_STORAGE_DAYS);

  // Get all stored data
  const data = await new Promise((resolve) => {
    chrome.storage.local.get(null, resolve);
  });

  // Find keys of old data to remove
  const keysToRemove = [];
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('dailyStats_')) {
      const dateStr = key.split('_')[1];
      const date = new Date(dateStr);
      if (date < cutoffDate) {
        keysToRemove.push(key);
      }
    }
  }

  // Remove old data
  if (keysToRemove.length > 0) {
    await new Promise((resolve) => {
      chrome.storage.local.remove(keysToRemove, resolve);
    });
  }
};

/**
 * Check if storage usage is above warning threshold
 * @returns {Promise<boolean>}
 */
export const isStorageNearLimit = async () => {
  const { percentage } = await getStorageUsage();
  return percentage > (STORAGE_WARNING_THRESHOLD * 100);
};

/**
 * Optimize data before storing
 * @param {Object} data - Data to optimize
 * @returns {Object} Optimized data
 */
export const optimizeDataForStorage = (data) => {
  // Remove unnecessary precision from numbers
  const optimized = JSON.parse(JSON.stringify(data, (key, value) => {
    if (typeof value === 'number') {
      // Round to 2 decimal places for percentages and times
      return Number(value.toFixed(2));
    }
    return value;
  }));

  return optimized;
};

/**
 * Compact storage by removing empty or null values
 * @param {Object} data - Data to compact
 * @returns {Object} Compacted data
 */
export const compactStorageData = (data) => {
  const compacted = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const compactedValue = compactStorageData(value);
        if (Object.keys(compactedValue).length > 0) {
          compacted[key] = compactedValue;
        }
      } else {
        compacted[key] = value;
      }
    }
  }

  return compacted;
};

/**
 * Monitor storage usage and trigger cleanup if needed
 */
export const setupStorageMonitoring = () => {
  const checkStorage = async () => {
    const isNearLimit = await isStorageNearLimit();
    if (isNearLimit) {
      await cleanupOldData();
    }
  };

  // Check storage usage periodically
  setInterval(checkStorage, STORAGE_CLEANUP_INTERVAL);

  // Initial check
  checkStorage();
};

// Start storage monitoring when the module is imported
setupStorageMonitoring();
