import Chart from 'chart.js/auto';

class StatisticsManager {
  constructor() {
    this.charts = new Map();
  }

  /**
   * Creates a time distribution chart
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} data - The daily statistics data
   */
  createTimeDistributionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const ctx = canvas.getContext('2d');
    const { labels, values } = this.processTimeDistributionData(data);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Time Spent (hours)',
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${(value / 3600000).toFixed(1)}h`
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const hours = (context.raw / 3600000).toFixed(2);
                return `${hours} hours`;
              }
            }
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
  }

  /**
   * Creates a daily usage trend chart
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} data - The daily statistics data
   */
  createDailyTrendChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const ctx = canvas.getContext('2d');
    const { dates, totals } = this.processDailyTrendData(data);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Daily Usage (hours)',
          data: totals,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${(value / 3600000).toFixed(1)}h`
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const hours = (context.raw / 3600000).toFixed(2);
                return `${hours} hours`;
              }
            }
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
  }

  /**
   * Creates a category distribution pie chart
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} data - The daily statistics data
   */
  createCategoryDistributionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const ctx = canvas.getContext('2d');
    const { categories, times } = this.processCategoryData(data);

    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: times,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const hours = (context.raw / 3600000).toFixed(2);
                return `${context.label}: ${hours} hours`;
              }
            }
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
  }

  /**
   * Process data for time distribution chart
   * @param {Object} data - Raw daily statistics data
   * @returns {Object} Processed data for chart
   */
  processTimeDistributionData(data) {
    const domains = new Map();
    
    Object.values(data.dailyStats).forEach(dayStats => {
      Object.entries(dayStats).forEach(([domain, stats]) => {
        const current = domains.get(domain) || 0;
        domains.set(domain, current + stats.totalTime);
      });
    });

    // Sort domains by time spent
    const sortedDomains = Array.from(domains.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 domains

    return {
      labels: sortedDomains.map(([domain]) => domain),
      values: sortedDomains.map(([, time]) => time)
    };
  }

  /**
   * Process data for daily trend chart
   * @param {Object} data - Raw daily statistics data
   * @returns {Object} Processed data for chart
   */
  processDailyTrendData(data) {
    const dates = [];
    const totals = [];

    // Sort dates
    const sortedDates = Object.keys(data.dailyStats).sort();

    sortedDates.forEach(date => {
      const dayStats = data.dailyStats[date];
      const totalTime = Object.values(dayStats)
        .reduce((sum, stats) => sum + stats.totalTime, 0);

      dates.push(date);
      totals.push(totalTime);
    });

    return { dates, totals };
  }

  /**
   * Process data for category distribution chart
   * @param {Object} data - Raw daily statistics data
   * @returns {Object} Processed data for chart
   */
  processCategoryData(data) {
    const categoryMap = new Map();

    // Simple categorization based on domain TLD
    Object.values(data.dailyStats).forEach(dayStats => {
      Object.entries(dayStats).forEach(([domain, stats]) => {
        let category = 'Other';
        if (domain.endsWith('.com')) category = 'Commercial';
        else if (domain.endsWith('.org')) category = 'Organization';
        else if (domain.endsWith('.edu')) category = 'Education';
        else if (domain.endsWith('.gov')) category = 'Government';

        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + stats.totalTime);
      });
    });

    return {
      categories: Array.from(categoryMap.keys()),
      times: Array.from(categoryMap.values())
    };
  }

  /**
   * Destroys all charts
   */
  destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}

export default StatisticsManager;
