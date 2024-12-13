import { domainPatternToRegex, urlMatchesPattern, isWithinSchedule } from '../utils/blocking.js';

describe('Blocking Utils', () => {
  // Test domain pattern to regex conversion
  describe('domainPatternToRegex', () => {
    test('converts simple domain to regex', () => {
      const pattern = 'example.com';
      const regex = domainPatternToRegex(pattern);
      expect(regex.test('example.com')).toBe(true);
      expect(regex.test('test.example.com')).toBe(false);
      expect(regex.test('notexample.com')).toBe(false);
    });

    test('handles wildcard subdomain pattern', () => {
      const pattern = '*.example.com';
      const regex = domainPatternToRegex(pattern);
      expect(regex.test('example.com')).toBe(false);
      expect(regex.test('test.example.com')).toBe(true);
      expect(regex.test('sub.test.example.com')).toBe(true);
    });

    test('escapes special characters', () => {
      const pattern = 'test.example.com';
      const regex = domainPatternToRegex(pattern);
      expect(regex.source).toContain('\\.');
    });
  });

  // Test URL pattern matching
  describe('urlMatchesPattern', () => {
    test('matches exact domain', () => {
      expect(urlMatchesPattern('https://example.com', 'example.com')).toBe(true);
      expect(urlMatchesPattern('http://example.com/page', 'example.com')).toBe(true);
      expect(urlMatchesPattern('https://test.com', 'example.com')).toBe(false);
    });

    test('matches wildcard subdomains', () => {
      expect(urlMatchesPattern('https://sub.example.com', '*.example.com')).toBe(true);
      expect(urlMatchesPattern('https://example.com', '*.example.com')).toBe(false);
    });

    test('handles invalid URLs', () => {
      expect(urlMatchesPattern('not-a-url', 'example.com')).toBe(false);
      expect(urlMatchesPattern('', 'example.com')).toBe(false);
    });
  });

  // Test schedule checking
  describe('isWithinSchedule', () => {
    beforeEach(() => {
      // Mock current date to a known value
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns false for invalid schedule', () => {
      expect(isWithinSchedule(null)).toBe(false);
      expect(isWithinSchedule({})).toBe(false);
      expect(isWithinSchedule({ days: [1], startTime: '09:00' })).toBe(false);
    });

    test('checks if current time is within schedule', () => {
      const schedule = {
        days: [2], // Tuesday
        startTime: '09:00',
        endTime: '17:00'
      };
      expect(isWithinSchedule(schedule)).toBe(true);
    });

    test('handles overnight schedules', () => {
      const schedule = {
        days: [2], // Tuesday
        startTime: '22:00',
        endTime: '03:00'
      };
      // Set time to 23:00
      jest.setSystemTime(new Date('2024-01-01T23:00:00'));
      expect(isWithinSchedule(schedule)).toBe(true);
    });

    test('checks day of week', () => {
      const schedule = {
        days: [1], // Monday
        startTime: '09:00',
        endTime: '17:00'
      };
      expect(isWithinSchedule(schedule)).toBe(false);
    });
  });
});
