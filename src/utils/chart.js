/**
 * Chart utilities for data visualization
 */

import Chart from 'chart.js/auto';

// Default chart configuration
const defaultConfig = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 10,
      cornerRadius: 4
    }
  }
};

/**
 * Create a new chart instance with merged configuration
 * @param {HTMLCanvasElement} ctx - Canvas element to render the chart
 * @param {Object} config - Chart configuration
 * @returns {Chart} Chart instance
 */
export function createChart(ctx, config) {
  // Merge default configuration with provided config
  const mergedConfig = mergeDeep(defaultConfig, config);
  return new Chart(ctx, mergedConfig);
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} True if value is an object
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Create a color array for charts
 * @param {number} count - Number of colors needed
 * @returns {string[]} Array of color values
 */
export function generateColors(count) {
  const baseColors = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#FFC107', // Amber
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63'  // Pink
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // If more colors are needed, generate them by adjusting hue
  const colors = [...baseColors];
  const hueStep = 360 / (count - baseColors.length);

  for (let i = baseColors.length; i < count; i++) {
    const hue = (i - baseColors.length) * hueStep;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  return colors;
}

/**
 * Format chart data for display
 * @param {Object} data - Raw data object
 * @param {string} type - Type of formatting to apply
 * @returns {string} Formatted value
 */
export function formatChartValue(value, type) {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'time':
      return formatDuration(value);
    case 'number':
      return value.toLocaleString();
    default:
      return value;
  }
}

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
