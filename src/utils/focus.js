/**
 * Focus mode utilities
 */

// Get focus mode status
export async function getFocusStatus() {
  const { focusMode = { enabled: false } } = await chrome.storage.local.get('focusMode');
  return focusMode;
}

// Start a focus session
export async function startFocusMode(duration, blockedSites = [], allowedSites = []) {
  const endTime = Date.now() + duration * 60 * 1000; // Convert minutes to milliseconds
  
  const focusMode = {
    enabled: true,
    endTime,
    startTime: Date.now(),
    duration, // in minutes
    blockedSites,
    allowedSites
  };

  await chrome.storage.local.set({ focusMode });
  
  // Set up alarm to end focus mode
  await chrome.alarms.create('focusMode', {
    when: endTime
  });

  // Notify any open tabs about focus mode change
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'FOCUS_MODE_CHANGED',
        data: { enabled: true }
      });
    });
  });
}

// End focus session
export async function endFocusMode() {
  await chrome.storage.local.set({
    focusMode: {
      enabled: false,
      endTime: null,
      startTime: null,
      duration: 0,
      blockedSites: [],
      allowedSites: []
    }
  });

  // Clear the focus mode alarm
  await chrome.alarms.clear('focusMode');

  // Notify any open tabs about focus mode change
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'FOCUS_MODE_CHANGED',
        data: { enabled: false }
      });
    });
  });
}

// Check if a URL should be blocked in focus mode
export async function shouldBlockInFocusMode(url) {
  const focusMode = await getFocusStatus();
  
  if (!focusMode.enabled) {
    return false;
  }

  try {
    const domain = new URL(url).hostname;

    // Check if site is explicitly allowed
    if (focusMode.allowedSites.some(pattern => 
      new RegExp(pattern.replace(/\*/g, '.*')).test(domain)
    )) {
      return false;
    }

    // Check if site is explicitly blocked
    if (focusMode.blockedSites.some(pattern => 
      new RegExp(pattern.replace(/\*/g, '.*')).test(domain)
    )) {
      return true;
    }

    // If no explicit rules, site is allowed
    return false;
  } catch (error) {
    console.error('Error checking focus mode block status:', error);
    return false;
  }
}

// Get remaining focus time in minutes
export async function getRemainingFocusTime() {
  const focusMode = await getFocusStatus();
  
  if (!focusMode.enabled || !focusMode.endTime) {
    return 0;
  }

  const remaining = focusMode.endTime - Date.now();
  return Math.max(0, Math.floor(remaining / (60 * 1000))); // Convert to minutes
}
