import StatisticsManager from '../statistics/statistics-manager.js';

class PopupManager {
  constructor() {
    this.statsManager = new StatisticsManager();
    this.currentTab = 'overview';
    this.timeRange = 'day';
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Tab navigation
    document.getElementById('overviewTab').addEventListener('click', () => this.switchTab('overview'));
    document.getElementById('statsTab').addEventListener('click', () => this.switchTab('stats'));

    // Time range selector
    document.getElementById('timeRange').addEventListener('change', (e) => {
      this.timeRange = e.target.value;
      this.updateStatistics();
    });

    // Date navigation
    document.getElementById('prevDay').addEventListener('click', () => this.navigateDate(-1));
    document.getElementById('nextDay').addEventListener('click', () => this.navigateDate(1));

    // Initial load
    this.loadData();

    // Update current site info periodically
    this.updateCurrentSite();
    setInterval(() => this.updateCurrentSite(), 1000);
  }

  async loadData() {
    try {
      const data = await this.fetchData();
      this.updateOverview(data);
      if (this.currentTab === 'stats') {
        this.updateStatistics();
      }
    } catch (error) {
      this.showError('Error loading data: ' + error.message);
    }
  }

  async fetchData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['dailyStats'], (result) => {
        resolve(result || { dailyStats: {} });
      });
    });
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}Content`).classList.add('active');

    this.currentTab = tab;

    // Load statistics if switching to stats tab
    if (tab === 'stats') {
      this.updateStatistics();
    }
  }

  async updateCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        document.getElementById('currentDomain').textContent = domain;

        const data = await this.fetchData();
        const todayStats = data.dailyStats[this.selectedDate] || {};
        const siteStats = todayStats[domain] || { totalTime: 0 };

        document.getElementById('currentTime').textContent = this.formatTime(siteStats.totalTime);
      }
    });
  }

  async updateOverview(data) {
    const todayStats = data.dailyStats[this.selectedDate] || {};
    
    // Update total time
    const totalTime = Object.values(todayStats)
      .reduce((sum, site) => sum + (site.totalTime || 0), 0);
    document.getElementById('totalTime').textContent = this.formatTime(totalTime);

    // Update total sites
    const totalSites = Object.keys(todayStats).length;
    document.getElementById('totalSites').textContent = totalSites;

    // Update top sites list
    this.updateTopSites(todayStats);

    // Update current date display
    this.updateDateDisplay();
  }

  updateTopSites(todayStats) {
    const topSitesList = document.getElementById('topSitesList');
    const sites = Object.entries(todayStats)
      .sort(([, a], [, b]) => (b.totalTime || 0) - (a.totalTime || 0))
      .slice(0, 5);

    if (sites.length === 0) {
      topSitesList.innerHTML = '<div class="no-data">No data available</div>';
      return;
    }

    topSitesList.innerHTML = sites.map(([domain, stats]) => `
      <div class="site-item">
        <div class="site-info">
          <div class="site-domain">${domain}</div>
          <div class="site-time">${this.formatTime(stats.totalTime)}</div>
        </div>
      </div>
    `).join('');
  }

  updateDateDisplay() {
    const date = new Date(this.selectedDate);
    const today = new Date().toISOString().split('T')[0];
    let displayText = '';

    if (this.selectedDate === today) {
      displayText = 'Today';
    } else {
      displayText = date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    document.getElementById('currentDate').textContent = displayText;
  }

  navigateDate(offset) {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + offset);
    
    // Don't allow navigating to future dates
    if (date > new Date()) return;

    this.selectedDate = date.toISOString().split('T')[0];
    this.loadData();
  }

  showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.classList.add('visible');

    setTimeout(() => {
      errorContainer.classList.remove('visible');
    }, 5000);
  }

  formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// Initialize popup manager
new PopupManager();
