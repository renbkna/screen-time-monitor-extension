import { getBlockStatus } from '../utils/blocking.js';
import { getFocusStatus, shouldBlockInFocusMode, startFocusMode, endFocusMode } from '../utils/focus.js';

// Listen for runtime messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.type) {
    case 'PAGE_VISIT':
      await handlePageVisit(message.data, sender.tab.id);
      break;

    case 'CHECK_BLOCK_STATUS':
      const url = message.data.url;
      const blockStatus = await getBlockStatus(url);
      const focusBlockStatus = await shouldBlockInFocusMode(url);
      
      // Combine blocking and focus mode status
      const finalStatus = {
        isBlocked: blockStatus.isBlocked || focusBlockStatus,
        reason: focusBlockStatus ? 'This site is blocked during focus mode' : blockStatus.reason,
        endTime: blockStatus.endTime
      };

      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'BLOCK_STATUS',
        data: finalStatus
      });
      break;

    case 'START_FOCUS_MODE':
      await startFocusMode(
        message.data.duration,
        message.data.blockedSites,
        message.data.allowedSites
      );
      // Notify all tabs about focus mode change
      notifyAllTabs('FOCUS_MODE_CHANGED', { enabled: true });
      break;

    case 'END_FOCUS_MODE':
      await endFocusMode();
      // Notify all tabs about focus mode change
      notifyAllTabs('FOCUS_MODE_CHANGED', { enabled: false });
      break;

    case 'GET_FOCUS_STATUS':
      const focusStatus = await getFocusStatus();
      sendResponse(focusStatus);
      break;

    case 'OPEN_SETTINGS':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// Listen for alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusMode') {
    await endFocusMode();
    // Notify all tabs that focus mode has ended
    notifyAllTabs('FOCUS_MODE_CHANGED', { enabled: false });
  } else if (alarm.name === 'cleanup') {
    await cleanupOldStats();
  }
});

// Helper function to notify all tabs
function notifyAllTabs(type, data) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type, data });
    });
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const blockStatus = await getBlockStatus(tab.url);
    const focusBlockStatus = await shouldBlockInFocusMode(tab.url);

    if (blockStatus.isBlocked || focusBlockStatus) {
      chrome.tabs.sendMessage(tabId, {
        type: 'BLOCK_STATUS',
        data: {
          isBlocked: true,
          reason: focusBlockStatus ? 'This site is blocked during focus mode' : blockStatus.reason,
          endTime: blockStatus.endTime
        }
      });
    }
  }
});

// Track active tabs and their start times
let activeTabTimes = new Map();

// Track tab activation changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabId } = activeInfo;
  const tab = await chrome.tabs.get(tabId);
  
  // Stop tracking previous active tab
  for (const [oldTabId, startTime] of activeTabTimes.entries()) {
    if (oldTabId !== tabId) {
      updateTimeTracking(oldTabId, startTime);
      activeTabTimes.delete(oldTabId);
    }
  }

  // Start tracking new active tab
  if (tab.url && !tab.url.startsWith('chrome://')) {
    activeTabTimes.set(tabId, Date.now());
  }
});

// Track when browser becomes idle
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    // Update time tracking for all active tabs
    for (const [tabId, startTime] of activeTabTimes.entries()) {
      updateTimeTracking(tabId, startTime);
    }
    activeTabTimes.clear();
  }
});

// Handle page visit
async function handlePageVisit(data, tabId) {
  try {
    const { url, timestamp } = data;
    const domain = new URL(url).hostname;

    // Get current daily stats
    const today = new Date().toISOString().split('T')[0];
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');

    // Initialize or update stats for today
    if (!dailyStats[today]) {
      dailyStats[today] = {};
    }
    if (!dailyStats[today][domain]) {
      dailyStats[today][domain] = {
        totalTime: 0,
        visits: 0,
        lastVisit: null
      };
    }

    // Update visit count and last visit time
    dailyStats[today][domain].visits++;
    dailyStats[today][domain].lastVisit = timestamp;

    // Save updated stats
    await chrome.storage.local.set({ dailyStats });

    // Check both blocking and focus mode status
    const blockStatus = await getBlockStatus(url);
    const focusBlockStatus = await shouldBlockInFocusMode(url);

    if (blockStatus.isBlocked || focusBlockStatus) {
      chrome.tabs.sendMessage(tabId, {
        type: 'BLOCK_STATUS',
        data: {
          isBlocked: true,
          reason: focusBlockStatus ? 'This site is blocked during focus mode' : blockStatus.reason,
          endTime: blockStatus.endTime
        }
      });
    }
  } catch (error) {
    console.error('Error handling page visit:', error);
  }
}

// Update time tracking for a tab
async function updateTimeTracking(tabId, startTime) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;

    const domain = new URL(tab.url).hostname;
    const timeSpent = Date.now() - startTime;

    // Get current daily stats
    const today = new Date().toISOString().split('T')[0];
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');

    // Initialize if needed
    if (!dailyStats[today]) dailyStats[today] = {};
    if (!dailyStats[today][domain]) {
      dailyStats[today][domain] = {
        totalTime: 0,
        visits: 0,
        lastVisit: null
      };
    }

    // Update total time
    dailyStats[today][domain].totalTime += timeSpent;

    // Save updated stats
    await chrome.storage.local.set({ dailyStats });

    // Check if site should be blocked after time update
    const blockStatus = await getBlockStatus(tab.url);
    const focusBlockStatus = await shouldBlockInFocusMode(tab.url);

    if (blockStatus.isBlocked || focusBlockStatus) {
      chrome.tabs.sendMessage(tabId, {
        type: 'BLOCK_STATUS',
        data: {
          isBlocked: true,
          reason: focusBlockStatus ? 'This site is blocked during focus mode' : blockStatus.reason,
          endTime: blockStatus.endTime
        }
      });
    }
  } catch (error) {
    console.error('Error updating time tracking:', error);
  }
}

// Clean up old stats (keep last 30 days)
async function cleanupOldStats() {
  try {
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cleanedStats = Object.fromEntries(
      Object.entries(dailyStats).filter(([date]) => 
        new Date(date) >= thirtyDaysAgo
      )
    );

    await chrome.storage.local.set({ dailyStats: cleanedStats });
  } catch (error) {
    console.error('Error cleaning up old stats:', error);
  }
}

// Set up cleanup alarm
chrome.alarms.create('cleanup', { periodInMinutes: 1440 }); // Run once per day