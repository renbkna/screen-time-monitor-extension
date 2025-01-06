import { StatsViewer } from '../components/StatsViewer.jsx';
import { getCurrentTabInfo } from '../utils/browserUtils.js';
import { formatTime } from '../utils/timeUtils.js';

class PopupManager {
    constructor() {
        this.currentTab = null;
        this.statsViewer = null;
        this.initializePopup();
    }

    async initializePopup() {
        // Initialize components
        this.initializeTabNavigation();
        this.initializeStatsViewer();
        
        // Load initial data
        await this.loadCurrentTabInfo();
        await this.updateCurrentSiteStats();
    }

    initializeTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const tabId = button.dataset.tab;
                document.getElementById(tabId).classList.add('active');

                // Special handling for stats tab
                if (tabId === 'stats' && this.statsViewer) {
                    this.statsViewer.updateStats();
                }
            });
        });
    }

    initializeStatsViewer() {
        const container = document.getElementById('stats-container');
        this.statsViewer = new StatsViewer(container);
    }

    async loadCurrentTabInfo() {
        try {
            this.currentTab = await getCurrentTabInfo();
            await this.updateCurrentSiteStats();
        } catch (error) {
            console.error('Error loading current tab info:', error);
            this.showError('Error loading current tab information');
        }
    }

    async updateCurrentSiteStats() {
        if (!this.currentTab || !this.currentTab.url) return;

        try {
            const domain = new URL(this.currentTab.url).hostname;
            const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
            const today = new Date().toISOString().split('T')[0];
            const siteStats = dailyStats[today]?.[domain] || { totalTime: 0, visits: 0 };

            this.updateCurrentSiteDisplay(domain, siteStats);
        } catch (error) {
            console.error('Error updating current site stats:', error);
            this.showError('Error loading site statistics');
        }
    }

    updateCurrentSiteDisplay(domain, stats) {
        const container = document.getElementById('current-site-stats');
        container.innerHTML = `
            <div class="current-site-info">
                <h2 class="site-domain">${domain}</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Time Today</span>
                        <span class="stat-value">${formatTime(stats.totalTime)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Visits</span>
                        <span class="stat-value">${stats.visits}</span>
                    </div>
                </div>
                ${this.getQuickActionsHTML(domain)}
            </div>
        `;

        this.attachQuickActionListeners(domain);
    }

    getQuickActionsHTML(domain) {
        return `
            <div class="quick-actions">
                <button class="action-button" data-action="block" data-domain="${domain}">
                    Block Site
                </button>
                <button class="action-button" data-action="focus" data-domain="${domain}">
                    Start Focus Session
                </button>
                <button class="action-button" data-action="limit" data-domain="${domain}">
                    Set Limit
                </button>
            </div>
        `;
    }

    attachQuickActionListeners(domain) {
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                this.handleQuickAction(action, domain);
            });
        });
    }

    async handleQuickAction(action, domain) {
        switch (action) {
            case 'block':
                await this.handleBlockSite(domain);
                break;
            case 'focus':
                await this.handleStartFocus(domain);
                break;
            case 'limit':
                await this.handleSetLimit(domain);
                break;
        }
    }

    async handleBlockSite(domain) {
        // Switch to settings tab and open blocking dialog
        const settingsTab = document.querySelector('[data-tab="settings"]');
        settingsTab.click();
        // Additional implementation needed
    }

    async handleStartFocus(domain) {
        // Switch to focus tab and start session
        const focusTab = document.querySelector('[data-tab="focus"]');
        focusTab.click();
        // Additional implementation needed
    }

    async handleSetLimit(domain) {
        // Switch to settings tab and open limit dialog
        const settingsTab = document.querySelector('[data-tab="settings"]');
        settingsTab.click();
        // Additional implementation needed
    }

    showError(message) {
        const container = document.getElementById('current-site-stats');
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
