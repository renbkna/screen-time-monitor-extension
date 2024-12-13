/**
 * Focus mode utilities
 */

import { recordFocusSession } from './focus-statistics.js';

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
    allowedSites,
    interrupted: false
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

  // Schedule notifications
  const halfwayPoint = Date.now() + (duration * 60 * 1000) / 2;
  const fiveMinWarning = endTime - (5 * 60 * 1000);

  chrome.alarms.create('focusHalfway', { when: halfwayPoint });
  chrome.alarms.create('focusWarning', { when: fiveMinWarning });
}

// End focus session
export async function endFocusMode(wasInterrupted = false) {
  const { focusMode } = await chrome.storage.local.get('focusMode');
  
  if (focusMode?.enabled) {
    const actualDuration = Math.round((Date.now() - focusMode.startTime) / (60 * 1000));
    const completedSuccessfully = !wasInterrupted && actualDuration >= focusMode.duration * 0.9; // 90% completion threshold

    // Record session statistics
    await recordFocusSession(actualDuration, completedSuccessfully);

    // Clear focus mode state
    await chrome.storage.local.set({
      focusMode: {
        enabled: false,
        endTime: null,
        startTime: null,
        duration: 0,
        blockedSites: [],
        allowedSites: [],
        interrupted: wasInterrupted
      }
    });

    // Clear all focus-related alarms
    await Promise.all([
      chrome.alarms.clear('focusMode'),
      chrome.alarms.clear('focusHalfway'),
      chrome.alarms.clear('focusWarning')
    ]);

    // Show completion notification
    if (completedSuccessfully) {
      chrome.notifications.create('focusComplete', {
        type: 'basic',
        iconUrl: '../assets/icon-128.png',
        title: 'Focus Session Complete!',
        message: `Great job! You've completed a ${actualDuration} minute focus session.`,
        buttons: [{ title: 'View Stats' }]
      });
    }

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

// Handle notifications when a site is blocked
export async function handleBlockedSiteNotification(url) {
  const focusMode = await getFocusStatus();
  const remainingTime = await getRemainingFocusTime();

  if (focusMode.enabled) {
    chrome.notifications.create(`blocked-${Date.now()}`, {
      type: 'basic',
      iconUrl: '../assets/icon-128.png',
      title: 'Site Blocked During Focus Mode',
      message: `${url} is blocked for the next ${remainingTime} minutes. Stay focused!`,
      buttons: [
        { title: 'Continue Focusing' },
        { title: 'End Focus Session' }
      ]
    });
  }
}

// Get a list of suggested focus session templates
export function getFocusTemplates() {
  return [
    {
      name: 'Quick Focus',
      duration: 25,
      blockedSites: [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'reddit.com'
      ],
      allowedSites: [
        'docs.google.com',
        'github.com'
      ]
    },
    {
      name: 'Deep Work',
      duration: 90,
      blockedSites: [
        '*',  // Block all sites by default
      ],
      allowedSites: [
        'docs.google.com',
        'github.com',
        'stackoverflow.com'
      ]
    },
    {
      name: 'Study Session',
      duration: 45,
      blockedSites: [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'netflix.com',
        'reddit.com'
      ],
      allowedSites: [
        '*.edu',
        'wikipedia.org',
        'scholar.google.com'
      ]
    }
  ];
}
