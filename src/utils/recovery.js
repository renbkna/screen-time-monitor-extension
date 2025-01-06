/**
 * Recovery utilities for handling error states and data recovery
 */

import { StorageError, NetworkError } from './error-handling.js';

// Default state values
const DEFAULT_STATE = {
  settings: {
    limits: {},
    blocking: {},
    focusMode: {
      enabled: false,
      duration: 25,
      blockedSites: []
    }
  },
  stats: {
    daily: {},
    weekly: {},
    monthly: {}
  },
  cache: {}
};

/**
 * Create a backup of current state
 * @param {Object} state - Current state to backup
 * @returns {Promise<void>}
 */
export async function backupState(state) {
  try {
    const backup = {
      timestamp: Date.now(),
      data: state
    };

    await chrome.storage.local.set({ backup });
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

/**
 * Restore state from backup
 * @returns {Promise<Object>} Restored state or default state
 */
export async function restoreFromBackup() {
  try {
    const { backup } = await chrome.storage.local.get('backup');
    if (backup && backup.data) {
      return backup.data;
    }
  } catch (error) {
    console.error('Error restoring from backup:', error);
  }

  return { ...DEFAULT_STATE };
}

/**
 * Validate and repair data structure
 * @param {Object} data - Data to validate and repair
 * @returns {Object} Repaired data
 */
export function repairDataStructure(data) {
  const repaired = { ...DEFAULT_STATE };

  // Safely copy existing data
  if (data && typeof data === 'object') {
    for (const [key, defaultValue] of Object.entries(DEFAULT_STATE)) {
      if (data[key] && typeof data[key] === typeof defaultValue) {
        repaired[key] = data[key];
      }
    }
  }

  return repaired;
}

/**
 * Check data integrity
 * @param {Object} data - Data to check
 * @returns {boolean} Whether data is valid
 */
export function checkDataIntegrity(data) {
  if (!data || typeof data !== 'object') return false;

  // Check required top-level properties
  const requiredProps = ['settings', 'stats'];
  for (const prop of requiredProps) {
    if (!data[prop] || typeof data[prop] !== 'object') {
      return false;
    }
  }

  // Check settings structure
  const settings = data.settings;
  if (!settings.limits || !settings.blocking || !settings.focusMode) {
    return false;
  }

  // Check stats structure
  const stats = data.stats;
  if (!stats.daily || !stats.weekly || !stats.monthly) {
    return false;
  }

  return true;
}

/**
 * Recover corrupted data
 * @param {Object} data - Corrupted data
 * @returns {Object} Recovered data
 */
export function recoverCorruptedData(data) {
  const recovered = { ...DEFAULT_STATE };

  try {
    // Attempt to recover settings
    if (data.settings) {
      recovered.settings = {
        ...DEFAULT_STATE.settings,
        ...data.settings
      };
    }

    // Attempt to recover stats
    if (data.stats) {
      recovered.stats = {
        daily: data.stats.daily || {},
        weekly: data.stats.weekly || {},
        monthly: data.stats.monthly || {}
      };
    }

    // Validate recovered data
    if (!checkDataIntegrity(recovered)) {
      throw new Error('Failed to recover data');
    }

  } catch (error) {
    console.error('Error recovering data:', error);
    return { ...DEFAULT_STATE };
  }

  return recovered;
}

/**
 * Clean up invalid data
 * @param {Object} data - Data to clean
 * @returns {Object} Cleaned data
 */
export function cleanInvalidData(data) {
  const cleaned = { ...data };

  // Clean up settings
  if (cleaned.settings) {
    // Remove invalid limits
    Object.entries(cleaned.settings.limits).forEach(([domain, limit]) => {
      if (!limit || typeof limit !== 'object') {
        delete cleaned.settings.limits[domain];
      }
    });

    // Remove invalid blocking rules
    Object.entries(cleaned.settings.blocking).forEach(([domain, rule]) => {
      if (!rule || typeof rule !== 'object') {
        delete cleaned.settings.blocking[domain];
      }
    });
  }

  // Clean up stats
  if (cleaned.stats) {
    // Remove invalid daily stats
    Object.entries(cleaned.stats.daily).forEach(([date, stats]) => {
      if (!stats || typeof stats !== 'object') {
        delete cleaned.stats.daily[date];
      }
    });

    // Remove stats with invalid dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    Object.keys(cleaned.stats.daily).forEach(date => {
      if (!dateRegex.test(date)) {
        delete cleaned.stats.daily[date];
      }
    });
  }

  return cleaned;
}

/**
 * Initialize recovery system
 */
export function initializeRecovery() {
  // Create periodic backups
  setInterval(async () => {
    try {
      const state = await chrome.storage.local.get(null);
      await backupState(state);
    } catch (error) {
      console.error('Error in periodic backup:', error);
    }
  }, 30 * 60 * 1000); // Every 30 minutes

  // Listen for storage errors
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      try {
        const state = await restoreFromBackup();
        await chrome.storage.local.set(state);
      } catch (error) {
        console.error('Error in storage recovery:', error);
      }
    }
  });
}
