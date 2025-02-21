import LimitEnforcer from '../src/background/LimitEnforcer';
import { extractDomain } from '../src/utils/browserUtils';

describe('LimitEnforcer', () => {
  let limitEnforcer;
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome APIs
    mockChrome = {
      tabs: {
        onActivated: { addListener: jest.fn() },
        onUpdated: { addListener: jest.fn() },
        query: jest.fn(),
        update: jest.fn()
      },
      alarms: {
        create: jest.fn(),
        onAlarm: { addListener: jest.fn() }
      },
      notifications: {
        create: jest.fn()
      },
      runtime: {
        getURL: jest.fn()
      }
    };

    global.chrome = mockChrome;
    limitEnforcer = new LimitEnforcer();
  });

  describe('initialization', () => {
    it('should set up event listeners', () => {
      expect(mockChrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(mockChrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(mockChrome.alarms.create).toHaveBeenCalledTimes(2);
      expect(mockChrome.alarms.onAlarm.addListener).toHaveBeenCalled();
    });

    it('should initialize time tracker with correct structure', () => {
      expect(limitEnforcer.timeTracker).toHaveProperty('daily');
      expect(limitEnforcer.timeTracker).toHaveProperty('lastReset');
      expect(typeof limitEnforcer.timeTracker.lastReset).toBe('string');
    });
  });

  describe('time tracking', () => {
    it('should track active tab time', async () => {
      const testTab = { id: 1, url: 'https://example.com' };
      mockChrome.tabs.query.mockResolvedValue([testTab]);

      await limitEnforcer.handleTabActivated({ tabId: 1 });
      const domain = extractDomain(testTab.url);
      const currentDate = new Date().toISOString().split('T')[0];

      expect(
        limitEnforcer.timeTracker.daily[currentDate][domain]
      ).toBeDefined();
    });

    it('should handle URL changes', async () => {
      const testTab = { id: 1, url: 'https://example.com' };
      await limitEnforcer.handleUrlChange(testTab);

      const domain = extractDomain(testTab.url);
      const currentDate = new Date().toISOString().split('T')[0];

      expect(
        limitEnforcer.timeTracker.daily[currentDate][domain]
      ).toBeDefined();
    });
  });

  describe('limit enforcement', () => {
    beforeEach(() => {
      limitEnforcer.limitManager.getLimit = jest.fn();
    });

    it('should enforce daily limits', async () => {
      const domain = 'example.com';
      const limit = { dailyLimit: 30, weeklyLimit: 120, enabled: true };
      limitEnforcer.limitManager.getLimit.mockResolvedValue(limit);

      // Simulate exceeding daily limit
      const currentDate = new Date().toISOString().split('T')[0];
      limitEnforcer.timeTracker.daily[currentDate] = { [domain]: 31 };

      await limitEnforcer.checkLimit(domain);

      expect(mockChrome.notifications.create).toHaveBeenCalled();
      expect(mockChrome.tabs.query).toHaveBeenCalled();
    });

    it('should not enforce disabled limits', async () => {
      const domain = 'example.com';
      const limit = { dailyLimit: 30, weeklyLimit: 120, enabled: false };
      limitEnforcer.limitManager.getLimit.mockResolvedValue(limit);

      await limitEnforcer.checkLimit(domain);

      expect(mockChrome.notifications.create).not.toHaveBeenCalled();
      expect(mockChrome.tabs.query).not.toHaveBeenCalled();
    });
  });

  describe('time reset functions', () => {
    it('should reset daily stats at midnight', () => {
      const currentDate = new Date().toISOString().split('T')[0];
      limitEnforcer.timeTracker.daily = {
        'old-date': { 'example.com': 60 }
      };

      limitEnforcer.resetDailyStats();

      expect(limitEnforcer.timeTracker.daily[currentDate]).toBeDefined();
      expect(limitEnforcer.timeTracker.daily['old-date']).toBeUndefined();
    });

    it('should calculate next reset times correctly', () => {
      const nextMidnight = limitEnforcer.getNextMidnight();
      const nextWeekly = limitEnforcer.getNextWeeklyReset();

      expect(nextMidnight).toBeGreaterThan(Date.now());
      expect(nextWeekly).toBeGreaterThan(Date.now());
    });
  });
});
