/**
 * Time-related utility functions
 */

/**
 * Format minutes into a human-readable duration string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatTime(minutes) {
  if (!minutes || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get the start of today
 * @returns {Date} Start of today
 */
export function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get the start of the current week
 * @returns {Date} Start of the week (Sunday)
 */
export function getStartOfWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get dates for the last n days
 * @param {number} n - Number of days
 * @returns {string[]} Array of ISO date strings
 */
export function getLastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Format a timestamp for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

/**
 * Calculate time difference between two dates in minutes
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {number} Difference in minutes
 */
export function getTimeDifferenceInMinutes(start, end) {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / 60000); // Convert milliseconds to minutes
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  
  return checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is within the current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is within current week
 */
export function isCurrentWeek(date) {
  const startOfWeek = getStartOfWeek();
  const checkDate = new Date(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  
  return checkDate >= startOfWeek && checkDate < endOfWeek;
}

/**
 * Get a readable time range string
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Formatted time range
 */
export function getTimeRangeString(start, end) {
  const startStr = formatTimestamp(start);
  const endStr = formatTimestamp(end);
  const duration = formatTime(getTimeDifferenceInMinutes(start, end));
  
  return `${startStr} - ${endStr} (${duration})`;
}

/**
 * Parse duration string into minutes
 * @param {string} durationStr - Duration string (e.g., "1h 30m", "45m")
 * @returns {number} Duration in minutes
 */
export function parseDuration(durationStr) {
  let totalMinutes = 0;
  
  // Match hours
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Match minutes
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  return totalMinutes;
}
