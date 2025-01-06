/**
 * Notification templates for different scenarios
 */

import { formatTime } from './timeUtils.js';

export const NotificationTemplates = {
    // Time limit notifications
    timeLimitWarning: (domain, timeLeft) => ({
        type: 'timeLimit',
        title: 'Time Limit Warning',
        message: `You have ${formatTime(timeLeft)} remaining on ${domain}`,
        priority: 1,
        buttons: [
            { title: 'Add 15 Minutes' }
        ]
    }),

    timeLimitReached: (domain) => ({
        type: 'timeLimit',
        title: 'Time Limit Reached',
        message: `You've reached your time limit for ${domain}`,
        priority: 2,
        requireInteraction: true,
        buttons: [
            { title: 'Add 15 Minutes' },
            { title: 'View Stats' }
        ]
    }),

    // Focus mode notifications
    focusModeStarted: (duration) => ({
        type: 'focusMode',
        title: 'Focus Mode Started',
        message: `Focus mode active for ${duration} minutes. Stay focused!`,
        priority: 1,
        buttons: [
            { title: 'End Session' }
        ]
    }),

    focusModeHalfway: (timeLeft) => ({
        type: 'focusMode',
        title: 'Focus Session Update',
        message: `${formatTime(timeLeft)} remaining in your focus session. Keep going!`,
        priority: 0
    }),

    focusModeEnding: () => ({
        type: 'focusMode',
        title: 'Focus Session Ending Soon',
        message: 'Your focus session ends in 5 minutes',
        priority: 1
    }),

    focusModeComplete: (duration) => ({
        type: 'focusMode',
        title: 'Focus Session Complete',
        message: `Great job! You've completed a ${duration} minute focus session.`,
        priority: 1,
        buttons: [
            { title: 'View Stats' }
        ]
    }),

    // Daily digest notifications
    dailyDigest: (stats) => ({
        type: 'dailyDigest',
        title: 'Daily Screen Time Update',
        message: `Today: ${formatTime(stats.totalTime)}\n` +
                `Most visited: ${stats.topSite}\n` +
                `Focus sessions: ${stats.focusSessions}`,
        priority: 0,
        buttons: [
            { title: 'View Details' }
        ]
    }),

    // Weekly report notifications
    weeklyReport: (stats) => ({
        type: 'weeklyReport',
        title: 'Weekly Screen Time Report',
        message: `Weekly total: ${formatTime(stats.totalTime)}\n` +
                `Daily average: ${formatTime(stats.dailyAverage)}\n` +
                `Focus time: ${formatTime(stats.focusTime)}`,
        priority: 1,
        buttons: [
            { title: 'View Report' }
        ]
    }),

    // Achievement notifications
    achievementUnlocked: (achievement) => ({
        type: 'achievements',
        title: 'Achievement Unlocked! 🏆',
        message: `${achievement.title}\n${achievement.description}`,
        priority: 1,
        buttons: [
            { title: 'View Achievements' }
        ]
    }),

    // Milestone notifications
    focusMilestone: (milestone) => ({
        type: 'achievements',
        title: 'Focus Milestone Reached! 🎯',
        message: `You've completed ${milestone} focus sessions!`,
        priority: 1
    }),

    productivityStreak: (days) => ({
        type: 'achievements',
        title: 'Productivity Streak! 🔥',
        message: `You've maintained healthy screen time for ${days} days!`,
        priority: 1
    }),

    // Warning notifications
    highUsageWarning: (time) => ({
        type: 'timeLimit',
        title: 'High Screen Time Warning',
        message: `You've been online for ${formatTime(time)} today`,
        priority: 1,
        buttons: [
            { title: 'View Breakdown' },
            { title: 'Start Focus Mode' }
        ]
    }),

    // Error notifications
    syncError: () => ({
        type: 'error',
        title: 'Sync Error',
        message: 'Unable to sync your settings. Some features may be limited.',
        priority: 2,
        buttons: [
            { title: 'Try Again' }
        ]
    }),

    storageWarning: (percentUsed) => ({
        type: 'error',
        title: 'Storage Warning',
        message: `Extension storage is ${percentUsed}% full. Consider clearing old data.`,
        priority: 1,
        buttons: [
            { title: 'Manage Storage' }
        ]
    }),

    // Update notifications
    extensionUpdate: (version, features) => ({
        type: 'system',
        title: `Updated to v${version}`,
        message: `New features:\n${features.join('\n')}`,
        priority: 1,
        buttons: [
            { title: 'Learn More' }
        ]
    })
};
