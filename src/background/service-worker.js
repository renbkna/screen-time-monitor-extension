// Constants
const IDLE_TIMEOUT_SECONDS = 60; // Consider user idle after 1 minute of inactivity
const UPDATE_INTERVAL_SECONDS = 1;

// State
let currentState = {
  activeTabId: null,
  activeUrl: null,
  startTime: null,
  isIdle: false
};

// Initialize tracking system
const initializeTracking = async () => {
  // Set up idle detection
  chrome.idle.setDetectionInterval(IDLE_TIMEOUT_SECONDS);
  
  // Start periodic updates
  chrome.alarms.create('updateTime', {
    periodInMinutes: UPDATE_INTERVAL_SECONDS / 60
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
  const data = await chrome.storage.local.get('dailyStats');
  const dailyStats = data.dailyStats || {};
  
  if (!dailyStats[today]) {
    dailyStats[today] = {};
  }
  
  if (!dailyStats[today][domain]) {
    dailyStats[today][domain] = {
      totalTime: 0,
      visits: 0,
      lastVisit: now
    };
  }

  dailyStats[today][domain].totalTime += timeSpent;
  currentState.startTime = now; // Reset start time for next update

  await chrome.storage.local.set({ dailyStats });
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
    const data = await chrome.storage.local.get('dailyStats');
    const dailyStats = data.dailyStats || {};
    
    if (!dailyStats[today]) {
      dailyStats[today] = {};
    }
    
    if (!dailyStats[today][domain]) {
      dailyStats[today][domain] = {
        totalTime: 0,
        visits: 0,
        lastVisit: Date.now()
      };
    }

    dailyStats[today][domain].visits += 1;
    dailyStats[today][domain].lastVisit = Date.now();

    await chrome.storage.local.set({ dailyStats });
  }
};

// Event Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  handleTabChange(activeInfo.tabId, tab.url);
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
  if (alarm.name === 'updateTime') {
    await updateTimeTracking();
  }
});

// Initialize when service worker starts
initializeTracking().catch(console.error);

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_STATE') {
    sendResponse({
      currentUrl: currentState.activeUrl,
      isIdle: currentState.isIdle,
      startTime: currentState.startTime
    });
    return true;
  }
});