/**
 * Chart.js optimization utilities for the Screen Time Monitor extension
 */

import { debounce } from './performance';

// Constants for chart optimization
const CHART_UPDATE_DEBOUNCE = 100; // 100ms debounce for chart updates
const MAX_DATA_POINTS = 100; // Maximum number of data points to display

/**
 * Create optimized Chart.js options
 * @param {Object} baseOptions - Base chart options
 * @returns {Object} Optimized chart options
 */
export const createOptimizedChartOptions = (baseOptions = {}) => {
  return {
    ...baseOptions,
    animation: {
      duration: 0 // Disable animations for better performance
    },
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0 // Disable bezier curves for better performance
      },
      point: {
        radius: 0 // Hide points for better performance
      }
    },
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        enabled: true,
        intersect: false,
        mode: 'index',
        position: 'nearest'
      }
    }
  };
};

/**
 * Create a debounced chart update function
 * @param {Object} chart - Chart.js instance
 * @returns {Function} Debounced update function
 */
export const createDebouncedChartUpdate = (chart) => {
  return debounce((newData) => {
    chart.data = newData;
    chart.update('none'); // Use 'none' mode for better performance
  }, CHART_UPDATE_DEBOUNCE);
};

/**
 * Downsample data for better chart performance
 * @param {Array} data - Original data array
 * @param {number} targetLength - Target number of points
 * @returns {Array} Downsampled data
 */
export const downsampleChartData = (data, targetLength = MAX_DATA_POINTS) => {
  if (data.length <= targetLength) return data;

  const result = [];
  const step = Math.floor(data.length / targetLength);

  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }

  // Ensure we always include the last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }

  return result;
};

/**
 * Create an efficient data update function for streaming data
 * @param {Object} chart - Chart.js instance
 * @param {number} maxPoints - Maximum number of points to keep
 * @returns {Function} Update function
 */
export const createStreamingDataUpdate = (chart, maxPoints = MAX_DATA_POINTS) => {
  return (newPoint) => {
    const data = chart.data.datasets[0].data;
    data.push(newPoint);

    // Remove old points if we exceed maxPoints
    if (data.length > maxPoints) {
      data.shift();
    }

    chart.update('none');
  };
};

/**
 * Optimize chart for real-time updates
 * @param {Object} chart - Chart.js instance
 */
export const optimizeChartForRealtime = (chart) => {
  // Disable animations
  chart.options.animation = false;
  
  // Use the more efficient 'none' mode for updates
  chart.options.responsiveAnimationDuration = 0;
  
  // Minimize visual elements
  chart.options.elements.point.radius = 0;
  chart.options.elements.line.tension = 0;
  
  // Use more efficient tooltip mode
  chart.options.plugins.tooltip.mode = 'nearest';
  chart.options.plugins.tooltip.intersect = false;
  
  chart.update('none');
};

/**
 * Clean up chart resources
 * @param {Object} chart - Chart.js instance
 */
export const cleanupChart = (chart) => {
  if (chart) {
    chart.destroy();
  }
};
