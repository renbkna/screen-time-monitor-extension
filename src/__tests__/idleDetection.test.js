const chrome = {
  idle: {
    onStateChanged: {
      addListener: jest.fn()
    },
    setDetectionInterval: jest.fn(),
    queryState: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    onActivated: {
      addListener: jest.fn()
    }
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

const { initializeIdleDetection, handleIdleState, resumeFromIdle } = require('../background/idle-handler');

describe('Idle Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should initialize idle detection with correct interval', async () => {
    const IDLE_DETECTION_INTERVAL = 60; // 1 minute in seconds

    await initializeIdleDetection();

    expect(chrome.idle.setDetectionInterval)
      .toHaveBeenCalledWith(IDLE_DETECTION_INTERVAL);
    expect(chrome.idle.onStateChanged.addListener)
      .toHaveBeenCalledWith(expect.any(Function));
  });

  test('should pause time tracking when system becomes idle', async () => {
    // Mock active tab
    const activeTab = { id: 1, url: 'https://example.com' };
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([activeTab]);
    });

    // Start tracking
    await handleIdleState('active');
    
    // Advance timer by 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);
    
    // System becomes idle
    await handleIdleState('idle');

    // Verify storage was updated with correct timing
    expect(chrome.storage.local.set).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example.com': expect.objectContaining({
              totalTime: 300000 // 5 minutes in milliseconds
            })
          })
        })
      }),
      expect.any(Function)
    );
  });

  test('should resume tracking after returning from idle state', async () => {
    // Mock active tab
    const activeTab = { id: 1, url: 'https://example.com' };
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([activeTab]);
    });

    // Start in active state
    await handleIdleState('active');
    
    // Track for 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);
    
    // Go idle
    await handleIdleState('idle');
    
    // Stay idle for 10 minutes
    jest.advanceTimersByTime(10 * 60 * 1000);
    
    // Resume from idle
    await resumeFromIdle();
    
    // Track for another 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    // Verify only active time was tracked (10 minutes total, excluding idle time)
    const storageSetCalls = chrome.storage.local.set.mock.calls;
    const lastCall = storageSetCalls[storageSetCalls.length - 1][0];

    expect(lastCall).toEqual(
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example.com': expect.objectContaining({
              totalTime: 600000 // 10 minutes in milliseconds (5 before + 5 after idle)
            })
          })
        })
      })
    );
  });

  test('should handle system lock state correctly', async () => {
    // Mock active tab
    const activeTab = { id: 1, url: 'https://example.com' };
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([activeTab]);
    });

    // Start tracking
    await handleIdleState('active');
    
    // Track for 3 minutes
    jest.advanceTimersByTime(3 * 60 * 1000);
    
    // System gets locked
    await handleIdleState('locked');

    // Verify time tracking stopped
    expect(chrome.storage.local.set).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example.com': expect.objectContaining({
              totalTime: 180000 // 3 minutes in milliseconds
            })
          })
        })
      }),
      expect.any(Function)
    );
  });

  test('should handle rapid state changes correctly', async () => {
    // Mock active tab
    const activeTab = { id: 1, url: 'https://example.com' };
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([activeTab]);
    });

    // Simulate rapid state changes
    await handleIdleState('active');
    jest.advanceTimersByTime(30 * 1000); // 30 seconds
    
    await handleIdleState('idle');
    jest.advanceTimersByTime(10 * 1000); // 10 seconds
    
    await handleIdleState('active');
    jest.advanceTimersByTime(20 * 1000); // 20 seconds

    // Verify only active time was tracked
    const storageSetCalls = chrome.storage.local.set.mock.calls;
    const lastCall = storageSetCalls[storageSetCalls.length - 1][0];

    expect(lastCall).toEqual(
      expect.objectContaining({
        'dailyStats': expect.objectContaining({
          [new Date().toISOString().split('T')[0]]: expect.objectContaining({
            'example.com': expect.objectContaining({
              totalTime: 50000 // 50 seconds in milliseconds (30 + 20)
            })
          })
        })
      })
    );
  });
});
