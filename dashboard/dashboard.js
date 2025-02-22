import {
  getWebsiteData,
  getCategories,
  getSettings,
  getTodayKey,
  formatTime,
  getDomainFromUrl
} from '../utils.js';

async function initializeDashboard() {
  console.log('Dashboard - Initializing dashboard...');
  document.getElementById('range-today').classList.add('active-time-range');

  // Add click handlers to range buttons
  const rangeButtons = document.querySelectorAll('[id^="range-"]');
  rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rangeButtons.forEach((btn) => btn.classList.remove('active-time-range'));
      button.classList.add('active-time-range');
      updateData();
    });
  });

  await updateData();
  // Auto-refresh every 30 seconds
  setInterval(updateData, 30000);
}

async function updateData() {
  try {
    const { websiteData = {}, categories = {} } =
      await chrome.storage.local.get(['websiteData', 'categories']);
    const today = new Date().toISOString().split('T')[0];
    const todayData = websiteData[today] || {};
    console.log('Dashboard - Fetched data:', todayData);

    updateCharts(todayData, categories);
    await updateStats(todayData);
    updateDetailedStats(todayData, categories);
  } catch (error) {
    console.error('Dashboard - Error updating data:', error);
  }
}

async function updateStats(data) {
  try {
    console.log('Dashboard - Updating stats with data:', data);
    const totalTime = Object.values(data).reduce(
      (sum, site) => sum + (site.timeSpent || 0),
      0
    );
    const hours = Math.floor(totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('total-time').textContent = `${hours}h ${minutes}m`;

    let mostVisited = '-';
    let maxTime = 0;
    Object.entries(data).forEach(([domain, info]) => {
      if (info.timeSpent > maxTime) {
        maxTime = info.timeSpent;
        mostVisited = domain.replace(/^www\./, '');
      }
    });
    document.getElementById('most-visited').textContent = mostVisited;

    // Fetch latest settings to get updated productivity score
    const settings = await getSettings();
    console.log('Dashboard - Retrieved settings:', settings);
    const productivityScore = settings.productivityScore || 0;
    document.getElementById('productivity-score').textContent =
      `${productivityScore}%`;

    const indicator = document.getElementById('productivity-indicator');
    indicator.className = 'w-2 h-2 rounded-full';
    indicator.classList.add(
      productivityScore >= 70
        ? 'bg-green-500'
        : productivityScore >= 40
          ? 'bg-yellow-500'
          : 'bg-red-500'
    );
  } catch (error) {
    console.error('Dashboard - Error updating stats:', error);
  }
}

const colors = [
  '#4F46E5',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#06B6D4',
  '#6366F1'
];

function updateCharts(data, categories) {
  console.log('Dashboard - Updating charts with data:', data);
  updateDailyChart(data);
  updateCategoryChart(data, categories);
}

function updateDailyChart(data) {
  console.log('Dashboard - Updating daily chart with data:', data);
  const canvas = document.getElementById('daily-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const chartData = Object.entries(data)
    .map(([domain, info]) => ({
      // Normalize domain key for display
      domain: domain.toLowerCase().replace(/^www\./, ''),
      hours: info.timeSpent / (1000 * 60 * 60)
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  if (chartData.length === 0) {
    canvas.parentElement.innerHTML =
      '<div class="text-sm text-gray-500 text-center mt-4">No data available</div>';
    return;
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map((item) => item.domain),
      datasets: [
        {
          label: 'Hours',
          data: chartData.map((item) => item.hours),
          backgroundColor: colors
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value.toFixed(1)}h`;
            }
          }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' }
        }
      }
    }
  });
}

function updateCategoryChart(data, categories) {
  console.log('Dashboard - Updating category chart with data:', data);
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const categoryData = {};
  Object.entries(data).forEach(([domain, info]) => {
    // Normalize domain for category lookup
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    const category = categories[normalizedDomain]
      ? categories[normalizedDomain].name
      : 'Other';
    categoryData[category] = (categoryData[category] || 0) + info.timeSpent;
  });

  if (Object.keys(categoryData).length === 0) {
    canvas.parentElement.innerHTML =
      '<div class="text-sm text-gray-500 text-center mt-4">No data available</div>';
    return;
  }

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categoryData),
      datasets: [
        {
          data: Object.values(categoryData).map(
            (time) => time / (1000 * 60 * 60)
          ),
          backgroundColor: colors
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value.toFixed(1)}h`;
            }
          }
        },
        legend: { position: 'bottom' }
      }
    }
  });
}

function updateDetailedStats(data, categories) {
  console.log('Dashboard - Updating detailed stats with data:', data);
  const tbody = document.getElementById('stats-table-body');
  tbody.innerHTML = '';

  const sortedSites = Object.entries(data).sort(
    ([, a], [, b]) => b.timeSpent - a.timeSpent
  );
  sortedSites.forEach(([domain, info]) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    // Website cell
    const websiteCell = document.createElement('td');
    websiteCell.className = 'px-6 py-4';
    // Normalize domain key for display
    websiteCell.textContent = domain.toLowerCase().replace(/^www\./, '');
    row.appendChild(websiteCell);

    // Time spent cell
    const timeCell = document.createElement('td');
    timeCell.className = 'px-6 py-4';
    const hours = Math.floor(info.timeSpent / (1000 * 60 * 60));
    const minutes = Math.floor(
      (info.timeSpent % (1000 * 60 * 60)) / (1000 * 60)
    );
    timeCell.textContent = `${hours}h ${minutes}m`;
    row.appendChild(timeCell);

    // Category cell
    const categoryCell = document.createElement('td');
    categoryCell.className = 'px-6 py-4';
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    // Use the category name if available; otherwise default to 'Other'
    categoryCell.textContent = categories[normalizedDomain]
      ? categories[normalizedDomain].name
      : 'Other';
    row.appendChild(categoryCell);

    // Limit status cell
    const limitCell = document.createElement('td');
    limitCell.className = 'px-6 py-4';
    const limitStatus = info.limitExceeded ? 'Exceeded' : 'Within Limit';
    const statusColor = info.limitExceeded ? 'text-red-600' : 'text-green-600';
    limitCell.innerHTML = `<span class="${statusColor}">${limitStatus}</span>`;
    row.appendChild(limitCell);

    tbody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);

// Listen for storage changes to update productivity score immediately
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === 'local' &&
    changes.settings &&
    changes.settings.newValue.productivityScore !== undefined
  ) {
    document.getElementById('productivity-score').textContent =
      `${changes.settings.newValue.productivityScore}%`;
    const prodScore = changes.settings.newValue.productivityScore;
    const indicator = document.getElementById('productivity-indicator');
    indicator.className = 'w-2 h-2 rounded-full';
    indicator.classList.add(
      prodScore >= 70
        ? 'bg-green-500'
        : prodScore >= 40
          ? 'bg-yellow-500'
          : 'bg-red-500'
    );
  }
});
