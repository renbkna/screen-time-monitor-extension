import { processDailyStats, processWeeklyStats, processCategoryStats } from '../statistics/stats-processor';
import { formatTime } from '../utils/timeUtils';

describe('Stats Processor', () => {
    const mockDailyStats = {
        '2024-12-14': {
            'example.com': {
                totalTime: 120,
                visits: 5,
                lastVisit: '2024-12-14T10:30:00Z'
            },
            'test.com': {
                totalTime: 60,
                visits: 3,
                lastVisit: '2024-12-14T11:00:00Z'
            }
        }
    };

    describe('processDailyStats', () => {
        it('should process daily statistics correctly', async () => {
            const result = await processDailyStats(mockDailyStats);

            expect(result).toHaveProperty('totalTime');
            expect(result).toHaveProperty('topSites');
            expect(result).toHaveProperty('hourlyDistribution');
            expect(result).toHaveProperty('date');

            expect(result.totalTime).toBe(180); // 120 + 60
            expect(result.topSites).toHaveLength(2);
            expect(result.topSites[0].domain).toBe('example.com');
            expect(result.hourlyDistribution).toHaveLength(24);
        });

        it('should handle empty data', async () => {
            const result = await processDailyStats({});

            expect(result.totalTime).toBe(0);
            expect(result.topSites).toHaveLength(0);
            expect(result.hourlyDistribution.every(h => h === 0)).toBe(true);
        });
    });

    describe('processWeeklyStats', () => {
        const mockWeeklyStats = {
            '2024-12-14': mockDailyStats['2024-12-14'],
            '2024-12-13': {
                'example.com': {
                    totalTime: 90,
                    visits: 4,
                    lastVisit: '2024-12-13T15:00:00Z'
                }
            }
        };

        it('should process weekly statistics correctly', async () => {
            const result = await processWeeklyStats(mockWeeklyStats);

            expect(result).toHaveProperty('days');
            expect(result).toHaveProperty('dailyTotals');
            expect(result).toHaveProperty('topSites');
            expect(result).toHaveProperty('weeklyTotal');

            expect(result.days).toHaveLength(7);
            expect(result.dailyTotals).toHaveLength(7);
            expect(result.topSites[0].domain).toBe('example.com');
            expect(result.weeklyTotal).toBe(270); // 180 + 90
        });
    });

    describe('processCategoryStats', () => {
        it('should categorize sites correctly', async () => {
            const result = await processCategoryStats(mockDailyStats);

            expect(result).toHaveProperty('categoryData');
            expect(Array.isArray(result.categoryData)).toBe(true);
            expect(result.categoryData.length).toBeGreaterThan(0);
            expect(result.categoryData[0]).toHaveProperty('category');
            expect(result.categoryData[0]).toHaveProperty('timeSpent');
        });
    });
});
