import {
  simulateNavigation,
  simulateTimePassage,
  mockStorage,
  clearStorage,
  simulateFocusMode,
  wait,
  mockNotifications,
  simulateIdle,
  generateTestData,
  simulateTabActivation,
  cleanupTests
} from './test-utils.js';

describe('Screen Time Monitor Extension Integration Tests', () => {
  beforeEach(async () => {
    await clearStorage();
  });

  afterEach(async () => {
    await cleanupTests();
  });

  describe('Time Tracking', () => {
    test('should track time spent on websites', async () => {
      const tab = await simulateNavigation('https://example.com');
      simulateTabActivation(tab);
      await simulateTimePassage(30); // 30 minutes

      const data = await chrome.storage.local.get('dailyStats');
      const today = new Date().toISOString().split('T')[0];
      const stats = data.dailyStats[today]['example.com'];

      expect(stats).toBeDefined();
      expect(stats.totalTime).toBeGreaterThan(0);
      expect(stats.visits).toBe(1);
    });

    test('should handle multiple tab switches', async () => {
      const tab1 = await simulateNavigation('https://example.com');
      const tab2 = await simulateNavigation('https://test.com');

      simulateTabActivation(tab1);
      await simulateTimePassage(10);
      simulateTabActivation(tab2);
      await simulateTimePassage(20);

      const data = await chrome.storage.local.get('dailyStats');
      const today = new Date().toISOString().split('T')[0];
      
      expect(data.dailyStats[today]['example.com'].totalTime).toBeGreaterThan(0);
      expect(data.dailyStats[today]['test.com'].totalTime).toBeGreaterThan(0);
    });
  });

  describe('Focus Mode', () => {
    test('should block sites during focus mode', async () => {
      const blockedSites = ['example.com'];
      await simulateFocusMode(25, blockedSites);

      const tab = await simulateNavigation('https://example.com');
      const status = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'CHECK_BLOCK_STATUS',
          data: { url: tab.url }
        }, resolve);
      });

      expect(status.isBlocked).toBe(true);
      expect(status.reason).toContain('focus mode');
    });

    test('should end focus mode after duration', async () => {
      await simulateFocusMode(1, ['example.com']);
      await simulateTimePassage(2); // 2 minutes

      const tab = await simulateNavigation('https://example.com');
      const status = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'CHECK_BLOCK_STATUS',
          data: { url: tab.url }
        }, resolve);
      });

      expect(status.isBlocked).toBe(false);
    });
  });

  describe('Time Limits', () => {
    test('should enforce daily time limits', async () => {
      // Set a 30-minute limit for example.com
      await mockStorage({
        settings: {
          limits: {
            'example.com': {
              dailyLimit: 30,
              enabled: true
            }
          }
        }
      });

      const tab = await simulateNavigation('https://example.com');
      simulateTabActivation(tab);
      await simulateTimePassage(40); // 40 minutes

      const status = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'CHECK_BLOCK_STATUS',
          data: { url: tab.url }
        }, resolve);
      });

      expect(status.isBlocked).toBe(true);
      expect(status.reason).toContain('time limit');
    });
  });

  describe('Notifications', () => {
    test('should show notification when approaching limit', async () => {
      const notifications = mockNotifications();

      await mockStorage({
        settings: {
          limits: {
            'example.com': {
              dailyLimit: 30,
              enabled: true
            }
          }
        }
      });

      const tab = await simulateNavigation('https://example.com');
      simulateTabActivation(tab);
      await simulateTimePassage(25); // 25 minutes

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].message).toContain('approaching');
    });
  });

  describe('Idle Detection', () => {
    test('should pause tracking when idle', async () => {
      const tab = await simulateNavigation('https://example.com');
      simulateTabActivation(tab);
      await simulateTimePassage(10);
      
      simulateIdle('idle');
      await simulateTimePassage(20);
      simulateIdle('active');

      const data = await chrome.storage.local.get('dailyStats');
      const today = new Date().toISOString().split('T')[0];
      const stats = data.dailyStats[today]['example.com'];

      // Should only count the first 10 minutes
      expect(stats.totalTime).toBeLessThan(15 * 60 * 1000); // 15 minutes in ms
    });
  });

  describe('Data Management', () => {
    test('should clean up old data', async () => {
      const testData = generateTestData(40); // 40 days of data
      await mockStorage(testData);

      // Trigger cleanup
      chrome.alarms.dispatch('cleanup');
      await wait(100);

      const data = await chrome.storage.local.get('dailyStats');
      const dates = Object.keys(data.dailyStats);

      // Should only keep 30 days of data
      expect(dates.length).toBeLessThanOrEqual(30);
    });
  });
});
