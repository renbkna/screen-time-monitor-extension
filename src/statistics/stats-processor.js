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
  const hourlyData = Array(24).fill(0);
  Object.values(todayData).forEach(site => {
    if (site.visits > 0 && site.lastVisit) {
      const hour = new Date(site.lastVisit).getHours();
      hourlyData[hour] += site.totalTime || 0;
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
  const siteStats = new Map();

  // Get dates for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push(dateStr);

    // Calculate daily totals and aggregate site data
    const dayData = dailyStats[dateStr] || {};
    const dayTotal = Object.values(dayData).reduce((sum, site) => {
      return sum + (site.totalTime || 0);
    }, 0);
    dailyTotals.push(dayTotal);

    // Aggregate site statistics
    Object.entries(dayData).forEach(([domain, data]) => {
      const current = siteStats.get(domain) || {
        timeSpent: 0,
        visits: 0,
        dailyUsage: Array(7).fill(0)
      };
      current.timeSpent += data.totalTime || 0;
      current.visits += data.visits || 0;
      current.dailyUsage[6 - i] = data.totalTime || 0;
      siteStats.set(domain, current);
    });
  }

  // Process top sites with daily breakdowns
  const topSites = Array.from(siteStats.entries())
    .map(([domain, data]) => ({
      domain,
      timeSpent: data.timeSpent,
      visits: data.visits,
      dailyUsage: data.dailyUsage
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
  const categoryDefinitions = {
    'Social Media': [
      'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
      'tiktok.com', 'pinterest.com', 'reddit.com', 'tumblr.com'
    ],
    'Productivity': [
      'github.com', 'gitlab.com', 'bitbucket.org', 'notion.so',
      'trello.com', 'asana.com', 'slack.com', 'zoom.us',
      'docs.google.com', 'drive.google.com', 'office.com'
    ],
    'Entertainment': [
      'youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com',
      'hulu.com', 'disneyplus.com', 'primevideo.com', 'vimeo.com'
    ],
    'News & Information': [
      'news.google.com', 'reuters.com', 'bloomberg.com',
      'nytimes.com', 'wsj.com', 'bbc.com', 'cnn.com',
      'wikipedia.org', 'medium.com'
    ],
    'Shopping': [
      'amazon.com', 'ebay.com', 'etsy.com', 'walmart.com',
      'target.com', 'bestbuy.com', 'aliexpress.com'
    ],
    'Education': [
      'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
      'duolingo.com', 'quizlet.com', 'stackoverflow.com',
      'w3schools.com', 'developer.mozilla.org'
    ]
  };

  // Process each day's data
  Object.values(dailyStats).forEach(dayData => {
    Object.entries(dayData).forEach(([domain, data]) => {
      let category = 'Other';
      
      // Find matching category
      for (const [cat, domains] of Object.entries(categoryDefinitions)) {
        if (domains.some(d => domain.includes(d))) {
          category = cat;
          break;
        }
      }

      // Aggregate time by category
      const currentTime = categories.get(category) || 0;
      categories.set(category, currentTime + (data.totalTime || 0));
    });
  });

  // Convert to array format
  const categoryData = Array.from(categories.entries())
    .map(([category, timeSpent]) => ({ category, timeSpent }))
    .sort((a, b) => b.timeSpent - a.timeSpent);

  return {
    categoryData,
    totalTime: categoryData.reduce((sum, cat) => sum + cat.timeSpent, 0)
  };
}

/**
 * Format time duration for display
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
export function formatTimeForDisplay(minutes) {
  if (minutes < 1) return 'Less than a minute';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}