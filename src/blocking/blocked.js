import { formatTime } from '../utils/timeUtils.js';
import { extractDomain } from '../utils/browserUtils.js';

class BlockedPage {
    constructor() {
        this.blockReason = '';
        this.timeRemaining = 0;
        this.blockType = '';
        this.domain = '';
        this.timerInterval = null;
        this.initializeBlockedPage();
    }

    async initializeBlockedPage() {
        this.parseUrlParams();
        await this.loadBlockInfo();
        this.setupEventListeners();
        this.loadSuggestions();
        await this.loadDailyStats();
        this.startTimer();
    }

    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.domain = urlParams.get('domain') || '';
        this.blockType = urlParams.get('type') || '';
    }

    async loadBlockInfo() {
        try {
            if (this.blockType === 'focus') {
                const { focusMode } = await chrome.storage.local.get('focusMode');
                if (focusMode?.enabled) {
                    this.blockReason = 'This site is blocked during focus mode';
                    this.timeRemaining = Math.max(0, Math.floor((focusMode.endTime - Date.now()) / 1000));
                }
            } else {
                const { limits } = await chrome.storage.local.get('limits');
                const limit = limits?.[this.domain];
                if (limit) {
                    this.blockReason = `You've reached your ${limit.type} time limit for this site`;
                    this.timeRemaining = limit.resetTime ? Math.max(0, Math.floor((limit.resetTime - Date.now()) / 1000)) : 0;
                }
            }

            this.updateDisplay();
        } catch (error) {
            console.error('Error loading block info:', error);
            this.showNotification('Error loading block information', 'error');
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-button').addEventListener('click', () => {
            window.history.back();
        });

        // Override button
        document.getElementById('override-button').addEventListener('click', () => {
            document.getElementById('override-form').classList.remove('hidden');
        });

        // Cancel override
        document.getElementById('cancel-override').addEventListener('click', () => {
            document.getElementById('override-form').classList.add('hidden');
        });

        // Confirm override
        document.getElementById('confirm-override').addEventListener('click', () => {
            this.handleOverride();
        });

        // Suggestion clicks
        document.getElementById('suggestions-list').addEventListener('click', (e) => {
            const suggestionCard = e.target.closest('.suggestion-card');
            if (suggestionCard) {
                const url = suggestionCard.dataset.url;
                if (url) window.location.href = url;
            }
        });
    }

    async handleOverride() {
        const reason = document.getElementById('override-reason').value.trim();
        
        if (!reason) {
            this.showNotification('Please provide a reason for override', 'warning');
            return;
        }

        try {
            // Record override
            const override = {
                timestamp: Date.now(),
                domain: this.domain,
                reason,
                blockType: this.blockType
            };

            const { overrides = [] } = await chrome.storage.local.get('overrides');
            overrides.unshift(override);
            
            // Keep only last 50 overrides
            if (overrides.length > 50) overrides.pop();
            
            await chrome.storage.local.set({ overrides });

            // If in focus mode, temporarily allow site
            if (this.blockType === 'focus') {
                const { focusMode } = await chrome.storage.local.get('focusMode');
                if (focusMode?.enabled) {
                    focusMode.allowedSites = focusMode.allowedSites || [];
                    focusMode.allowedSites.push(this.domain);
                    await chrome.storage.local.set({ focusMode });
                }
            } else {
                // For time limits, grant 15-minute extension
                const { limits } = await chrome.storage.local.get('limits');
                if (limits?.[this.domain]) {
                    limits[this.domain].resetTime = Date.now() + (15 * 60 * 1000);
                    await chrome.storage.local.set({ limits });
                }
            }

            // Redirect to original site
            window.location.href = `https://${this.domain}`;
        } catch (error) {
            console.error('Error handling override:', error);
            this.showNotification('Error processing override', 'error');
        }
    }

    startTimer() {
        if (this.timeRemaining > 0) {
            this.timerInterval = setInterval(() => {
                this.timeRemaining = Math.max(0, this.timeRemaining - 1);
                this.updateTimeDisplay();
                
                if (this.timeRemaining === 0) {
                    clearInterval(this.timerInterval);
                    this.checkBlockStatus();
                }
            }, 1000);
        }
    }

    updateDisplay() {
        document.getElementById('block-reason').textContent = this.blockReason;
        this.updateTimeDisplay();
    }

    updateTimeDisplay() {
        const timeDisplay = document.getElementById('time-remaining');
        if (this.timeRemaining > 0) {
            const hours = Math.floor(this.timeRemaining / 3600);
            const minutes = Math.floor((this.timeRemaining % 3600) / 60);
            const seconds = this.timeRemaining % 60;
            
            let timeStr = '';
            if (hours > 0) timeStr += `${hours}h `;
            if (minutes > 0) timeStr += `${minutes}m `;
            timeStr += `${seconds}s`;
            
            timeDisplay.textContent = `Time remaining: ${timeStr}`;
        } else {
            timeDisplay.textContent = 'Block active';
        }
    }

    async loadSuggestions() {
        const suggestions = [
            {
                title: 'Take a Break',
                description: 'Step away from the screen for a few minutes',
                url: '#'
            },
            {
                title: 'Breathing Exercise',
                description: 'Try a quick mindfulness exercise',
                url: 'https://www.calm.com/breathe'
            },
            {
                title: 'Productive Alternative',
                description: 'Work on your priority tasks',
                url: 'https://todoist.com'
            },
            {
                title: 'Learn Something',
                description: 'Take a quick educational break',
                url: 'https://www.coursera.org'
            }
        ];

        const suggestionsList = document.getElementById('suggestions-list');
        suggestionsList.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-card" data-url="${suggestion.url}">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
            </div>
        `).join('');
    }

    async loadDailyStats() {
        try {
            const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
            const today = new Date().toISOString().split('T')[0];
            const todayStats = dailyStats[today] || {};

            // Calculate stats
            const totalTime = Object.values(todayStats).reduce((sum, site) => sum + (site.totalTime || 0), 0);
            const totalSites = Object.keys(todayStats).length;
            const mostVisited = Object.entries(todayStats)
                .sort((a, b) => b[1].visits - a[1].visits)[0];

            const statsGrid = document.getElementById('daily-stats');
            statsGrid.innerHTML = `
                <div class="stat-item">
                    <div class="stat-label">Total Time</div>
                    <div class="stat-value">${formatTime(totalTime)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Sites Visited</div>
                    <div class="stat-value">${totalSites}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Most Visited</div>
                    <div class="stat-value">${mostVisited ? extractDomain(mostVisited[0]) : 'N/A'}</div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading daily stats:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    async checkBlockStatus() {
        try {
            if (this.blockType === 'focus') {
                const { focusMode } = await chrome.storage.local.get('focusMode');
                if (!focusMode?.enabled) {
                    window.location.reload();
                }
            } else {
                const { limits } = await chrome.storage.local.get('limits');
                if (!limits?.[this.domain]?.isBlocked) {
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Error checking block status:', error);
        }
    }
}

// Initialize blocked page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlockedPage();
});
