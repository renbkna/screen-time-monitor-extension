/**
 * Background service for handling notifications
 */

import NotificationManager from '../utils/NotificationManager.js';
import { NotificationTemplates } from '../utils/notificationTemplates.js';
import { formatTime } from '../utils/timeUtils.js';

class NotificationService {
    constructor() {
        this.setupNotificationTriggers();
        this.setupMessageListeners();
    }

    setupNotificationTriggers() {
        // Time limit notifications
        chrome.alarms.create('checkTimeLimits', {
            periodInMinutes: 1
        });

        // Daily digest
        chrome.alarms.create('dailyDigest', {
            when: this.getNextTime(20), // 8 PM
            periodInMinutes: 24 * 60
        });

        // Weekly report
        chrome.alarms.create('weeklyReport', {
            when: this.getNextWeeklyTime(0, 10), // Sunday 10 AM
            periodInMinutes: 7 * 24 * 60
        });

        // Listen for alarms
        chrome.alarms.onAlarm.addListener((alarm) => this.handleAlarm(alarm));
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SHOW_NOTIFICATION') {
                this.handleNotificationRequest(message.data);
                return true; // Allow async response
            }
        });
    }

    async handleAlarm(alarm) {
        switch (alarm.name) {
            case 'checkTimeLimits':
                await this.checkTimeLimits();
                break;
            case 'dailyDigest':
                await this.sendDailyDigest();
                break;
            case 'weeklyReport':
                await this.sendWeeklyReport();
                break;
        }
    }

    async handleNotificationRequest(data) {
        const { type, params } = data;
        if (NotificationTemplates[type]) {
            const template = NotificationTemplates[type](...params);
            await NotificationManager.create(template);
        }
    }

    async checkTimeLimits() {
        try {
            const { limits, dailyStats } = await chrome.storage.local.get(['limits', 'dailyStats']);
            const today = new Date().toISOString().split('T')[0];
            const todayStats = dailyStats[today] || {};

            for (const [domain, limit] of Object.entries(limits)) {
                if (!limit.enabled) continue;

                const timeSpent = todayStats[domain]?.totalTime || 0;
                const timeLeft = limit.dailyLimit - timeSpent;

                // Warning at 90% of limit
                if (timeLeft > 0 && timeLeft <= (limit.dailyLimit * 0.1)) {
                    await NotificationManager.create(
                        NotificationTemplates.timeLimitWarning(domain, timeLeft)
                    );
                }
                // Limit reached
                else if (timeLeft <= 0 && !limit.notified) {
                    await NotificationManager.create(
                        NotificationTemplates.timeLimitReached(domain)
                    );
                    // Update notification flag
                    limits[domain].notified = true;
                    await chrome.storage.local.set({ limits });
                }
            }
        } catch (error) {
            console.error('Error checking time limits:', error);
        }
    }

    async sendDailyDigest() {
        try {
            const { dailyStats } = await chrome.storage.local.get('dailyStats');
            const today = new Date().toISOString().split('T')[0];
            const todayStats = dailyStats[today] || {};

            // Calculate statistics
            const totalTime = Object.values(todayStats)
                .reduce((sum, site) => sum + (site.totalTime || 0), 0);

            const topSite = Object.entries(todayStats)
                .sort((a, b) => b[1].totalTime - a[1].totalTime)[0]?.[0] || 'None';

            const { focusStats = [] } = await chrome.storage.local.get('focusStats');
            const focusSessions = focusStats
                .filter(session => session.date === today).length;

            await NotificationManager.create(
                NotificationTemplates.dailyDigest({
                    totalTime,
                    topSite,
                    focusSessions
                })
            );
        } catch (error) {
            console.error('Error sending daily digest:', error);
        }
    }

    async sendWeeklyReport() {
        try {
            const { dailyStats, focusStats = [] } = 
                await chrome.storage.local.get(['dailyStats', 'focusStats']);

            // Get dates for the past week
            const dates = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            });

            // Calculate statistics
            let totalTime = 0;
            dates.forEach(date => {
                const dayStats = dailyStats[date] || {};
                totalTime += Object.values(dayStats)
                    .reduce((sum, site) => sum + (site.totalTime || 0), 0);
            });

            const dailyAverage = totalTime / 7;
            const focusTime = focusStats
                .filter(session => dates.includes(session.date))
                .reduce((sum, session) => sum + session.duration, 0);

            await NotificationManager.create(
                NotificationTemplates.weeklyReport({
                    totalTime,
                    dailyAverage,
                    focusTime
                })
            );
        } catch (error) {
            console.error('Error sending weekly report:', error);
        }
    }

    getNextTime(hour) {
        const now = new Date();
        const next = new Date();
        next.setHours(hour, 0, 0, 0);
        
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        
        return next.getTime();
    }

    getNextWeeklyTime(dayOfWeek, hour) {
        const now = new Date();
        const next = new Date();
        next.setHours(hour, 0, 0, 0);

        // Get next occurrence of the specified day
        while (next.getDay() !== dayOfWeek || next <= now) {
            next.setDate(next.getDate() + 1);
        }

        return next.getTime();
    }

    // Check storage usage and notify if needed
    async checkStorageUsage() {
        try {
            const { bytesInUse, quota } = await chrome.storage.local.getBytesInUse();
            const percentUsed = Math.round((bytesInUse / quota) * 100);

            if (percentUsed > 80) {
                await NotificationManager.create(
                    NotificationTemplates.storageWarning(percentUsed)
                );
            }
        } catch (error) {
            console.error('Error checking storage usage:', error);
        }
    }
}

export default new NotificationService();
