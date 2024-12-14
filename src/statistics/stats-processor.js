/**
 * Statistics processor module
 * Processes and formats usage data for visualization
 */

/**
 * Process daily statistics for visualization
 * @param {Object} dailyStats - Raw daily statistics from storage
 * @returns {Object} Processed statistics ready for visualization
 */
export async function processDailyStats(dailyStats) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyStats[today] || {};

  // Calculate total time spent today
  const totalTime = Object.values(todayData).reduce((sum, site) => {
    return sum + (site.totalTime || 0);
  }, 0);

  // Process top sites by time spent
  const topSites = Object.entries(todayData)
    .map(([domain, data]) => ({
      domain,
      timeSpent: data.totalTime || 0,
      visits: data.visits || 0,
      lastVisit: data.lastVisit
    }))
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 10);

  // Calculate hourly distribution
  const hourlyData = new Array(24).fill(0);
  Object.values(todayData).forEach(site => {
    if (site.hourlyDistribution) {
      site.hourlyDistribution.forEach((value, hour) => {
        hourlyData[hour] += value;
      });
    }
  });

  return {
    totalTime,
    topSites,
    hourlyDistribution: hourlyData,
    date: today
  };
}

/**
 * Process weekly statistics for visualization
 * @param {Object} dailyStats - Raw daily statistics from storage
 * @returns {Object} Processed weekly statistics
 */
export async function processWeeklyStats(dailyStats) {
  const days = [];
  const dailyTotals = [];
  const topSitesWeekly = new Map();

  // Get dates for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push(dateStr);

    const dayData = dailyStats[dateStr] || {};
    const dayTotal = Object.values(dayData).reduce((sum, site) => {
      return sum + (site.totalTime || 0);
    }, 0);
    dailyTotals.push(dayTotal);

    // Aggregate site data for weekly totals
    Object.entries(dayData).forEach(([domain, data]) => {
      const current = topSitesWeekly.get(domain) || { timeSpent: 0, visits: 0 };
      topSitesWeekly.set(domain, {
        timeSpent: current.timeSpent + (data.totalTime || 0),
        visits: current.visits + (data.visits || 0)
      });
    });
  }

  // Get top sites for the week
  const topSites = Array.from(topSitesWeekly.entries())
    .map(([domain, data]) => ({
      domain,
      ...data
    }))
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 10);

  return {
    days,
    dailyTotals,
    topSites,
    weeklyTotal: dailyTotals.reduce((sum, time) => sum + time, 0)
  };
}

/**
 * Process category statistics
 * @param {Object} dailyStats - Raw daily statistics
 * @returns {Object} Category-based statistics
 */
export async function processCategoryStats(dailyStats) {
  const categories = new Map();
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyStats[today] || {};

  // Categorize domains (simplified for MVP)
  const domainCategories = {
    'social': ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'],
    'productivity': ['github.com', 'notion.so', 'docs.google.com', 'trello.com'],
    'entertainment': ['youtube.com', 'netflix.com', 'twitch.tv'],
    'news': ['news.google.com', 'reuters.com', 'bbc.com', 'cnn.com'],
    'other': []
  };

  // Calculate time spent per category
  Object.entries(todayData).forEach(([domain, data]) => {
    let category = 'other';
    for (const [cat, domains] of Object.entries(domainCategories)) {
      if (domains.some(d => domain.includes(d))) {
        category = cat;
        break;
      }
    }

    const current = categories.get(category) || 0;
    categories.set(category, current + (data.totalTime || 0));
  });

  return {
    categoryData: Array.from(categories.entries()).map(([category, time]) => ({
      category,
      timeSpent: time
    })),
    date: today
  };
}

/**
 * Format time duration for display
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
export function formatTime(minutes) {
  if (minutes < 1) {
    return 'Less than a minute';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}
