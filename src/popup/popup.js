// Utility functions
const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

const formatDomain = (domain) => {
  return domain.replace(/^www\./, '');
};

const formatDate = (date) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  switch (date) {
    case today:
      return 'Today';
    case yesterday:
      return 'Yesterday';
    default:
      return new Date(date).toLocaleDateString();
  }
};

// State management
let currentDate = new Date().toISOString().split('T')[0];
let updateInterval = null;
let statsUpdateInterval = null;

// UI loading state management
const setLoading = (isLoading) => {
  const elements = document.querySelectorAll('.loading-state');
  elements.forEach(element => {
    element.style.opacity = isLoading ? '0.5' : '1';
  });
};

// Error handling
const showError = (message) => {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 3000);
  }
};

// UI update functions
const updateDateDisplay = () => {
  const dateElement = document.getElementById('currentDate');
  dateElement.textContent = formatDate(currentDate);

  // Update navigation buttons state
  const nextDay = document.getElementById('nextDay');
  const today = new Date().toISOString().split('T')[0];
  nextDay.disabled = currentDate >= today;
};

const updateCurrentSite = async () => {
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATE' });
    const domainElement = document.getElementById('currentDomain');
    const timeElement = document.getElementById('currentTime');

    if (state.currentUrl) {
      const domain = new URL(state.currentUrl).hostname;
      domainElement.textContent = formatDomain(domain);
      
      if (!state.isIdle && state.startTime) {
        const timeSpent = Date.now() - state.startTime;
        timeElement.textContent = formatTime(timeSpent);
      }
    } else {
      domainElement.textContent = 'Not active';
      timeElement.textContent = '0m';
    }
  } catch (error) {
    showError('Failed to update current site data');
    console.error('Error updating current site:', error);
  }
};

const updateDailyStats = async () => {
  try {
    setLoading(true);
    const stats = await chrome.runtime.sendMessage({
      type: 'GET_DAILY_STATS',
      date: currentDate
    });

    // Update total time
    const totalTime = Object.values(stats).reduce(
      (sum, site) => sum + site.totalTime,
      0
    );
    document.getElementById('totalTime').textContent = formatTime(totalTime);

    // Update total sites visited
    const totalSites = Object.keys(stats).length;
    document.getElementById('totalSites').textContent = totalSites;

    // Update top sites list
    const topSites = Object.entries(stats)
      .map(([domain, data]) => ({
        domain,
        ...data
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5);

    const topSitesList = document.getElementById('topSitesList');
    if (topSites.length === 0) {
      topSitesList.innerHTML = '<div class="no-data">No activity recorded</div>';
    } else {
      topSitesList.innerHTML = topSites
        .map(
          site => `
          <div class="site-item">
            <div class="site-domain">${formatDomain(site.domain)}</div>
            <div class="site-time">${formatTime(site.totalTime)}</div>
          </div>
        `
        )
        .join('');
    }
  } catch (error) {
    showError('Failed to update daily statistics');
    console.error('Error updating daily stats:', error);
  } finally {
    setLoading(false);
  }
};

// Event handlers
const handleDateChange = async (direction) => {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + direction);
  
  // Don't allow future dates
  if (date > new Date()) return;
  
  currentDate = date.toISOString().split('T')[0];
  updateDateDisplay();
  await updateDailyStats();
};

// Initialize popup
const initializePopup = async () => {
  try {
    // Add error container if not present
    if (!document.getElementById('errorContainer')) {
      const errorContainer = document.createElement('div');
      errorContainer.id = 'errorContainer';
      errorContainer.className = 'error-container';
      document.body.insertBefore(errorContainer, document.body.firstChild);
    }

    // Add loading-state class to updatable elements
    document.querySelectorAll('.stat-container, .sites-list')
      .forEach(element => element.classList.add('loading-state'));

    // Set up date navigation
    document.getElementById('prevDay').addEventListener('click', () => handleDateChange(-1));
    document.getElementById('nextDay').addEventListener('click', () => handleDateChange(1));

    // Initial updates
    updateDateDisplay();
    await updateCurrentSite();
    await updateDailyStats();

    // Set up periodic updates
    updateInterval = setInterval(updateCurrentSite, 1000);
    
    // Update daily stats every minute if viewing today's data
    statsUpdateInterval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (currentDate === today) {
        updateDailyStats();
      }
    }, 60000);

  } catch (error) {
    showError('Failed to initialize popup');
    console.error('Error initializing popup:', error);
  }
};

// Cleanup when popup closes
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);
