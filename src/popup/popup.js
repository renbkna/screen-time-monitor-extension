import LimitSettingsPanel from './components/limits/LimitSettingsPanel.js';
import TimeRemainingDisplay from './components/limits/TimeRemainingDisplay.js';
import BlockingSettings from './components/BlockingSettings.js';
import { getCurrentTab } from '../utils/browserUtils.js';

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.limitSettingsPanel = null;
    this.timeRemainingDisplay = null;
    this.blockingSettings = null;
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
      if (message.action === 'limitUpdated') {
        this.refreshTimeDisplay();
      } else if (message.action === 'blockingUpdated') {
        this.blockingSettings.loadBlockingRules();
      }
    });
  }

  async setupNavigation() {
    const navContainer = document.querySelector('.nav-tabs');
    navContainer.innerHTML = `
      <button class="nav-tab active" data-tab="dashboard">Dashboard</button>
      <button class="nav-tab" data-tab="limits">Time Limits</button>
      <button class="nav-tab" data-tab="blocking">Blocking</button>
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
        // Update UI with current tab info
        this.updateCurrentSiteInfo(this.currentTab);
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
    if (tabName === 'limits') {
      this.limitSettingsPanel.loadExistingLimits();
    } else if (tabName === 'dashboard') {
      this.refreshTimeDisplay();
    } else if (tabName === 'blocking') {
      this.blockingSettings.loadBlockingRules();
    }
  }

  updateCurrentSiteInfo(tab) {
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
          </div>
        `;

        // Add quick limit button functionality
        const quickLimitBtn = document.querySelector('#quick-limit-btn');
        quickLimitBtn.addEventListener('click', () => {
          this.switchTab('limits');
          this.limitSettingsPanel.showLimitForm();
          // Pre-fill the domain
          const domainInput = document.querySelector('#domain-input');
          if (domainInput) {
            domainInput.value = domain;
          }
        });

        // Add quick block button functionality
        const quickBlockBtn = document.querySelector('#quick-block-btn');
        quickBlockBtn.addEventListener('click', () => {
          this.switchTab('blocking');
          this.blockingSettings.addBlockedSite(domain);
        });
      }
    } catch (error) {
      console.error('Error updating current site info:', error);
    }
  }

  async refreshTimeDisplay() {
    if (this.currentTab && this.currentTab.url) {
      const domain = new URL(this.currentTab.url).hostname;
      chrome.runtime.sendMessage(
        { action: 'getTimeRemaining', domain },
        timeInfo => {
          if (this.timeRemainingDisplay) {
            this.timeRemainingDisplay.updateDisplay(timeInfo);
          }
        }
      );
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
