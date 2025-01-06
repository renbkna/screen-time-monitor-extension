/**
 * Handles all notification-related functionality for the extension
 */

class NotificationManager {
    constructor() {
        // Initialize notification settings with defaults
        this.loadSettings();
        this.setupListeners();
        this.notificationQueue = [];
        this.isProcessingQueue = false;
    }

    async loadSettings() {
        const { notificationSettings = this.getDefaultSettings() } = 
            await chrome.storage.local.get('notificationSettings');
        this.settings = notificationSettings;
    }

    getDefaultSettings() {
        return {
            enabled: true,
            types: {
                timeLimit: true,
                focusMode: true,
                dailyDigest: true,
                weeklyReport: true,
                achievements: true
            },
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            },
            // Maximum notifications per hour
            rateLimit: 10
        };
    }

    setupListeners() {
        // Listen for notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => 
            this.handleNotificationClick(notificationId));

        // Listen for button clicks in notifications
        chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => 
            this.handleButtonClick(notificationId, buttonIndex));

        // Listen for notification close
        chrome.notifications.onClosed.addListener((notificationId, byUser) => 
            this.handleNotificationClosed(notificationId, byUser));
    }

    async create(options) {
        if (!this.settings.enabled) return;
        
        // Check quiet hours
        if (this.isQuietHours()) return;

        // Check rate limiting
        if (await this.isRateLimited()) return;

        // Check if notification type is enabled
        if (!this.settings.types[options.type]) return;

        const notificationId = `${options.type}_${Date.now()}`;
        
        // Add to queue
        this.notificationQueue.push({
            id: notificationId,
            options: {
                type: 'basic',
                iconUrl: '/assets/icons/icon128.png',
                priority: 0,
                ...options
            }
        });

        await this.processQueue();
        return notificationId;
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        try {
            while (this.notificationQueue.length > 0) {
                const notification = this.notificationQueue.shift();
                await this.showNotification(notification.id, notification.options);
                // Add small delay between notifications
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    async showNotification(id, options) {
        try {
            await chrome.notifications.create(id, options);
            await this.recordNotification(id, options);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    async recordNotification(id, options) {
        const { notificationHistory = [] } = await chrome.storage.local.get('notificationHistory');
        
        notificationHistory.unshift({
            id,
            timestamp: Date.now(),
            type: options.type,
            title: options.title
        });

        // Keep last 100 notifications
        if (notificationHistory.length > 100) {
            notificationHistory.pop();
        }

        await chrome.storage.local.set({ notificationHistory });
    }

    async isRateLimited() {
        const { notificationHistory = [] } = await chrome.storage.local.get('notificationHistory');
        const hourAgo = Date.now() - (60 * 60 * 1000);
        const recentCount = notificationHistory.filter(n => n.timestamp > hourAgo).length;
        
        return recentCount >= this.settings.rateLimit;
    }

    isQuietHours() {
        if (!this.settings.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        
        const start = this.timeStringToNumber(this.settings.quietHours.start);
        const end = this.timeStringToNumber(this.settings.quietHours.end);

        if (start <= end) {
            return currentTime >= start && currentTime < end;
        } else {
            // Handle overnight quiet hours
            return currentTime >= start || currentTime < end;
        }
    }

    timeStringToNumber(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 100 + minutes;
    }

    async handleNotificationClick(notificationId) {
        const [type] = notificationId.split('_');

        switch (type) {
            case 'timeLimit':
                await this.openPopupToTab('limits');
                break;
            case 'focusMode':
                await this.openPopupToTab('focus');
                break;
            case 'dailyDigest':
            case 'weeklyReport':
                await this.openPopupToTab('stats');
                break;
            case 'achievements':
                await this.openPopupToTab('achievements');
                break;
        }

        // Clear the notification
        await chrome.notifications.clear(notificationId);
    }

    async handleButtonClick(notificationId, buttonIndex) {
        const [type] = notificationId.split('_');

        // Handle focus mode notifications
        if (type === 'focusMode') {
            if (buttonIndex === 0) { // End session
                await this.endFocusSession();
            }
        }

        // Handle time limit notifications
        if (type === 'timeLimit') {
            if (buttonIndex === 0) { // Add 15 minutes
                await this.extendTimeLimit(15);
            }
        }

        // Clear the notification
        await chrome.notifications.clear(notificationId);
    }

    async handleNotificationClosed(notificationId, byUser) {
        if (byUser) {
            // Update user interaction metrics
            const { notificationMetrics = {} } = await chrome.storage.local.get('notificationMetrics');
            const [type] = notificationId.split('_');
            
            notificationMetrics[type] = notificationMetrics[type] || {
                shown: 0,
                dismissed: 0,
                clicked: 0
            };
            
            notificationMetrics[type].dismissed++;
            
            await chrome.storage.local.set({ notificationMetrics });
        }
    }

    async openPopupToTab(tab) {
        const popup = await chrome.action.getPopup({});
        if (popup) {
            chrome.runtime.sendMessage({ type: 'SWITCH_TAB', data: { tab } });
            chrome.action.openPopup();
        }
    }

    async endFocusSession() {
        await chrome.runtime.sendMessage({ type: 'END_FOCUS_SESSION' });
    }

    async extendTimeLimit(minutes) {
        await chrome.runtime.sendMessage({
            type: 'EXTEND_TIME_LIMIT',
            data: { minutes }
        });
    }

    // Utility method to update settings
    async updateSettings(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        await chrome.storage.local.set({ notificationSettings: this.settings });
    }
}

export default new NotificationManager();
