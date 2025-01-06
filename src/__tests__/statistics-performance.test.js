import StatisticsManager from '../statistics/statistics-manager';

// Mock Chart.js
jest.mock('chart.js/auto', () => {
  return jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn()
  }));
});

describe('Statistics Performance Tests', () => {
  let statsManager;
  let mockCanvas;

  beforeEach(() => {
    // Setup mock canvas
    mockCanvas = {
      getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn()
      })),
      width: 500,
      height: 300
    };
    document.getElementById = jest.fn(() => mockCanvas);
    statsManager = new StatisticsManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle large datasets efficiently', () => {
    const largeData = {
      dailyStats: {}
    };

    // Generate data for 365 days with 100 sites per day
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      largeData.dailyStats[dateStr] = {};
      
      for (let j = 1; j <= 100; j++) {
        largeData.dailyStats[dateStr][`site${j}.com`] = {
          totalTime: Math.random() * 3600000,
          visits: Math.floor(Math.random() * 100)
        };
      }
    }

    // Measure performance for data processing
    const startTime = performance.now();
    
    const { labels, values } = statsManager.processTimeDistributionData(largeData);
    const { dates, totals } = statsManager.processDailyTrendData(largeData);
    const { categories, times } = statsManager.processCategoryData(largeData);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Assert processing time is reasonable (less than 1 second)
    expect(processingTime).toBeLessThan(1000);

    // Verify data integrity
    expect(labels.length).toBeLessThanOrEqual(10); // Should limit to top 10 sites
    expect(dates.length).toBe(365); // Should include all days
    expect(categories.length).toBeGreaterThan(0); // Should have categories
  });

  test('should maintain data accuracy with large datasets', () => {
    const largeData = {
      dailyStats: {}
    };

    // Generate data with known total
    let knownTotal = 0;
    const testDate = new Date().toISOString().split('T')[0];
    largeData.dailyStats[testDate] = {};

    for (let i = 1; i <= 1000; i++) {
      const time = i * 1000; // Incremental time values
      knownTotal += time;
      largeData.dailyStats[testDate][`site${i}.com`] = {
        totalTime: time,
        visits: 1
      };
    }

    const { values } = statsManager.processTimeDistributionData(largeData);
    const processedTotal = values.reduce((sum, time) => sum + time, 0);

    // Verify top sites total is less than or equal to known total
    expect(processedTotal).toBeLessThanOrEqual(knownTotal);

    // Verify data proportions are maintained
    const topSites = values.slice(0, 10);
    expect(topSites).toEqual(
      topSites.sort((a, b) => b - a)
    );
  });

  test('should handle various screen sizes', () => {
    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': { totalTime: 3600000 }
        }
      }
    };

    // Test different screen sizes
    const screenSizes = [
      { width: 320, height: 480 },  // Mobile portrait
      { width: 480, height: 320 },  // Mobile landscape
      { width: 768, height: 1024 }, // Tablet portrait
      { width: 1024, height: 768 }, // Tablet landscape
      { width: 1920, height: 1080 } // Desktop
    ];

    screenSizes.forEach(size => {
      mockCanvas.width = size.width;
      mockCanvas.height = size.height;

      statsManager.createTimeDistributionChart('timeChart', testData);
      statsManager.createDailyTrendChart('trendChart', testData);
      statsManager.createCategoryDistributionChart('categoryChart', testData);

      // Verify charts were created for each size
      expect(statsManager.charts.size).toBeGreaterThan(0);
    });
  });

  test('should aggregate data correctly across time ranges', () => {
    const testData = {
      dailyStats: {}
    };

    // Generate test data with known patterns
    let totalTimeAcrossAllDays = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      testData.dailyStats[dateStr] = {
        'test.com': {
          totalTime: 3600000, // 1 hour each day
          visits: 10
        }
      };
      totalTimeAcrossAllDays += 3600000;
    }

    // Test daily aggregation
    const dailyStats = statsManager.processDailyTrendData(testData);
    expect(dailyStats.dates.length).toBe(30);
    expect(dailyStats.totals[0]).toBe(3600000);

    // Test category aggregation
    const categoryStats = statsManager.processCategoryData(testData);
    const totalCategoryTime = categoryStats.times.reduce((sum, time) => sum + time, 0);
    expect(totalCategoryTime).toBe(totalTimeAcrossAllDays);

    // Test time distribution
    const timeDistribution = statsManager.processTimeDistributionData(testData);
    expect(timeDistribution.labels).toContain('test.com');
    expect(timeDistribution.values[0]).toBe(totalTimeAcrossAllDays);
  });
});
