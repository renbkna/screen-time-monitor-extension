import LimitSettingsPanel from './components/limits/LimitSettingsPanel.js';
import TimeRemainingDisplay from './components/limits/TimeRemainingDisplay.js';
import BlockingSettings from './components/BlockingSettings.js';
import FocusMode from './components/FocusMode.js';
import { getCurrentTab } from '../utils/browserUtils.js';

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.limitSettingsPanel = null;
    this.timeRemainingDisplay = null;
    this.blockingSettings = null;
    this.focusMode = null;
    this.initialize();
  }

  async initialize() {
    await this.setupNavigation();
    await this.initializeComponents();
    await this.loadCurrentTabInfo();
    this.setupMessageListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'limitUpdated':
          this.refreshTimeDisplay();
          break;
        case 'blockingUpdated':
          this.blockingSettings.loadBlockingRules();
          break;
        case 'focusModeUpdated':
          this.focusMode.render();
          break;
      }
    });
  }

  async setupNavigation() {
    const navContainer = document.querySelector('.nav-tabs');
    navContainer.innerHTML = `
      <button class="nav-tab active" data-tab="dashboard">Dashboard</button>
      <button class="nav-tab" data-tab="limits">Time Limits</button>
      <button class="nav-tab" data-tab="blocking">Blocking</button>
      <button class="nav-tab" data-tab="focus">Focus Mode</button>
      <button class="nav-tab" data-tab="settings">Settings</button>
    `;

    // Add click listeners to tabs
    const tabs = navContainer.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  async initializeComponents() {
    // Initialize time remaining display
    this.timeRemainingDisplay = new TimeRemainingDisplay();
    const dashboardContainer = document.querySelector('#dashboard-container');
    dashboardContainer.insertBefore(
      this.timeRemainingDisplay.getContainer(),
      dashboardContainer.firstChild
    );

    // Initialize limit settings panel
    this.limitSettingsPanel = new LimitSettingsPanel();
    const limitContainer = document.querySelector('#limits-container');
    limitContainer.appendChild(this.limitSettingsPanel.getContainer());

    // Initialize blocking settings
    this.blockingSettings = new BlockingSettings(
      document.querySelector('#blocking-container')
    );

    // Initialize focus mode
    this.focusMode = new FocusMode(
      document.querySelector('#focus-container')
    );

    // Hide all containers initially except dashboard
    document.querySelectorAll('.tab-container').forEach(container => {
      container.classList.add('hidden');
    });
    document.querySelector('#dashboard-container').classList.remove('hidden');
  }

  async loadCurrentTabInfo() {
    try {
      this.currentTab = await getCurrentTab();
      if (this.currentTab) {
        await this.updateCurrentSiteInfo(this.currentTab);
        await this.refreshTimeDisplay();
      }
    } catch (error) {
      console.error('Error loading current tab info:', error);
    }
  }

  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Show selected container, hide others
    document.querySelectorAll('.tab-container').forEach(container => {
      container.classList.toggle('hidden', container.id !== `${tabName}-container`);
    });

    // Special handling for different tabs
    switch (tabName) {
      case 'limits':
        this.limitSettingsPanel.loadExistingLimits();
        break;
      case 'dashboard':
        this.refreshTimeDisplay();
        break;
      case 'blocking':
        this.blockingSettings.loadBlockingRules();
        break;
      case 'focus':
        this.focusMode.render();
        break;
    }
  }

  async updateCurrentSiteInfo(tab) {
    try {
      const domain = new URL(tab.url).hostname;
      const siteInfoContainer = document.querySelector('#current-site-info');
      
      if (siteInfoContainer) {
        siteInfoContainer.innerHTML = `
          <h3>Current Site</h3>
          <p class="site-domain">${domain}</p>
          <div class="quick-actions">
            <button id="quick-limit-btn" class="secondary-btn">Set Time Limit</button>
            <button id="quick-block-btn" class="secondary-btn">Block Site</button>
            <button id="quick-focus-btn" class="secondary-btn">Start Focus Session</button>
          </div>
        `;

        this.setupQuickActionButtons(domain);
      }
    } catch (error) {
      console.error('Error updating current site info:', error);
    }
  }

  setupQuickActionButtons(domain) {
    // Quick limit button
    const quickLimitBtn = document.querySelector('#quick-limit-btn');
    quickLimitBtn?.addEventListener('click', () => {
      this.switchTab('limits');
      this.limitSettingsPanel.showLimitForm(domain);
    });

    // Quick block button
    const quickBlockBtn = document.querySelector('#quick-block-btn');
    quickBlockBtn?.addEventListener('click', () => {
      this.switchTab('blocking');
      this.blockingSettings.addBlockedSite(domain);
    });

    // Quick focus button
    const quickFocusBtn = document.querySelector('#quick-focus-btn');
    quickFocusBtn?.addEventListener('click', () => {
      this.switchTab('focus');
      const blockedSites = document.querySelector('#blockedSites');
      if (blockedSites) {
        blockedSites.value = domain;
      }
    });
  }

  async refreshTimeDisplay() {
    if (this.currentTab?.url) {
      const domain = new URL(this.currentTab.url).hostname;
      chrome.runtime.sendMessage(
        { action: 'getTimeRemaining', domain },
        timeInfo => {
          this.timeRemainingDisplay?.updateDisplay(timeInfo);
        }
      );
    }
  }

  cleanup() {
    this.focusMode?.stopUpdates();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popupManager = new PopupManager();

  // Clean up when popup is closed
  window.addEventListener('unload', () => {
    popupManager.cleanup();
  });
});
