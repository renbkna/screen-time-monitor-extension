// Mock Chrome APIs
require('jest-webextension-mock');

// Set up custom Chrome API mocks
global.chrome = {
  ...global.chrome,
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn(),
      getBytesInUse: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  runtime: {
    ...global.chrome.runtime,
    getManifest: () => ({
      version: '1.0.0',
      manifest_version: 3
    }),
    getURL: (path) => `chrome-extension://mockedid/${path}`,
    lastError: null
  },
  tabs: {
    ...global.chrome.tabs,
    create: jest.fn(),
    get: jest.fn(),
    query: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  idle: {
    ...global.chrome.idle,
    setDetectionInterval: jest.fn(),
    queryState: jest.fn(),
    onStateChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatch: jest.fn()
    }
  },
  alarms: {
    ...global.chrome.alarms,
    create: jest.fn(),
    clear: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatch: jest.fn()
    }
  }
};

// Helper to reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();

  // Reset storage
  chrome.storage.local.get.mockImplementation((keys, callback) => {
    if (callback) callback({});
    return Promise.resolve({});
  });

  chrome.storage.local.set.mockImplementation((items, callback) => {
    if (callback) callback();
    return Promise.resolve();
  });

  // Reset tabs
  chrome.tabs.query.mockImplementation((queryInfo, callback) => {
    if (callback) callback([]);
    return Promise.resolve([]);
  });

  chrome.tabs.get.mockImplementation((tabId, callback) => {
    const tab = { id: tabId, url: 'https://example.com' };
    if (callback) callback(tab);
    return Promise.resolve(tab);
  });

  // Reset alarms
  chrome.alarms.get.mockImplementation((name, callback) => {
    if (callback) callback(null);
    return Promise.resolve(null);
  });

  // Reset idle state
  chrome.idle.queryState.mockImplementation((detectionInterval, callback) => {
    if (callback) callback('active');
    return Promise.resolve('active');
  });
});

// Add custom matchers
expect.extend({
  toBeValidDate() {
    return {
      pass: !isNaN(Date.parse(this.actual)),
      message: () => `expected ${this.actual} to be a valid date`
    };
  },
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  }
});

// Set timezone to UTC for consistent date handling
process.env.TZ = 'UTC';
