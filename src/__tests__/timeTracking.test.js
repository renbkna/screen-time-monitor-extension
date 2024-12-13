const chrome = {
  tabs: {
    onActivated: {
      addListener: jest.fn()
    },
    query: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

global.chrome = chrome;

const { trackTabActivity } = require('../background/service-worker');

describe('Time Tracking Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should track time when switching between tabs', async () => {
    // Mock active tab data
    const tab1 = { id: 1, url: 'https://example1.com' };
    const tab2 = { id: 2, url: 'https://example2.com' };
    
    // Mock chrome.tabs.query to return our test tab
    chrome.tabs.query.mockImplementation(({ active, currentWindow }, callback) => {
      callback([tab1]);
    });

    // Start tracking tab1
    await trackTabActivity();
    
    // Advance timer by 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);
    
    // Simulate switch to tab2
    chrome.tabs.query.mockImplementation(({ active, currentWindow }, callback) => {
      callback([tab2]);
    });
    await trackTabActivity();

    // Verify storage was called with correct timing data
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example1.com': expect.objectContaining({
              totalTime: 300000 // 5 minutes in milliseconds
            })
          })
        })
      })
    );
  });

  test('should accurately track simultaneous tabs', async () => {
    // Mock multiple open tabs
    const tabs = [
      { id: 1, url: 'https://example1.com' },
      { id: 2, url: 'https://example2.com' },
      { id: 3, url: 'https://example3.com' }
    ];

    let activeTab = tabs[0];
    chrome.tabs.query.mockImplementation(({ active, currentWindow }, callback) => {
      callback([activeTab]);
    });

    // Start tracking first tab
    await trackTabActivity();
    
    // Advance timer by 2 minutes
    jest.advanceTimersByTime(2 * 60 * 1000);
    
    // Switch to second tab
    activeTab = tabs[1];
    await trackTabActivity();
    
    // Advance timer by 3 minutes
    jest.advanceTimersByTime(3 * 60 * 1000);
    
    // Switch to third tab
    activeTab = tabs[2];
    await trackTabActivity();
    
    // Verify storage calls for each tab
    const storageSetCalls = chrome.storage.local.set.mock.calls;
    
    // Verify timing data for first tab
    expect(storageSetCalls).toContainEqual([
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example1.com': expect.objectContaining({
              totalTime: 120000 // 2 minutes in milliseconds
            })
          })
        })
      })
    ]);

    // Verify timing data for second tab
    expect(storageSetCalls).toContainEqual([
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example2.com': expect.objectContaining({
              totalTime: 180000 // 3 minutes in milliseconds
            })
          })
        })
      })
    ]);
  });

  test('should handle invalid URLs gracefully', async () => {
    const invalidTab = { id: 1, url: 'chrome://extensions' };
    
    chrome.tabs.query.mockImplementation(({ active, currentWindow }, callback) => {
      callback([invalidTab]);
    });

    await trackTabActivity();
    
    // Advance timer
    jest.advanceTimersByTime(60 * 1000);
    
    // Verify that chrome:// URLs are not tracked
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
