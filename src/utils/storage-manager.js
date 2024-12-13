// Storage keys
export const STORAGE_KEYS = {
  DAILY_STATS: 'dailyStats',
  SETTINGS: 'settings'
};

// Data structure versions for future migrations
export const SCHEMA_VERSION = 1;

// Default settings
const DEFAULT_SETTINGS = {
  idleTimeout: 60, // seconds
  updateInterval: 1, // seconds
  schemaVersion: SCHEMA_VERSION
};

/**
 * Storage Manager class for handling data persistence
 */
class StorageManager {
  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize storage with default values if needed
   */
  async initializeStorage() {
    const settings = await this.getSettings();
    if (!settings) {
      await this.setSettings(DEFAULT_SETTINGS);
    }

    const dailyStats = await this.getDailyStats();
    if (!dailyStats) {
      await this.setDailyStats({});
    }
  }

  /**
   * Get settings from storage
   */
  async getSettings() {
    const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return data[STORAGE_KEYS.SETTINGS];
  }

  /**
   * Save settings to storage
   */
  async setSettings(settings) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: settings
    });
  }

  /**
   * Get all daily statistics
   */
  async getDailyStats() {
    const data = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
    return data[STORAGE_KEYS.DAILY_STATS] || {};
  }

  /**
   * Get statistics for a specific date
   */
  async getDayStats(date) {
    const dailyStats = await this.getDailyStats();
    return dailyStats[date] || {};
  }

  /**
   * Update statistics for a specific domain
   */
  async updateDomainStats(date, domain, timeSpent) {
    const dailyStats = await this.getDailyStats();
    
    if (!dailyStats[date]) {
      dailyStats[date] = {};
    }

    if (!dailyStats[date][domain]) {
      dailyStats[date][domain] = {
        totalTime: 0,
        visits: 0,
        lastVisit: Date.now()
      };
    }

    dailyStats[date][domain].totalTime += timeSpent;
    dailyStats[date][domain].visits += 1;
    dailyStats[date][domain].lastVisit = Date.now();

    await this.setDailyStats(dailyStats);
    return dailyStats[date][domain];
  }

  /**
   * Save all daily statistics
   */
  async setDailyStats(dailyStats) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.DAILY_STATS]: dailyStats
    });
  }

  /**
   * Clear old statistics (older than 30 days)
   */
  async clearOldStats() {
    const dailyStats = await this.getDailyStats();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredStats = Object.keys(dailyStats).reduce((acc, date) => {
      if (new Date(date) >= thirtyDaysAgo) {
        acc[date] = dailyStats[date];
      }
      return acc;
    }, {});

    await this.setDailyStats(filteredStats);
  }

  /**
   * Get summary statistics for a date range
   */
  async getStatsSummary(startDate, endDate) {
    const dailyStats = await this.getDailyStats();
    const summary = {
      totalTime: 0,
      totalVisits: 0,
      topSites: [],
      dateRange: { startDate, endDate }
    };

    // Aggregate stats within date range
    Object.keys(dailyStats)
      .filter(date => date >= startDate && date <= endDate)
      .forEach(date => {
        Object.keys(dailyStats[date]).forEach(domain => {
          const stats = dailyStats[date][domain];
          summary.totalTime += stats.totalTime;
          summary.totalVisits += stats.visits;
        });
      });

    // Calculate top sites
    const siteTotals = {};
    Object.keys(dailyStats)
      .filter(date => date >= startDate && date <= endDate)
      .forEach(date => {
        Object.keys(dailyStats[date]).forEach(domain => {
          if (!siteTotals[domain]) {
            siteTotals[domain] = {
              domain,
              totalTime: 0,
              visits: 0
            };
          }
          siteTotals[domain].totalTime += dailyStats[date][domain].totalTime;
          siteTotals[domain].visits += dailyStats[date][domain].visits;
        });
      });

    summary.topSites = Object.values(siteTotals)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    return summary;
  }
}

// Export a singleton instance
export const storageManager = new StorageManager();
