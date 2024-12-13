const chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      getBytesInUse: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

global.chrome = chrome;

const { validateAndStoreData, retrieveAndValidateData, cleanupOldData } = require('../utils/data-validator');

describe('Data Storage and Retrieval Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = null;
  });

  test('should validate data structure before storage', async () => {
    const validData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 3600000,
            visits: 10,
            lastVisit: Date.now()
          }
        }
      }
    };

    await validateAndStoreData(validData);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      validData,
      expect.any(Function)
    );
  });

  test('should reject invalid data structure', async () => {
    const invalidData = {
      dailyStats: {
        'invalid-date': {
          'example.com': {
            totalTime: 'not-a-number',
            visits: 'invalid'
          }
        }
      }
    };

    await expect(validateAndStoreData(invalidData)).rejects.toThrow(
      'Invalid data structure'
    );

    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('should handle corrupted storage data', async () => {
    const corruptedData = {
      dailyStats: 'not-an-object'
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(corruptedData);
    });

    const result = await retrieveAndValidateData();

    // Should return clean default structure
    expect(result).toEqual({
      dailyStats: {}
    });
  });

  test('should handle storage quota limits', async () => {
    const largeData = {
      dailyStats: {}
    };

    // Generate large dataset
    for (let i = 0; i < 1000; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      largeData.dailyStats[dateStr] = {
        'example.com': {
          totalTime: 3600000,
          visits: i,
          lastVisit: Date.now()
        }
      };
    }

    // Mock storage quota exceeded
    chrome.storage.local.getBytesInUse.mockImplementation((keys, callback) => {
      callback(chrome.storage.local.QUOTA_BYTES - 1000); // Near quota
    });

    await validateAndStoreData(largeData);

    // Verify data was cleaned up before storage
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyStats: expect.any(Object)
      }),
      expect.any(Function)
    );

    const storedData = chrome.storage.local.set.mock.calls[0][0];
    expect(Object.keys(storedData.dailyStats).length).toBeLessThan(1000);
  });

  test('should cleanup old data correctly', async () => {
    const oldData = {
      dailyStats: {}
    };

    // Generate data for the past 400 days
    for (let i = 0; i < 400; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      oldData.dailyStats[dateStr] = {
        'example.com': {
          totalTime: 3600000,
          visits: i
        }
      };
    }

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(oldData);
    });

    await cleanupOldData();

    // Verify old data was cleaned up
    expect(chrome.storage.local.set).toHaveBeenCalled();
    const cleanedData = chrome.storage.local.set.mock.calls[0][0];

    // Should keep only last 365 days
    expect(Object.keys(cleanedData.dailyStats).length).toBe(365);

    // Verify kept data is most recent
    const oldestDate = new Date();
    oldestDate.setDate(oldestDate.getDate() - 365);
    const oldestAllowedDate = oldestDate.toISOString().split('T')[0];

    Object.keys(cleanedData.dailyStats).forEach(date => {
      expect(date >= oldestAllowedDate).toBe(true);
    });
  });

  test('should handle concurrent storage operations', async () => {
    const testData1 = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 3600000,
            visits: 10
          }
        }
      }
    };

    const testData2 = {
      dailyStats: {
        '2024-12-13': {
          'test.com': {
            totalTime: 1800000,
            visits: 5
          }
        }
      }
    };

    // Simulate concurrent storage operations
    const promise1 = validateAndStoreData(testData1);
    const promise2 = validateAndStoreData(testData2);

    await Promise.all([promise1, promise2]);

    // Verify both operations completed
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
  });
});
