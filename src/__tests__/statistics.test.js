import StatisticsManager from '../statistics/statistics-manager';

// Mock Chart.js
jest.mock('chart.js/auto', () => {
  return jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn()
  }));
});

describe('StatisticsManager', () => {
  let statsManager;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // Setup mock canvas and context
    mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn()
    };
    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      width: 500,
      height: 300
    };
    document.getElementById = jest.fn((id) => mockCanvas);
    statsManager = new StatisticsManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Time Distribution Chart', () => {
    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': {
            totalTime: 3600000, // 1 hour
            visits: 10
          },
          'test.com': {
            totalTime: 1800000, // 30 minutes
            visits: 5
          }
        }
      }
    };

    test('should process time distribution data correctly', () => {
      const { labels, values } = statsManager.processTimeDistributionData(testData);
      
      expect(labels).toEqual(['example.com', 'test.com']);
      expect(values).toEqual([3600000, 1800000]);
    });

    test('should create time distribution chart', () => {
      statsManager.createTimeDistributionChart('timeChart', testData);
      
      expect(document.getElementById).toHaveBeenCalledWith('timeChart');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('Daily Trend Chart', () => {
    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': { totalTime: 3600000 }
        },
        '2024-12-12': {
          'example.com': { totalTime: 1800000 }
        }
      }
    };

    test('should process daily trend data correctly', () => {
      const { dates, totals } = statsManager.processDailyTrendData(testData);
      
      expect(dates).toEqual(['2024-12-12', '2024-12-13']);
      expect(totals).toEqual([1800000, 3600000]);
    });

    test('should create daily trend chart', () => {
      statsManager.createDailyTrendChart('trendChart', testData);
      
      expect(document.getElementById).toHaveBeenCalledWith('trendChart');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('Category Distribution Chart', () => {
    const testData = {
      dailyStats: {
        '2024-12-13': {
          'example.com': { totalTime: 3600000 },
          'test.org': { totalTime: 1800000 },
          'school.edu': { totalTime: 900000 }
        }
      }
    };

    test('should process category data correctly', () => {
      const { categories, times } = statsManager.processCategoryData(testData);
      
      expect(categories).toContain('Commercial');
      expect(categories).toContain('Organization');
      expect(categories).toContain('Education');
    });

    test('should create category distribution chart', () => {
      statsManager.createCategoryDistributionChart('categoryChart', testData);
      
      expect(document.getElementById).toHaveBeenCalledWith('categoryChart');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('Chart Management', () => {
    test('should destroy existing chart before creating new one', () => {
      const testData = {
        dailyStats: {
          '2024-12-13': {
            'example.com': { totalTime: 3600000 }
          }
        }
      };

      // Create initial chart
      statsManager.createTimeDistributionChart('timeChart', testData);
      const firstChart = statsManager.charts.get('timeChart');

      // Create new chart with same ID
      statsManager.createTimeDistributionChart('timeChart', testData);

      expect(firstChart.destroy).toHaveBeenCalled();
    });

    test('should destroy all charts when requested', () => {
      const testData = {
        dailyStats: {
          '2024-12-13': {
            'example.com': { totalTime: 3600000 }
          }
        }
      };

      // Create multiple charts
      statsManager.createTimeDistributionChart('chart1', testData);
      statsManager.createDailyTrendChart('chart2', testData);
      statsManager.createCategoryDistributionChart('chart3', testData);

      statsManager.destroyAllCharts();

      expect(statsManager.charts.size).toBe(0);
    });
  });
});
