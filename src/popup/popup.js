// Utility functions
const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

const formatDomain = (domain) => {
  if (!domain) return 'Not active';
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

// UI update functions
const updateDateDisplay = () => {
  const dateElement = document.getElementById('currentDate');
  dateElement.textContent = formatDate(currentDate);
};

const setLoadingState = (elementId, isLoading) => {
  const element = document.getElementById(elementId);
  if (isLoading) {
    element.classList.add('loading');
  } else {
    element.classList.remove('loading');
  }
};

const setErrorState = (elementId, hasError) => {
  const element = document.getElementById(elementId);
  if (hasError) {
    element.classList.add('error');
  } else {
    element.classList.remove('error');
  }
};

const updateCurrentSite = async () => {
  try {
    setLoadingState('currentSiteSection', true);
    setErrorState('currentSiteSection', false);

    const state = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATE' });
    const domainElement = document.getElementById('currentDomain');
    const timeElement = document.getElementById('currentTime');
    const indicatorElement = document.getElementById('activeIndicator');

    if (state.currentUrl) {
      const domain = new URL(state.currentUrl).hostname;
      domainElement.textContent = formatDomain(domain);
      
      if (!state.isIdle && state.startTime) {
        const timeSpent = Date.now() - state.startTime;
        timeElement.textContent = formatTime(timeSpent);
        indicatorElement.classList.remove('inactive');
      } else {
        timeElement.textContent = '0s';
        indicatorElement.classList.add('inactive');
      }
    } else {
      domainElement.textContent = 'Not active';
      timeElement.textContent = '0s';
      indicatorElement.classList.add('inactive');
    }
  } catch (error) {
    console.error('Error updating current site:', error);
    setErrorState('currentSiteSection', true);
  } finally {
    setLoadingState('currentSiteSection', false);
  }
};

const updateDailyStats = async () => {
  try {
    setLoadingState('dailySummarySection', true);
    setLoadingState('topSitesSection', true);
    setErrorState('dailySummarySection', false);
    setErrorState('topSitesSection', false);

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
      topSitesList.innerHTML = '<div class="empty-state">No sites visited yet today</div>';
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
    console.error('Error updating daily stats:', error);
    setErrorState('dailySummarySection', true);
    setErrorState('topSitesSection', true);
  } finally {
    setLoadingState('dailySummarySection', false);
    setLoadingState('topSitesSection', false);
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
    // Set up date navigation
    document.getElementById('prevDay').addEventListener('click', () => handleDateChange(-1));
    document.getElementById('nextDay').addEventListener('click', () => handleDateChange(1));

    // Initial updates
    updateDateDisplay();
    await Promise.all([
      updateCurrentSite(),
      updateDailyStats()
    ]);

    // Set up periodic updates for current site
    updateInterval = setInterval(updateCurrentSite, 1000);
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
};

// Cleanup when popup closes
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);
