/**
 * Utilities for website blocking functionality
 */

// Convert domain pattern to regex
export function domainPatternToRegex(pattern) {
  return new RegExp(
    '^' + 
    pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/^\*\\./, '(.*\\.)?') +
    '$'
  );
}

// Check if a URL matches a domain pattern
export function urlMatchesPattern(url, pattern) {
  try {
    const domain = new URL(url).hostname;
    const regex = domainPatternToRegex(pattern);
    return regex.test(domain);
  } catch (error) {
    console.error('Error matching URL pattern:', error);
    return false;
  }
}

// Check if current time is within schedule
export function isWithinSchedule(schedule) {
  if (!schedule || !schedule.days || !schedule.startTime || !schedule.endTime) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0-6, where 0 is Sunday

  // Check if current day is in schedule
  if (!schedule.days.includes(currentDay)) {
    return false;
  }

  // Parse schedule times
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

  // Create Date objects for comparison
  const startTime = new Date(now.setHours(startHour, startMinute, 0));
  const endTime = new Date(now.setHours(endHour, endMinute, 0));
  
  // Handle overnight schedules
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return now >= startTime && now <= endTime;
}

// Get block status for a URL
export async function getBlockStatus(url) {
  try {
    // Get blocking settings from storage
    const { blocking } = await chrome.storage.local.get('blocking') || { blocking: {} };
    
    // Check each blocking rule
    for (const [domain, rules] of Object.entries(blocking)) {
      if (!rules.enabled) continue;

      if (urlMatchesPattern(url, domain)) {
        // Check schedule if exists
        if (rules.schedule && isWithinSchedule(rules.schedule)) {
          return {
            isBlocked: true,
            reason: 'This site is blocked during scheduled hours',
            endTime: getScheduleEndTime(rules.schedule)
          };
        }

        // Check if blocked due to time limit
        if (rules.blockOnLimit && await isOverTimeLimit(domain)) {
          return {
            isBlocked: true,
            reason: 'You have reached the time limit for this site',
            endTime: getNextLimitReset()
          };
        }
      }
    }

    return { isBlocked: false };
  } catch (error) {
    console.error('Error checking block status:', error);
    return { isBlocked: false };
  }
}

// Get the end time for current schedule period
function getScheduleEndTime(schedule) {
  const now = new Date();
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
  const endTime = new Date(now.setHours(endHour, endMinute, 0));
  
  // If end time is earlier than current time, it means the schedule ends tomorrow
  if (endTime < now) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  return endTime.getTime();
}

// Get the next limit reset time (start of next day)
function getNextLimitReset() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Check if domain is over its time limit
async function isOverTimeLimit(domain) {
  try {
    const { limits, dailyStats } = await chrome.storage.local.get(['limits', 'dailyStats']) || 
      { limits: {}, dailyStats: {} };
    
    const domainLimits = limits[domain];
    if (!domainLimits || !domainLimits.dailyLimit) return false;

    const today = new Date().toISOString().split('T')[0];
    const todayStats = dailyStats[today]?.[domain];
    
    return todayStats && todayStats.totalTime >= domainLimits.dailyLimit;
  } catch (error) {
    console.error('Error checking time limit:', error);
    return false;
  }
}
