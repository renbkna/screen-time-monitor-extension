import { getFocusStats, getStreakInfo } from '../../utils/focus-statistics.js';
import { createChart } from '../../utils/chart.js';

export default class FocusStats {
  constructor(container) {
    this.container = container;
    this.currentRange = 'week';
    this.chart = null;
    this.init();
  }

  async init() {
    await this.render();
    this.attachEventListeners();
  }

  async render() {
    const stats = await getFocusStats(this.currentRange);
    const streakInfo = await getStreakInfo();
    
    this.container.innerHTML = `
      <div class="focus-stats-container">
        <div class="stats-header">
          <h3>Focus Statistics</h3>
          <select id="statsRange" class="stats-range-select">
            <option value="day">Today</option>
            <option value="week" selected>This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-label">Success Rate</span>
            <span class="stat-value">${stats.averageCompletion.toFixed(1)}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Focus Time</span>
            <span class="stat-value">${Math.round(stats.completedMinutes / 60)} hrs</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Sessions</span>
            <span class="stat-value">${stats.completedSessions}/${stats.sessions}</span>
          </div>
        </div>

        <div class="streak-info">
          <div class="current-streak">
            <span class="streak-label">Current Streak</span>
            <span class="streak-value">${streakInfo.current} days</span>
          </div>
          <div class="longest-streak">
            <span class="streak-label">Longest Streak</span>
            <span class="streak-value">${streakInfo.longest} days</span>
          </div>
        </div>

        <div class="stats-chart">
          <canvas id="focusChart"></canvas>
        </div>
      </div>
    `;

    // Create the chart after the canvas is in the DOM
    await this.updateChart();
  }

  async updateChart() {
    const stats = await getFocusStats(this.currentRange);
    const ctx = this.container.querySelector('#focusChart');
    
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare data for the chart
    const dates = Object.keys(stats.dailyStats).sort();
    const completionRates = dates.map(date => {
      const dayStats = stats.dailyStats[date];
      return dayStats.sessions > 0 
        ? (dayStats.completedSessions / dayStats.sessions) * 100 
        : 0;
    });

    // Create new chart
    this.chart = createChart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(date => new Date(date).toLocaleDateString()),
        datasets: [{
          label: 'Completion Rate (%)',
          data: completionRates,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y.toFixed(1)}% completed`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Completion Rate (%)'
            }
          }
        }
      }
    });
  }

  attachEventListeners() {
    const rangeSelect = this.container.querySelector('#statsRange');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', async (e) => {
        this.currentRange = e.target.value;
        await this.render();
      });
    }
  }

  // Clean up when the component is removed
  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}