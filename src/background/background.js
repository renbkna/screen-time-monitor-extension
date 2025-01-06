// Constants
const ALARM_CHECK_LIMITS = 'checkLimits';
const CHECK_INTERVAL = 1; // Check every minute

// Initialize alarm for periodic limit checking
chrome.alarms.create(ALARM_CHECK_LIMITS, {
  periodInMinutes: CHECK_INTERVAL
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_CHECK_LIMITS) {
    checkTimeLimits();
  }
});

/**
 * Check time limits for all tracked websites
 */
async function checkTimeLimits() {
  try {
    const storage = await chrome.storage.local.get(['limits', 'timeData']);
    const limits = storage.limits || {};
    const timeData = storage.timeData || {};
    const today = new Date().toLocaleDateString();
    const startOfWeek = getStartOfWeek(new Date()).toLocaleDateString();

    // Get current tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) return;

    const domain = new URL(activeTab.url).hostname;
    const normalizedDomain = normalizeWebsite(domain);
    const limit = limits[normalizedDomain];

    if (!limit || !limit.enabled) return;

    // Check daily limit
    const dailyUsage = getDailyUsage(timeData, normalizedDomain, today);
    if (dailyUsage >= limit.dailyLimit * 60) { // Convert minutes to seconds
      handleLimitExceeded(activeTab, 'daily', limit);
      return;
    }

    // Check weekly limit
    const weeklyUsage = getWeeklyUsage(timeData, normalizedDomain, startOfWeek);
    if (weeklyUsage >= limit.weeklyLimit * 60) { // Convert minutes to seconds
      handleLimitExceeded(activeTab, 'weekly', limit);
      return;
    }

    // If approaching limit (90%), show warning
    const dailyThreshold = limit.dailyLimit * 60 * 0.9;
    const weeklyThreshold = limit.weeklyLimit * 60 * 0.9;

    if (dailyUsage >= dailyThreshold) {
      showLimitWarning(normalizedDomain, 'daily', limit.dailyLimit, dailyUsage);
    } else if (weeklyUsage >= weeklyThreshold) {
      showLimitWarning(normalizedDomain, 'weekly', limit.weeklyLimit, weeklyUsage);
    }
  } catch (error) {
    console.error('Error checking time limits:', error);
  }
}

/**
 * Handle when a limit is exceeded
 */
async function handleLimitExceeded(tab, type, limit) {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'Time Limit Exceeded',
    message: `You've exceeded your ${type} time limit for ${limit.website}`
  });

  // Redirect to blocked page
  await chrome.tabs.update(tab.id, {
    url: chrome.runtime.getURL(`/blocked.html?type=${type}&website=${limit.website}`)
  });
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