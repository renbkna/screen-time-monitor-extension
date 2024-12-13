/**
 * Integration test utilities for the Screen Time Monitor extension
 */

/**
 * Simulate tab navigation
 * @param {string} url - URL to navigate to
 * @returns {Promise<chrome.tabs.Tab>} Created tab
 */
export async function simulateNavigation(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      });
    });
  });
}

/**
 * Simulate time passage
 * @param {number} minutes - Minutes to simulate
 * @returns {Promise<void>}
 */
export async function simulateTimePassage(minutes) {
  const milliseconds = minutes * 60 * 1000;
  const startTime = Date.now();
  
  // Override Date.now during the test
  const originalNow = Date.now;
  Date.now = () => startTime + milliseconds;

  // Trigger necessary events
  chrome.runtime.sendMessage({
    type: 'TIME_UPDATE',
    data: { timestamp: Date.now() }
  });

  // Restore original Date.now after a delay
  await new Promise(resolve => setTimeout(resolve, 100));
  Date.now = originalNow;
}

/**
 * Mock storage data
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
export async function mockStorage(data) {
  await chrome.storage.local.clear();
  await chrome.storage.local.set(data);
}

/**
 * Clear all storage data
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  await chrome.storage.local.clear();
}

/**
 * Simulate focus mode activation
 * @param {number} duration - Duration in minutes
 * @param {string[]} blockedSites - Sites to block
 * @returns {Promise<void>}
 */
export async function simulateFocusMode(duration, blockedSites) {
  await chrome.runtime.sendMessage({
    type: 'START_FOCUS_MODE',
    data: {
      duration,
      blockedSites
    }
  });
}

/**
 * Wait for a specific time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock Chrome notifications
 */
export function mockNotifications() {
  const notifications = [];
  chrome.notifications.create = (id, options) => {
    notifications.push({ id, ...options });
  };
  return notifications;
}

/**
 * Simulate idle state
 * @param {string} state - Idle state ('active', 'idle', 'locked')
 */
export function simulateIdle(state) {
  chrome.idle.onStateChanged.dispatch(state);
}

/**
 * Create test data generator
 * @param {number} days - Number of days of data to generate
 * @returns {Object} Generated test data
 */
export function generateTestData(days) {
  const data = {
    dailyStats: {}
  };

  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    data.dailyStats[dateStr] = {
      'example.com': {
        totalTime: Math.floor(Math.random() * 3600000),
        visits: Math.floor(Math.random() * 50),
        lastVisit: date.getTime()
      },
      'test.com': {
        totalTime: Math.floor(Math.random() * 3600000),
        visits: Math.floor(Math.random() * 50),
        lastVisit: date.getTime()
      }
    };
  }

  return data;
}

/**
 * Mock tab activation
 * @param {Object} tab - Tab to activate
 */
export function simulateTabActivation(tab) {
  chrome.tabs.onActivated.dispatch({ tabId: tab.id });
}

/**
 * Clean up test environment
 */
export async function cleanupTests() {
  await clearStorage();
  chrome.notifications.create = undefined;
  chrome.idle.onStateChanged.dispatch('active');
}
