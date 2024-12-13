import { getFocusStatus, shouldBlockInFocusMode } from '../utils/focus.js';

describe('Focus Mode Utils', () => {
  beforeEach(() => {
    // Clear chrome.storage before each test
    chrome.storage.local.clear();
    // Reset any mocked timers
    jest.useRealTimers();
  });

  describe('getFocusStatus', () => {
    test('returns default status when no focus mode is set', async () => {
      const status = await getFocusStatus();
      expect(status).toEqual({ enabled: false });
    });

    test('returns correct status when focus mode is active', async () => {
      const mockFocusMode = {
        enabled: true,
        endTime: Date.now() + 3600000, // 1 hour from now
        startTime: Date.now(),
        duration: 60,
        blockedSites: ['facebook.com'],
        allowedSites: ['work.com']
      };

      await chrome.storage.local.set({ focusMode: mockFocusMode });
      const status = await getFocusStatus();
      expect(status).toEqual(mockFocusMode);
    });
  });

  describe('shouldBlockInFocusMode', () => {
    const mockFocusMode = {
      enabled: true,
      endTime: Date.now() + 3600000,
      startTime: Date.now(),
      duration: 60,
      blockedSites: ['facebook.com', '*.youtube.com'],
      allowedSites: ['work.com', '*.google.com']
    };

    beforeEach(async () => {
      await chrome.storage.local.set({ focusMode: mockFocusMode });
    });

    test('blocks sites in blocked list', async () => {
      expect(await shouldBlockInFocusMode('https://facebook.com')).toBe(true);
      expect(await shouldBlockInFocusMode('https://www.facebook.com')).toBe(true);
    });

    test('allows sites in allowed list', async () => {
      expect(await shouldBlockInFocusMode('https://work.com')).toBe(false);
      expect(await shouldBlockInFocusMode('https://docs.google.com')).toBe(false);
    });

    test('handles wildcard patterns', async () => {
      expect(await shouldBlockInFocusMode('https://videos.youtube.com')).toBe(true);
      expect(await shouldBlockInFocusMode('https://calendar.google.com')).toBe(false);
    });

    test('allows sites when focus mode is disabled', async () => {
      await chrome.storage.local.set({
        focusMode: { ...mockFocusMode, enabled: false }
      });
      expect(await shouldBlockInFocusMode('https://facebook.com')).toBe(false);
    });

    test('handles invalid URLs', async () => {
      expect(await shouldBlockInFocusMode('not-a-url')).toBe(false);
      expect(await shouldBlockInFocusMode('')).toBe(false);
    });

    test('prioritizes allowed list over blocked list', async () => {
      const conflictMode = {
        ...mockFocusMode,
        blockedSites: ['example.com'],
        allowedSites: ['example.com']
      };
      await chrome.storage.local.set({ focusMode: conflictMode });
      expect(await shouldBlockInFocusMode('https://example.com')).toBe(false);
    });
  });
});
