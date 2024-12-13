import LimitSettingsPanel from './components/limits/LimitSettingsPanel.js';
import TimeRemainingDisplay from './components/limits/TimeRemainingDisplay.js';
import BlockingSettings from './components/BlockingSettings.js';
import FocusMode from './components/FocusMode.js';
import { getCurrentTab } from '../utils/browserUtils.js';
import { debounce, throttle } from '../utils/performance.js';
import { initializeMemoryManagement, cleanupChart } from '../utils/memory-management.js';
import {
  createOptimizedChartOptions,
  createDebouncedChartUpdate,
  downsampleChartData,
  optimizeChartForRealtime
} from '../utils/chart-optimization.js';

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.components = new Map();
    this.chartInstances = new Map();
    this.initialize();
  }

  async initialize() {
    // Initialize memory management
    initializeMemoryManagement();

    // Setup debounced and throttled functions
    this.debouncedRefresh = debounce(this.refreshTimeDisplay.bind(this), 1000);
    this.throttledUpdate = throttle(this.updateCurrentSiteInfo.bind(this), 5000);

    await this.setupNavigation();
    this.setupMessageListeners();
    await this.loadCurrentTabInfo();

    // Lazy load components when needed
    this.setupLazyLoading();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'limitUpdated':
          this.debouncedRefresh();
          break;
        case 'blockingUpdated':
          if (this.components.has('blockingSettings')) {
            this.components.get('blockingSettings').loadBlockingRules();
          }
          break;
        case 'focusModeUpdated':
          if (this.components.has('focusMode')) {
            this.components.get('focusMode').render();
          }
          break;
        case 'chartDataUpdated':
          this.updateCharts(message.data);
          break;
      }
    });
  }

  setupLazyLoading() {
    // Load components only when their tab is selected
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        const tabName = tab.dataset.tab;
        await this.loadComponentForTab(tabName);
        this.switchTab(tabName);
      });
    });
  }

  async loadComponentForTab(tabName) {
    if (this.components.has(tabName)) return;

    try {
      switch (tabName) {
        case 'dashboard':
          if (!this.components.has('timeRemainingDisplay')) {
            const timeRemainingDisplay = new TimeRemainingDisplay();
            this.components.set('timeRemainingDisplay', timeRemainingDisplay);
            const dashboardContainer = document.querySelector('#dashboard-container');
            dashboardContainer.insertBefore(
              timeRemainingDisplay.getContainer(),
              dashboardContainer.firstChild
            );
          }
          break;

        case 'limits':
          if (!this.components.has('limitSettingsPanel')) {
            const limitSettingsPanel = new LimitSettingsPanel();
            this.components.set('limitSettingsPanel', limitSettingsPanel);
            const limitContainer = document.querySelector('#limits-container');
            limitContainer.appendChild(limitSettingsPanel.getContainer());
            this.initializeCharts(limitContainer);
          }
          break;

        case 'blocking':
          if (!this.components.has('blockingSettings')) {
            const blockingSettings = new BlockingSettings(
              document.querySelector('#blocking-container')
            );
            this.components.set('blockingSettings', blockingSettings);
          }
          break;

        case 'focus':
          if (!this.components.has('focusMode')) {
            const focusMode = new FocusMode(
              document.querySelector('#focus-container')
            );
            this.components.set('focusMode', focusMode);
          }
          break;
      }
    } catch (error) {
      console.error(`Error loading component for tab ${tabName}:`, error);
    }
  }

  initializeCharts(container) {
    const chartCanvases = container.querySelectorAll('canvas[data-chart]');
    chartCanvases.forEach(canvas => {
      const chartId = canvas.dataset.chart;
      const ctx = canvas.getContext('2d');
      
      // Create chart with optimized options
      const chart = new Chart(ctx, {
        ...createOptimizedChartOptions(),
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderColor: '#4CAF50',
            fill: false
          }]
        }
      });

      // Optimize chart for real-time updates
      optimizeChartForRealtime(chart);
      
      // Store chart instance
      this.chartInstances.set(chartId, chart);
    });
  }

  updateCharts(data) {
    this.chartInstances.forEach((chart, chartId) => {
      const chartData = data[chartId];
      if (chartData) {
        // Downsample data if needed
        const optimizedData = downsampleChartData(chartData);
        
        // Update chart with debouncing
        const debouncedUpdate = createDebouncedChartUpdate(chart);
        debouncedUpdate(optimizedData);
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

    // Throttle updates for performance
    this.throttledUpdate();
  }

  async loadCurrentTabInfo() {
    try {
      this.currentTab = await getCurrentTab();
      if (this.currentTab) {
        await this.throttledUpdate();
        await this.debouncedRefresh();
      }
    } catch (error) {
      console.error('Error loading current tab info:', error);
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
    const buttons = {
      'quick-limit-btn': () => {
        this.switchTab('limits');
        this.components.get('limitSettingsPanel')?.showLimitForm(domain);
      },
      'quick-block-btn': () => {
        this.switchTab('blocking');
        this.components.get('blockingSettings')?.addBlockedSite(domain);
      },
      'quick-focus-btn': () => {
        this.switchTab('focus');
        const focusMode = this.components.get('focusMode');
        if (focusMode) {
          const blockedSites = focusMode.getElement('#blockedSites');
          if (blockedSites) blockedSites.value = domain;
        }
      }
    };

    // Set up event listeners
    Object.entries(buttons).forEach(([id, handler]) => {
      document.querySelector(`#${id}`)?.addEventListener('click', handler);
    });
  }

  async refreshTimeDisplay() {
    if (this.currentTab?.url) {
      const domain = new URL(this.currentTab.url).hostname;
      chrome.runtime.sendMessage(
        { action: 'getTimeRemaining', domain },
        timeInfo => {
          this.components.get('timeRemainingDisplay')?.updateDisplay(timeInfo);
        }
      );
    }
  }

  cleanup() {
    // Clean up chart instances
    this.chartInstances.forEach((chart, id) => {
      cleanupChart(chart);
    });
    this.chartInstances.clear();

    // Clean up components
    this.components.forEach(component => {
      if (component.cleanup) {
        component.cleanup();
      }
    });
    this.components.clear();

    // Remove event listeners
    window.removeEventListener('unload', this.cleanup);
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
