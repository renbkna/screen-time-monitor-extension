import {
  getWebsiteData,
  getDailyLimits,
  getTodayKey,
  formatTime,
  getSettings,
  getCategories,
  getDomainFromUrl
} from '../utils.js';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePopup();
    setupEventListeners();
    setupDarkMode();
  } catch (error) {
    console.error('Error in popup initialization:', error);
    showError('Failed to initialize popup');
  }
});

let timeDistributionChart = null;

// Initialize popup data
async function initializePopup() {
  try {
    await Promise.all([updateCurrentSite(), updateTodaysSummary()]);
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to load data');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Dashboard button
  document.getElementById('dashboard-btn').addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  });

  // Limits button
  document.getElementById('limits-btn').addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html#limits')
    });
  });
}

// Update current site information
async function updateCurrentSite() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;

    const currentTab = tabs[0];
    if (!currentTab.url || !currentTab.url.startsWith('http')) return;

    const domain = getDomainFromUrl(currentTab.url);
    if (!domain) return;

    const websiteData = await getWebsiteData();
    const todayKey = getTodayKey();
    const dailyLimits = await getDailyLimits();

    const todayData = websiteData[todayKey]?.[domain];
    const limit = dailyLimits[domain];

    // Update site info
    document.getElementById('site-domain').textContent = formatDomain(domain);
    document.getElementById('site-time').textContent = formatTime(
      todayData?.timeSpent || 0
    );

    // Update favicon
    const favicon = document.getElementById('site-favicon');
    if (currentTab.favIconUrl) {
      favicon.style.backgroundImage = `url(${currentTab.favIconUrl})`;
      favicon.style.backgroundSize = 'cover';
      favicon.classList.remove('favicon-placeholder');
    } else {
      favicon.style.backgroundImage = 'none';
      favicon.classList.add('favicon-placeholder');
    }

    // Update progress bar
    updateProgressBar(domain, todayData?.timeSpent || 0, limit);
  } catch (error) {
    console.error('Error updating current site:', error);
  }
}

// Update today's summary
async function updateTodaysSummary() {
  try {
    showLoading();
    const websiteData = await getWebsiteData();
    const todayKey = getTodayKey();
    const todayData = websiteData[todayKey] || {};
    console.log("Today's data:", todayData); // Debugging

    // Calculate total time and most visited
    let totalTime = 0;
    let mostVisited = { domain: '-', time: 0 };
    const categoryTimes = {
      entertainment: 0,
      social: 0,
      productivity: 0,
      education: 0,
      work: 0,
      shopping: 0,
      other: 0
    };

    // Process website data
    Object.entries(todayData).forEach(([domain, data]) => {
      const timeSpent = data.timeSpent || 0;
      totalTime += timeSpent;

      if (timeSpent > mostVisited.time) {
        mostVisited = { domain, time: timeSpent };
      }

      // Track time by category
      const category = data.category || 'other';
      if (categoryTimes.hasOwnProperty(category)) {
        categoryTimes[category] += timeSpent;
      } else {
        categoryTimes.other += timeSpent;
      }
    });

    console.log('Category times:', categoryTimes); // Debugging

    // Update basic stats
    document.getElementById('total-time').textContent = formatTime(totalTime);
    document.getElementById('most-visited').textContent = formatDomain(
      mostVisited.domain
    );

    // Update productivity score
    const settings = await getSettings();
    const productivityScore = settings.productivityScore || 0;
    console.log('Productivity score:', productivityScore); // Debugging
    document.getElementById('productivity-score').textContent =
      `${productivityScore}%`;

    // Update productivity indicator
    const indicator = document.getElementById('productivity-indicator');
    indicator.className = 'w-2 h-2 rounded-full';
    indicator.classList.add(
      productivityScore >= 70
        ? 'bg-green-500'
        : productivityScore >= 40
          ? 'bg-yellow-500'
          : 'bg-red-500'
    );

    // Update time distribution chart
    updateTimeDistributionChart(categoryTimes);
  } catch (error) {
    console.error('Error updating summary:', error);
    showError('Failed to load data');
  } finally {
    hideLoading();
  }
}

async function updateTimeDistributionChart(categoryTimes) {
  const chartContainer = document.getElementById('timeDistributionChart');
  if (!chartContainer) return;

  // Filter and sort categories
  const chartData = Object.entries(categoryTimes)
    .filter(([_, time]) => time > 0)
    .sort((a, b) => b[1] - a[1]);

  if (chartData.length === 0) {
    chartContainer.innerHTML =
      '<div class="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">No data available</div>';
    return;
  }

  // Destroy existing chart instance
  if (timeDistributionChart) {
    timeDistributionChart.destroy();
  }

  // Create new chart with a slightly bigger canvas
  const ctx = document.createElement('canvas');
  ctx.width = 220; // Slightly bigger width
  ctx.height = 220; // Slightly bigger height
  chartContainer.innerHTML = '';
  chartContainer.appendChild(ctx);

  timeDistributionChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: chartData.map(
        ([category]) => category.charAt(0).toUpperCase() + category.slice(1)
      ),
      datasets: [
        {
          data: chartData.map(([_, time]) => time / (1000 * 60)), // Convert to minutes
          backgroundColor: [
            '#F59E0B', // Entertainment
            '#EC4899', // Social
            '#10B981', // Productivity
            '#6366F1', // Education
            '#4F46E5', // Work
            '#6B7280' // Other
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow the chart to resize
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}m`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#6B7280', // Legend text color
            font: {
              size: 12 // Smaller legend font size
            }
          }
        }
      }
    }
  });
}

// Update progress bar for time limits
function updateProgressBar(domain, timeSpent, limit) {
  const progressContainer = document.getElementById('site-limit-progress');

  if (!limit) {
    progressContainer.innerHTML = `
      <div class="text-sm text-gray-500 dark:text-gray-400">
        No time limit set
      </div>
    `;
    return;
  }

  const limitMs = limit * 60 * 1000; // Convert minutes to ms
  const percentage = Math.min((timeSpent / limitMs) * 100, 100);

  let colorClass;
  if (percentage >= 100) {
    colorClass = 'bg-red-500'; // Exceeded limit
  } else if (percentage >= 80) {
    colorClass = 'bg-yellow-500'; // Warning (close to limit)
  } else {
    colorClass = 'bg-green-500'; // Within limit
  }

  progressContainer.innerHTML = `
    <div class="flex justify-between text-sm mb-1">
      <span class="text-gray-600 dark:text-gray-300">${formatTime(
        timeSpent
      )} / ${limit}m</span>
      <span class="text-gray-600 dark:text-gray-300">${Math.round(
        percentage
      )}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-bar-fill ${colorClass}" style="width: ${percentage}%"></div>
    </div>
  `;
}

// Show loading state
function showLoading() {
  const loading = document.createElement('div');
  loading.className = 'flex justify-center items-center h-20';
  loading.innerHTML = `
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
  `;
  document.getElementById('timeDistributionChart').appendChild(loading);
}

// Hide loading state
function hideLoading() {
  const loading = document.querySelector(
    '#timeDistributionChart .animate-spin'
  );
  if (loading) loading.remove();
}

// Setup dark mode
function setupDarkMode() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
}

// Helper function to format domain
function formatDomain(domain) {
  if (!domain) return '-';
  return domain.replace(/^www\./, '');
}

// Show error message
function showError(message) {
  const toast = document.createElement('div');
  toast.className =
    'fixed bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-center animate-fade-in';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Auto refresh current site data (optional)
// setInterval(async () => {
//   await updateCurrentSite();
//   await updateTodaysSummary();
// }, 10000); // 10 seconds

// Export functions for potential use in other modules
export { updateCurrentSite, updateTodaysSummary, formatDomain };
