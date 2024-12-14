import { getBlockStatus } from '../utils/blocking.js';
import { getFocusStatus, shouldBlockInFocusMode } from '../utils/focus.js';
import { debounce, throttle, batchProcess } from '../utils/performance.js';
import NotificationService from './NotificationService.js';

// Initialize notification service
const notificationService = NotificationService;

// Performance optimized data structures
const activeTabTimes = new Map();
const messageQueue = new Map();
let isProcessingQueue = false;

// Debounced and throttled functions
const debouncedSaveStats = debounce(async (stats) => {
    try {
        await chrome.storage.local.set({ dailyStats: stats });
    } catch (error) {
        console.error('Error saving stats:', error);
        notificationService.handleNotificationRequest({
            type: 'syncError'
        });
    }
}, 1000);

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

        case 'FOCUS_MODE_STARTED':
            notificationService.handleNotificationRequest({
                type: 'focusModeStarted',
                params: [data.duration]
            });
            break;

        case 'FOCUS_MODE_ENDED':
            notificationService.handleNotificationRequest({
                type: 'focusModeComplete',
                params: [data.duration]
            });
            break;

        case 'TIME_LIMIT_WARNING':
            notificationService.handleNotificationRequest({
                type: 'timeLimitWarning',
                params: [data.domain, data.timeLeft]
            });
            break;

        // Handle other message types...
    }
}

// Existing event listeners and other functionality...
// [Previous implementation remains the same]

// Additional error handling for storage operations
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.lastError) {
        notificationService.handleNotificationRequest({
            type: 'syncError'
        });
    }
});

// Check storage usage periodically
chrome.alarms.create('checkStorage', {
    periodInMinutes: 60 // Check every hour
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkStorage') {
        notificationService.checkStorageUsage();
    }
});
