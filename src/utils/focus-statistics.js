/**
 * Focus mode statistics utilities
 */

// Record focus session completion
export async function recordFocusSession(duration, completedSuccessfully) {
  const { focusStats = {
    totalSessions: 0,
    completedSessions: 0,
    totalMinutes: 0,
    completedMinutes: 0,
    averageCompletion: 0,
    dailyStats: {},
    streaks: {
      current: 0,
      longest: 0,
      lastCompleted: null
    }
  }} = await chrome.storage.local.get('focusStats');

  const today = new Date().toISOString().split('T')[0];
  
  // Update daily stats
  if (!focusStats.dailyStats[today]) {
    focusStats.dailyStats[today] = {
      sessions: 0,
      completedSessions: 0,
      minutes: 0,
      completedMinutes: 0
    };
  }

  // Update total stats
  focusStats.totalSessions++;
  focusStats.totalMinutes += duration;
  focusStats.dailyStats[today].sessions++;
  focusStats.dailyStats[today].minutes += duration;

  if (completedSuccessfully) {
    focusStats.completedSessions++;
    focusStats.completedMinutes += duration;
    focusStats.dailyStats[today].completedSessions++;
    focusStats.dailyStats[today].completedMinutes += duration;

    // Update streaks
    const lastCompletedDate = focusStats.streaks.lastCompleted;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastCompletedDate === yesterdayStr) {
      focusStats.streaks.current++;
      focusStats.streaks.longest = Math.max(focusStats.streaks.current, focusStats.streaks.longest);
    } else if (lastCompletedDate !== today) {
      focusStats.streaks.current = 1;
    }
    focusStats.streaks.lastCompleted = today;
  }

  // Calculate average completion rate
  focusStats.averageCompletion = (focusStats.completedSessions / focusStats.totalSessions) * 100;

  // Save updated stats
  await chrome.storage.local.set({ focusStats });
  return focusStats;
}

// Get focus statistics for a specific time range
export async function getFocusStats(range = 'all') {
  const { focusStats = {} } = await chrome.storage.local.get('focusStats');
  
  if (range === 'all') {
    return focusStats;
  }

  const today = new Date();
  const stats = {
    sessions: 0,
    completedSessions: 0,
    minutes: 0,
    completedMinutes: 0,
    averageCompletion: 0
  };

  let startDate;
  switch (range) {
    case 'day':
      startDate = today;
      break;
    case 'week':
      startDate = new Date(today.setDate(today.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(today.setMonth(today.getMonth() - 1));
      break;
    default:
      throw new Error('Invalid range specified');
  }

  const startDateStr = startDate.toISOString().split('T')[0];

  // Aggregate stats within the range
  Object.entries(focusStats.dailyStats || {}).forEach(([date, dayStats]) => {
    if (date >= startDateStr) {
      stats.sessions += dayStats.sessions;
      stats.completedSessions += dayStats.completedSessions;
      stats.minutes += dayStats.minutes;
      stats.completedMinutes += dayStats.completedMinutes;
    }
  });

  // Calculate completion rate
  if (stats.sessions > 0) {
    stats.averageCompletion = (stats.completedSessions / stats.sessions) * 100;
  }

  return stats;
}

// Get streak information
export async function getStreakInfo() {
  const { focusStats = {} } = await chrome.storage.local.get('focusStats');
  
  return {
    current: focusStats.streaks?.current || 0,
    longest: focusStats.streaks?.longest || 0,
    lastCompleted: focusStats.streaks?.lastCompleted || null
  };
}

// Clean up old focus statistics
export async function cleanupOldFocusStats(daysToKeep = 30) {
  const { focusStats = {} } = await chrome.storage.local.get('focusStats');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // Remove stats older than cutoff date
  const dailyStats = Object.entries(focusStats.dailyStats || {})
    .filter(([date]) => date >= cutoffDateStr)
    .reduce((acc, [date, stats]) => {
      acc[date] = stats;
      return acc;
    }, {});

  focusStats.dailyStats = dailyStats;
  await chrome.storage.local.set({ focusStats });
}