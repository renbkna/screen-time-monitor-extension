const chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

global.chrome = chrome;

const { saveTimeData, loadTimeData, clearTimeData } = require('../utils/storage');

describe('Data Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock storage data
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();
  });

  test('should save and retrieve time data correctly', async () => {
    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 3600000, // 1 hour
            visits: 5,
            lastVisit: Date.now()
          }
        }
      }
    };

    // Mock storage.local.set to simulate saving data
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    // Mock storage.local.get to simulate retrieving saved data
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(testData);
      return Promise.resolve(testData);
    });

    // Save the test data
    await saveTimeData(testData);

    // Verify data was saved correctly
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      testData,
      expect.any(Function)
    );

    // Load the data back
    const loadedData = await loadTimeData();

    // Verify loaded data matches saved data
    expect(loadedData).toEqual(testData);
  });

  test('should handle storage errors gracefully', async () => {
    // Mock a storage error
    const errorMessage = 'Storage quota exceeded';
    chrome.storage.local.set.mockImplementation((data, callback) => {
      chrome.runtime.lastError = { message: errorMessage };
      if (callback) callback();
      return Promise.reject(new Error(errorMessage));
    });

    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 3600000,
            visits: 5
          }
        }
      }
    };

    // Attempt to save data and expect it to handle the error
    await expect(saveTimeData(testData)).rejects.toThrow(errorMessage);

    // Reset the mock error
    chrome.runtime.lastError = null;
  });

  test('should merge new data with existing data', async () => {
    const existingData = {
      dailyStats: {
        '2024-12-12': {
          'example.com': {
            totalTime: 3600000,
            visits: 5
          }
        }
      }
    };

    const newData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 1800000,
            visits: 3
          }
        }
      }
    };

    // Mock getting existing data
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(existingData);
      return Promise.resolve(existingData);
    });

    // Mock setting merged data
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    // Save new data
    await saveTimeData(newData);

    // Verify merged data was saved
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyStats: expect.objectContaining({
          '2024-12-12': existingData.dailyStats['2024-12-12'],
          '2024-12-13': newData.dailyStats['2024-12-13']
        })
      }),
      expect.any(Function)
    );
  });

  test('should clear all stored data', async () => {
    // Mock storage.local.clear
    chrome.storage.local.clear.mockImplementation((callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    await clearTimeData();

    // Verify clear was called
    expect(chrome.storage.local.clear).toHaveBeenCalled();

    // Verify subsequent load returns empty data
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
      return Promise.resolve({});
    });

    const loadedData = await loadTimeData();
    expect(loadedData).toEqual({ dailyStats: {} });
  });

  test('should handle large datasets without data loss', async () => {
    // Create a large dataset
    const largeData = {
      dailyStats: {}
    };

    // Generate 365 days of data
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      largeData.dailyStats[dateStr] = {
        'example.com': {
          totalTime: 3600000 * i,
          visits: i
        },
        'test.com': {
          totalTime: 1800000 * i,
          visits: i
        }
      };
    }

    // Mock storage operations
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(largeData);
      return Promise.resolve(largeData);
    });

    // Save large dataset
    await saveTimeData(largeData);

    // Load the data back
    const loadedData = await loadTimeData();

    // Verify all data was preserved
    expect(loadedData).toEqual(largeData);
    expect(Object.keys(loadedData.dailyStats).length).toBe(365);
  });
});
