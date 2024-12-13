// Storage utility functions
export const StorageKeys = {
  DAILY_STATS: 'dailyStats',
  SETTINGS: 'settings'
};

export const storage = {
  get: async (key) => {
    try {
      return await chrome.storage.local.get(key);
    } catch (error) {
      console.error('Error getting data from storage:', error);
      return null;
    }
  },

  set: async (key, value) => {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('Error setting data in storage:', error);
      return false;
    }
  }
};
