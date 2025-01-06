// Import utilities
import {
  getDomainFromUrl,
  getTodayKey,
  updateTimeSpent,
  checkLimits,
  initializeWebsiteData,
  showNotification,
  getCategories,
  calculateProductivityScore,
} from "./utils.js";

// Global state with improved tracking
let activeTabId = null;
let activeTabDomain = null;
let startTime = null;
let isTracking = true;
let limitExceeded = {};
let lastUpdateTime = null;
let dailyData = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Screen Time Manager installed/updated");
  await initializeWebsiteData();
  // Initialize categories if needed
  const categories = await getCategories();
  console.log("Initialized categories:", categories);
  setupAlarms();
  dailyData = {};
});

// Set up periodic time updates (every 1 second)
setInterval(async () => {
  if (isTracking && activeTabDomain && startTime) {
    const currentTime = Date.now();
    const timeSpent = currentTime - (lastUpdateTime || startTime);

    if (timeSpent > 0) {
      try {
        const updatedData = await updateTimeSpent(activeTabDomain, timeSpent);
        if (updatedData) {
          // Update daily data cache
          if (!dailyData[activeTabDomain]) {
            dailyData[activeTabDomain] = updatedData;
          } else {
            dailyData[activeTabDomain].timeSpent = updatedData.timeSpent;
          }
        }
        lastUpdateTime = currentTime;

        // Check limits immediately after updating time
        const isExceeded = await checkLimits(activeTabDomain);
        if (isExceeded && !limitExceeded[activeTabDomain]) {
          limitExceeded[activeTabDomain] = true;
          await enforceTimeLimit(activeTabId, activeTabDomain);
        }
      } catch (error) {
        console.error("Error updating time:", error);
      }
    }
  }
}, 1000);

// Update productivity score every 5 minutes
setInterval(async () => {
  if (isTracking) {
    await calculateProductivityScore();
  }
}, 5 * 60 * 1000);

// Setup daily alarms
function setupAlarms() {
  // Daily cleanup at midnight
  chrome.alarms.create("dailyCleanup", {
    periodInMinutes: 24 * 60,
    when: getNextMidnight(),
  });

  // Break reminder alarm (every hour by default)
  chrome.alarms.create("breakReminder", {
    periodInMinutes: 60,
  });

  // Time limit check alarm (every minute)
  chrome.alarms.create("limitCheck", {
    periodInMinutes: 1,
  });
}

// Check if a domain should still be limited
async function shouldDomainBeLimited(domain) {
  try {
    const data = await chrome.storage.local.get(["dailyLimits"]);
    const limits = data.dailyLimits || {};

    // If the domain no longer has a limit, it shouldn't be limited
    if (!limits[domain]) {
      return false;
    }

    // Otherwise, check if the current usage exceeds the limit
    return await checkLimits(domain);
  } catch (error) {
    console.error("Error checking domain limits:", error);
    return false;
  }
}

// Refresh limits after settings change
async function refreshLimits() {
  try {
    // Get all current limits
    const data = await chrome.storage.local.get(["dailyLimits"]);
    const currentLimits = data.dailyLimits || {};

    // For each domain that was previously exceeded
    for (const domain in limitExceeded) {
      // If domain no longer has a limit, or limit is no longer exceeded
      if (!currentLimits[domain] || !(await checkLimits(domain))) {
        delete limitExceeded[domain];
        // If this is the active domain, reload it
        if (domain === activeTabDomain) {
          try {
            const tabs = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });
            if (tabs[0]) {
              await chrome.tabs.reload(tabs[0].id);
            }
          } catch (error) {
            console.error("Error reloading tab:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error refreshing limits:", error);
  }
}

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyCleanup") {
    await cleanupOldData();
    // Reset limit exceeded status at midnight
    limitExceeded = {};
    dailyData = {};
  } else if (alarm.name === "breakReminder") {
    await handleBreakReminder();
  } else if (alarm.name === "limitCheck" && activeTabDomain) {
    // Only enforce limit if it should still be enforced
    if (await shouldDomainBeLimited(activeTabDomain)) {
      if (!limitExceeded[activeTabDomain]) {
        limitExceeded[activeTabDomain] = true;
        await enforceTimeLimit(activeTabId, activeTabDomain);
      }
    } else {
      // If limit no longer applies, remove from limitExceeded
      delete limitExceeded[activeTabDomain];
    }
  }
});

// Cleanup old data (keep last 30 days)
async function cleanupOldData() {
  try {
    const websiteData = await chrome.storage.local.get(["websiteData"]);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newData = Object.entries(websiteData).reduce((acc, [date, data]) => {
      if (new Date(date) >= thirtyDaysAgo) {
        acc[date] = data;
      }
      return acc;
    }, {});

    await chrome.storage.local.set({ websiteData: newData });
    console.log("Cleaned up old data");
  } catch (error) {
    console.error("Error cleaning up old data:", error);
  }
}

// Enhanced tab change handler
async function handleTabChange() {
  if (!isTracking) return;

  try {
    const tab = await chrome.tabs.get(activeTabId);

    // Record time for previous domain before switching
    if (activeTabDomain && startTime) {
      const timeSpent = Date.now() - (lastUpdateTime || startTime);
      if (timeSpent > 0) {
        const updatedData = await updateTimeSpent(activeTabDomain, timeSpent);
        if (updatedData) {
          dailyData[activeTabDomain] = updatedData;
        }
      }
    }

    if (tab.url && tab.url.startsWith("http")) {
      const newDomain = getDomainFromUrl(tab.url);
      console.log("Switched to domain:", newDomain);

      // Reset tracking for new domain
      activeTabDomain = newDomain;
      startTime = Date.now();
      lastUpdateTime = startTime;

      // Immediate limit check for new domain
      if (limitExceeded[newDomain]) {
        await enforceTimeLimit(activeTabId, newDomain);
      } else {
        const isLimitExceeded = await checkLimits(activeTabDomain);
        if (isLimitExceeded) {
          limitExceeded[newDomain] = true;
          await enforceTimeLimit(activeTabId, newDomain);
        }
      }
    } else {
      activeTabDomain = null;
      startTime = null;
      lastUpdateTime = null;
    }
  } catch (error) {
    console.error("Error handling tab change:", error);
  }
}

// Improved enforce time limit function
async function enforceTimeLimit(tabId, domain) {
  console.log(`Enforcing time limit for ${domain}`);

  // Show notification
  showNotification(
    "Time Limit Exceeded",
    `You've reached your daily limit for ${domain}.`
  );

  // Try to redirect to block page
  try {
    const blockUrl = chrome.runtime.getURL("block.html");
    await chrome.tabs.update(tabId, { url: blockUrl });
  } catch (error) {
    console.error("Error redirecting to block page:", error);
  }

  // Send message to content script as backup
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: "limitExceeded",
      domain: domain,
    });
  } catch (error) {
    console.error("Error sending limit exceeded message:", error);
  }
}

// Handle break reminders
async function handleBreakReminder() {
  if (!isTracking) return;

  const settings = await chrome.storage.local.get(["settings"]);
  if (!settings.breakReminders?.enabled) return;

  const todayKey = getTodayKey();
  const totalTimeToday = Object.values(dailyData).reduce(
    (sum, site) => sum + site.timeSpent,
    0
  );
  const minTimeForReminder =
    (settings.breakReminders?.minTimeForReminder || 30) * 60 * 1000;

  if (totalTimeToday > minTimeForReminder) {
    showNotification(
      "Time for a Break",
      "You've been using the computer for a while. Take a short break!"
    );
  }
}

// Get next midnight timestamp
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
  handleTabChange();
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === "complete") {
    handleTabChange();
  }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    isTracking = false;
    if (activeTabDomain && startTime) {
      const timeSpent = Date.now() - (lastUpdateTime || startTime);
      if (timeSpent > 0) {
        const updatedData = await updateTimeSpent(activeTabDomain, timeSpent);
        if (updatedData) {
          dailyData[activeTabDomain] = updatedData;
        }
      }
    }
  } else {
    // Browser gained focus
    isTracking = true;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        startTime = Date.now();
        lastUpdateTime = startTime;
        handleTabChange();
      }
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabInfo") {
    sendResponse({
      domain: activeTabDomain,
      isTracking: isTracking,
      isLimitExceeded: limitExceeded[activeTabDomain] || false,
    });
  } else if (request.action === "updateActivity") {
    // Reset tracking when user is active
    if (!isTracking) {
      isTracking = true;
      startTime = Date.now();
      lastUpdateTime = startTime;
    }
  } else if (request.action === "checkLimit") {
    // Check if limit should still be enforced
    shouldDomainBeLimited(activeTabDomain).then((should) => {
      if (!should) {
        delete limitExceeded[activeTabDomain];
      }
      sendResponse({
        isExceeded: limitExceeded[activeTabDomain] || false,
      });
    });
    return true;
  } else if (request.action === "openSettings") {
    chrome.runtime.openOptionsPage();
  } else if (request.action === "settingsUpdated") {
    // Refresh limits when settings are updated
    refreshLimits();
    sendResponse({ success: true });
  }
  return true;
});
