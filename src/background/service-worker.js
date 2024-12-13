import { storageManager } from '../utils/storage-manager.js';

// State
let currentState = {
  activeTabId: null,
  activeUrl: null,
  startTime: null,
  isIdle: false
};

// Initialize tracking system
const initializeTracking = async () => {
  // Get settings
  const settings = await storageManager.getSettings();
  
  // Set up idle detection
  chrome.idle.setDetectionInterval(settings.idleTimeout);
  
  // Start periodic updates
  chrome.alarms.create('updateTime', {
    periodInMinutes: settings.updateInterval / 60
  });

  // Set up daily cleanup
  chrome.alarms.create('cleanupStats', {
    periodInMinutes: 24 * 60 // Run once per day
  });
};

// Get domain from URL
const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
};

// Update time tracking for current site
const updateTimeTracking = async () => {
  if (currentState.isIdle || !currentState.startTime || !currentState.activeUrl) {
    return;
  }

  const domain = getDomain(currentState.activeUrl);
  if (!domain) return;

  const now = Date.now();
  const timeSpent = now - currentState.startTime;
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Update storage with time spent
  await storageManager.updateDomainStats(today, domain, timeSpent);
  
  // Reset start time for next update
  currentState.startTime = now;
};

// Handle active tab change
const handleTabChange = async (tabId, url) => {
  if (currentState.activeTabId === tabId) return;

  // Update time for previous site before switching
  await updateTimeTracking();

  currentState = {
    activeTabId: tabId,
    activeUrl: url,
    startTime: Date.now(),
    isIdle: false
  };

  // Update visit count for new site
  const domain = getDomain(url);
  if (domain) {
    const today = new Date().toISOString().split('T')[0];
    await storageManager.updateDomainStats(today, domain, 0);
  }
};

// Event Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    handleTabChange(activeInfo.tabId, tab.url);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only handle updates when URL changes and it's the active tab
  if (changeInfo.url && tabId === currentState.activeTabId) {
    handleTabChange(tabId, changeInfo.url);
  }
});

chrome.idle.onStateChanged.addListener((newState) => {
  const wasIdle = currentState.isIdle;
  currentState.isIdle = newState !== 'active';

  // If returning from idle, reset start time
  if (wasIdle && !currentState.isIdle) {
    currentState.startTime = Date.now();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'updateTime':
      await updateTimeTracking();
      break;
    case 'cleanupStats':
      await storageManager.clearOldStats();
      break;
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_CURRENT_STATE':
      sendResponse({
        currentUrl: currentState.activeUrl,
        isIdle: currentState.isIdle,
        startTime: currentState.startTime
      });
      return true;

    case 'GET_DAILY_STATS':
      storageManager.getDayStats(message.date)
        .then(stats => sendResponse(stats));
      return true;

    case 'GET_STATS_SUMMARY':
      storageManager.getStatsSummary(message.startDate, message.endDate)
        .then(summary => sendResponse(summary));
      return true;
  }
});

// Initialize when service worker starts
initializeTracking().catch(console.error);