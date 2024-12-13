import { extractDomain } from '../utils/browserUtils.js';

class LimitEnforcer {
  constructor() {
    this.limitManager = new LimitManager();
    this.timeTracker = {};
    this.initializeEnforcer();
  }

  async initializeEnforcer() {
    // Initialize daily tracking data
    this.timeTracker = {
      daily: {},
      weekly: {},
      lastReset: new Date().toISOString()
    };

    // Set up event listeners
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        this.handleUrlChange(tab);
      }
    });

    // Set up periodic checks
    this.setupPeriodicChecks();
  }

  setupPeriodicChecks() {
    // Check limits every minute
    setInterval(() => this.checkAllLimits(), 60000);

    // Reset daily stats at midnight
    chrome.alarms.create('dailyReset', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60
    });

    // Reset weekly stats on Sunday midnight
    chrome.alarms.create('weeklyReset', {
      when: this.getNextWeeklyReset(),
      periodInMinutes: 7 * 24 * 60
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'dailyReset') {
        this.resetDailyStats();
      } else if (alarm.name === 'weeklyReset') {
        this.resetWeeklyStats();
      }
    });
  }

  async handleTabActivated(activeInfo) {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      await this.trackTime(domain);
    }
  }

  async handleUrlChange(tab) {
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      await this.trackTime(domain);
    }
  }

  async trackTime(domain) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Initialize tracking data if needed
    if (!this.timeTracker.daily[currentDate]) {
      this.timeTracker.daily[currentDate] = {};
    }
    if (!this.timeTracker.daily[currentDate][domain]) {
      this.timeTracker.daily[currentDate][domain] = 0;
    }

    // Update time spent
    this.timeTracker.daily[currentDate][domain] += 1;

    // Check if limit is exceeded
    await this.checkLimit(domain);
  }

  async checkLimit(domain) {
    const limit = await this.limitManager.getLimit(domain);
    if (!limit || !limit.enabled) return;

    const currentDate = new Date().toISOString().split('T')[0];
    const dailyTime = this.timeTracker.daily[currentDate]?.[domain] || 0;
    
    // Check daily limit
    if (dailyTime >= limit.dailyLimit) {
      await this.enforceLimitReached(domain, 'daily');
    }
    // Check weekly limit
    const weeklyTime = this.calculateWeeklyTime(domain);
    if (weeklyTime >= limit.weeklyLimit) {
      await this.enforceLimitReached(domain, 'weekly');
    }
  }

  async checkAllLimits() {
    const limits = await this.limitManager.getAllLimits();
    for (const [domain, limit] of Object.entries(limits)) {
      if (limit.enabled) {
        await this.checkLimit(domain);
      }
    }
  }

  async enforceLimitReached(domain, type) {
    // Send notification
    chrome.notifications.create(`${type}-limit-${domain}`, {
      type: 'basic',
      iconUrl: 'icons/warning.png',
      title: 'Time Limit Reached',
      message: `You've reached your ${type} time limit for ${domain}`,
      priority: 2
    });

    // Find and block active tabs for this domain
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (extractDomain(tab.url) === domain) {
        await chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL(`blocked.html?domain=${domain}&type=${type}`)
        });
      }
    }
  }

  calculateWeeklyTime(domain) {
    const dates = Object.keys(this.timeTracker.daily);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));

    return dates.reduce((total, date) => {
      if (new Date(date) >= weekStart) {
        return total + (this.timeTracker.daily[date]?.[domain] || 0);
      }
      return total;
    }, 0);
  }

  getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  getNextWeeklyReset() {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday.getTime();
  }

  resetDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    this.timeTracker.daily[today] = {};
  }

  resetWeeklyStats() {
    const today = new Date().toISOString().split('T')[0];
    this.timeTracker.daily = {
      [today]: {}
    };
  }
}

export default LimitEnforcer;
