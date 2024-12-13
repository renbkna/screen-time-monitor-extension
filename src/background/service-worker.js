import { getBlockStatus } from '../utils/blocking.js';
import { getFocusStatus, shouldBlockInFocusMode, startFocusMode, endFocusMode } from '../utils/focus.js';
import { debounce, throttle, batchProcess } from '../utils/performance.js';
import { cleanupOldData, optimizeDataForStorage, compactStorageData, setupStorageMonitoring } from '../utils/storage-optimization.js';

// Performance optimized data structures
const activeTabTimes = new Map();
const messageQueue = new Map();
let isProcessingQueue = false;

// Debounced and throttled functions
const debouncedSaveStats = debounce(async (stats) => {
  const optimizedStats = optimizeDataForStorage(stats);
  await chrome.storage.local.set({ dailyStats: optimizedStats });
}, 1000);

const throttledUpdateTracking = throttle(async (tabId, startTime) => {
  await updateTimeTracking(tabId, startTime);
}, 5000);

// Message processing queue
async function processMessageQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    const batch = [];
    messageQueue.forEach((message, id) => {
      batch.push({ id, ...message });
      messageQueue.delete(id);
    });

    if (batch.length > 0) {
      await batchProcess(batch, async (item) => {
        try {
          await handleMessage(item);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
    }
  } finally {
    isProcessingQueue = false;
    if (messageQueue.size > 0) {
      setTimeout(processMessageQueue, 100);
    }
  }
}

// Enhanced message handling
async function handleMessage(message) {
  const { type, data, tabId } = message;

  switch (type) {
    case 'PAGE_VISIT':
      await handlePageVisit(data, tabId);
      break;

    case 'CHECK_BLOCK_STATUS':
      const blockStatus = await getBlockStatus(data.url);
      const focusBlockStatus = await shouldBlockInFocusMode(data.url);
      
      const finalStatus = {
        isBlocked: blockStatus.isBlocked || focusBlockStatus,
        reason: focusBlockStatus ? 'This site is blocked during focus mode' : blockStatus.reason,
        endTime: blockStatus.endTime
      };

      chrome.tabs.sendMessage(tabId, {
        type: 'BLOCK_STATUS',
        data: finalStatus
      });
      break;

    // ... other message handlers ...
  }
}

// Optimized runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const messageId = Date.now() + Math.random();
  messageQueue.set(messageId, {
    type: message.type,
    data: message.data,
    tabId: sender.tab?.id
  });

  processMessageQueue();
  return true; // Allow async response
});

// Enhanced page visit handling
async function handlePageVisit(data, tabId) {
  try {
    const { url, timestamp } = data;
    const domain = new URL(url).hostname;
    const today = new Date().toISOString().split('T')[0];
    
    // Get current stats with optimization
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
    
    // Initialize stats efficiently
    dailyStats[today] = dailyStats[today] || {};
    dailyStats[today][domain] = dailyStats[today][domain] || {
      totalTime: 0,
      visits: 0,
      lastVisit: null
    };

    // Update stats
    dailyStats[today][domain].visits++;
    dailyStats[today][domain].lastVisit = timestamp;

    // Save stats with debouncing
    await debouncedSaveStats(dailyStats);

    // Check blocking status
    const [blockStatus, focusBlockStatus] = await Promise.all([
      getBlockStatus(url),
      shouldBlockInFocusMode(url)
    ]);

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

// Optimized time tracking update
async function updateTimeTracking(tabId, startTime) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const domain = new URL(tab.url).hostname;
    const timeSpent = Date.now() - startTime;
    const today = new Date().toISOString().split('T')[0];

    // Get and update stats efficiently
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
    dailyStats[today] = dailyStats[today] || {};
    dailyStats[today][domain] = dailyStats[today][domain] || {
      totalTime: 0,
      visits: 0,
      lastVisit: null
    };

    dailyStats[today][domain].totalTime += timeSpent;

    // Save with optimization
    await debouncedSaveStats(dailyStats);

    // Check blocking status efficiently
    const [blockStatus, focusBlockStatus] = await Promise.all([
      getBlockStatus(tab.url),
      shouldBlockInFocusMode(tab.url)
    ]);

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

// Enhanced tab and idle listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { tabId } = activeInfo;
  const tab = await chrome.tabs.get(tabId);
  
  // Update previous tab timing
  for (const [oldTabId, startTime] of activeTabTimes.entries()) {
    if (oldTabId !== tabId) {
      throttledUpdateTracking(oldTabId, startTime);
      activeTabTimes.delete(oldTabId);
    }
  }

  // Start tracking new tab
  if (tab.url && !tab.url.startsWith('chrome://')) {
    activeTabTimes.set(tabId, Date.now());
  }
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'idle' || state === 'locked') {
    // Batch process all active tabs
    const tabUpdates = Array.from(activeTabTimes.entries())
      .map(([tabId, startTime]) => ({ tabId, startTime }));

    batchProcess(tabUpdates, async (item) => {
      await updateTimeTracking(item.tabId, item.startTime);
    });

    activeTabTimes.clear();
  }
});

// Initialize performance optimizations
setupStorageMonitoring();

// Setup cleanup alarms with optimized intervals
chrome.alarms.create('cleanup', { periodInMinutes: 1440 }); // Daily cleanup
chrome.alarms.create('storageOptimization', { periodInMinutes: 60 }); // Hourly optimization

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'focusMode':
      await endFocusMode();
      notifyAllTabs('FOCUS_MODE_CHANGED', { enabled: false });
      break;
    case 'cleanup':
      await cleanupOldData();
      break;
    case 'storageOptimization':
      const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
      const optimizedStats = compactStorageData(dailyStats);
      await chrome.storage.local.set({ dailyStats: optimizedStats });
      break;
  }
});
