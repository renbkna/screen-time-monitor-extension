import { formatTime } from '../utils/timeUtils.js';
import { processDailyStats, processWeeklyStats, processCategoryStats } from '../statistics/stats-processor.js';

class StatsVisualizer {
  constructor(container) {
    this.container = container;
    this.charts = new Map();
    this.initializeCharts();
  }

  async initializeCharts() {
    // Create chart containers
    const layout = `
      <div class="stats-container">
        <div class="stats-header">
          <h2>Usage Statistics</h2>
          <div class="time-range-selector">
            <button class="active" data-range="daily">Daily</button>
            <button data-range="weekly">Weekly</button>
          </div>
        </div>
        
        <div class="summary-cards">
          <div class="stat-card total-time">
            <h3>Total Time</h3>
            <div id="totalTime">--</div>
          </div>
          <div class="stat-card top-site">
            <h3>Most Visited</h3>
            <div id="topSite">--</div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-container">
            <h3>Time Distribution</h3>
            <canvas id="timeDistributionChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Top Sites</h3>
            <canvas id="topSitesChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Category Breakdown</h3>
            <canvas id="categoryChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Daily Trend</h3>
            <canvas id="trendChart"></canvas>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = layout;

    // Initialize Chart.js charts
    this.initializeTimeDistributionChart();
    this.initializeTopSitesChart();
    this.initializeCategoryChart();
    this.initializeTrendChart();

    // Set up event listeners
    this.setupEventListeners();
    
    // Initial update
    this.updateStats('daily');
  }

  updateTimeDistributionChart(data) {
    const chart = this.charts.get('timeDistribution');
    chart.data.datasets[0].data = data;
    chart.update();
  }

  updateTopSitesChart(data) {
    const chart = this.charts.get('topSites');
    chart.data.labels = data.map(site => site.domain);
    chart.data.datasets[0].data = data.map(site => site.timeSpent);
    chart.update();
  }

  updateCategoryChart(data) {
    const chart = this.charts.get('category');
    chart.data.labels = data.map(cat => cat.category);
    chart.data.datasets[0].data = data.map(cat => cat.timeSpent);
    chart.update();
  }

  updateTrendChart(days, data) {
    const chart = this.charts.get('trend');
    chart.data.labels = days;
    chart.data.datasets[0].data = data;
    chart.update();
  }

  async updateWeeklyStats(dailyStats) {
    const processedStats = await processWeeklyStats(dailyStats);
    
    // Update summary cards
    document.getElementById('totalTime').textContent = formatTime(processedStats.weeklyTotal);
    document.getElementById('topSite').textContent = 
      processedStats.topSites[0] ? 
      `${processedStats.topSites[0].domain} (${formatTime(processedStats.topSites[0].timeSpent)})` : 
      'No data';

    // Update trend chart with weekly data
    this.updateTrendChart(
      processedStats.days, 
      processedStats.dailyTotals
    );

    // Update top sites chart with weekly data
    this.updateTopSitesChart(processedStats.topSites);

    // Update category chart with aggregated weekly data
    const weeklyCategories = await this.aggregateWeeklyCategories(dailyStats, processedStats.days);
    this.updateCategoryChart(weeklyCategories);

    // Clear hourly distribution for weekly view
    this.updateTimeDistributionChart(new Array(24).fill(0));
  }

  async aggregateWeeklyCategories(dailyStats, days) {
    const categories = new Map();

    for (const day of days) {
      const dayStats = await processCategoryStats({ [day]: dailyStats[day] || {} });
      dayStats.categoryData.forEach(({ category, timeSpent }) => {
        const current = categories.get(category) || 0;
        categories.set(category, current + timeSpent);
      });
    }

    return Array.from(categories.entries()).map(([category, timeSpent]) => ({
      category,
      timeSpent
    }));
  }

  showNoDataMessage() {
    this.container.innerHTML = `
      <div class="no-data-message">
        <h3>No Usage Data Available</h3>
        <p>Start browsing to collect usage statistics.</p>
      </div>
    `;
  }

  showErrorMessage() {
    this.container.innerHTML = `
      <div class="error-message">
        <h3>Error Loading Statistics</h3>
        <p>Please try refreshing the page.</p>
      </div>
    `;
  }

  destroy() {
    // Cleanup charts
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
    
    // Remove event listeners if necessary
    // Clear container
    this.container.innerHTML = '';
  }
}

export default StatsVisualizer;