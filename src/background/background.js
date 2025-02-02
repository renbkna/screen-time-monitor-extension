// Constants
const ALARM_CHECK_LIMITS = 'checkLimits';
const CHECK_INTERVAL = 1; // Check every minute

// Initialize alarm for periodic limit checking
chrome.alarms.create(ALARM_CHECK_LIMITS, {
  periodInMinutes: CHECK_INTERVAL
});

// Listen for alarm with error handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_CHECK_LIMITS) {
    try {
      await checkTimeLimits();
    } catch (error) {
      console.error('Alarm handler failed:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon48.png',
        title: 'System Error',
        message: 'Failed to check time limits. Please reload the extension.'
      });
    }
  }
});

/**
 * Check time limits for all tracked websites
 */
// Throttle storage operations to 1 per second
const storageQueue = [];
let isProcessing = false;

async function processStorageQueue() {
  if (isProcessing || !storageQueue.length) return;
  isProcessing = true;
  
  try {
    const operation = storageQueue.shift();
    await operation();
  } catch (error) {
    console.error('Storage operation failed:', error);
  } finally {
    isProcessing = false;
    processStorageQueue();
  }
}

// Validate URL format
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Sanitize input for notifications
function sanitizeString(input) {
  return input.replace(/</g, "<").replace(/>/g, ">");
}

// Convert minutes to seconds
const MINUTES_TO_SECONDS = 60;
const WARNING_THRESHOLD = 0.9;

async function checkTimeLimits() {
  try {
    // Throttled storage access
    const storage = await new Promise((resolve, reject) => {
      storageQueue.push(async () => {
        try {
          const result = await chrome.storage.local.get(['limits', 'timeData']);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      processStorageQueue();
    });
    const limits = storage.limits || {};
    const timeData = storage.timeData || {};
    const today = new Date().toLocaleDateString();
    const startOfWeek = getStartOfWeek(new Date()).toLocaleDateString();

    // Get current tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      .catch(error => {
        console.error('Tab query failed:', error);
        return [null];
      });
    
    if (!activeTab?.url || !isValidURL(activeTab.url)) return;

    const domain = new URL(activeTab.url).hostname || '';
    const normalizedDomain = normalizeWebsite(domain);
    const limit = limits[normalizedDomain];

    if (!limit || !limit.enabled) return;

    // Check daily limit
    const dailyUsage = getDailyUsage(timeData, normalizedDomain, today);
    if (dailyUsage >= limit.dailyLimit * MINUTES_TO_SECONDS) {
      handleLimitExceeded(activeTab, 'daily', limit);
      return;
    }

    // Check weekly limit
    const weeklyUsage = getWeeklyUsage(timeData, normalizedDomain, startOfWeek);
    if (weeklyUsage >= limit.weeklyLimit * MINUTES_TO_SECONDS) {
      handleLimitExceeded(activeTab, 'weekly', limit);
      return;
    }

    // If approaching limit (90%), show warning
    const dailyThreshold = limit.dailyLimit * MINUTES_TO_SECONDS * WARNING_THRESHOLD;
    const weeklyThreshold = limit.weeklyLimit * MINUTES_TO_SECONDS * WARNING_THRESHOLD;

    const sanitizedDomain = sanitizeString(normalizedDomain);
    if (dailyUsage >= dailyThreshold) {
      showLimitWarning(sanitizedDomain, 'daily', limit.dailyLimit, dailyUsage);
    } else if (weeklyUsage >= weeklyThreshold) {
      showLimitWarning(sanitizedDomain, 'weekly', limit.weeklyLimit, weeklyUsage);
    }
  } catch (error) {
    console.error('Error checking time limits:', error);
  }
}

/**
 * Handle when a limit is exceeded
 */
async function handleLimitExceeded(tab, type, limit) {
  try {
    const sanitizedType = sanitizeString(type);
    const sanitizedWebsite = sanitizeString(limit.website);
    
    // Show notification
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: 'Time Limit Exceeded',
      message: `You've exceeded your ${sanitizedType} time limit for ${sanitizedWebsite}`
    }).catch(error => console.error('Notification failed:', error));

    // Redirect to blocked page
    if (tab.id) {
      await chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL(
          `/blocked.html?type=${encodeURIComponent(sanitizedType)}&website=${encodeURIComponent(sanitizedWebsite)}`
        )
      }).catch(error => console.error('Tab update failed:', error));
    }
  } catch (error) {
    console.error('Limit exceeded handler failed:', error);
  }
}

/**
 * Show warning when approaching limit
 */
function showLimitWarning(domain, type, limit, usage) {
  const remaining = Math.round((limit * 60 - usage) / 60); // Convert to minutes
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'Time Limit Warning',
    message: `You have ${remaining} minutes remaining of your ${type} limit for ${domain}`
  });
}

/**
 * Get daily usage for a domain
 */
function getDailyUsage(timeData, domain, date) {
  return timeData[date]?.[domain]?.totalTime || 0;
}

/**
 * Get weekly usage for a domain
 */
function getWeeklyUsage(timeData, domain, startDate) {
  let totalTime = 0;
  const startTimestamp = new Date(startDate).getTime();
  
  Object.entries(timeData).forEach(([date, data]) => {
    if (new Date(date).getTime() >= startTimestamp) {
      totalTime += data[domain]?.totalTime || 0;
    }
  });
  
  return totalTime;
}

/**
 * Get start of the week (Sunday) for a given date
 */
function getStartOfWeek(date) {
  const newDate = new Date(date);
  const day = newDate.getDay();
  newDate.setDate(newDate.getDate() - day);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Normalize website URL by removing protocol and www
 */
function normalizeWebsite(website) {
  return website.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
}

// Initialize limits checking when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  // Ensure storage is initialized
  const storage = await chrome.storage.local.get(['limits', 'timeData']);
  if (!storage.limits) {
    await chrome.storage.local.set({ limits: {} });
  }
  if (!storage.timeData) {
    await chrome.storage.local.set({ timeData: {} });
  }
});
