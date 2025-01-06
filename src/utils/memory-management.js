/**
 * Memory management utilities for the Screen Time Monitor extension
 */

import { batchProcess } from './performance';

// Constants for memory management
const MEMORY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MEMORY_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB

// WeakMap to store disposable references
const disposables = new WeakMap();

/**
 * Register a disposable object for cleanup
 * @param {Object} object - Object to register
 * @param {Function} cleanup - Cleanup function
 */
export const registerDisposable = (object, cleanup) => {
  disposables.set(object, cleanup);
};

/**
 * Dispose of an object and run its cleanup function
 * @param {Object} object - Object to dispose
 */
export const dispose = (object) => {
  const cleanup = disposables.get(object);
  if (cleanup) {
    cleanup();
    disposables.delete(object);
  }
};

/**
 * Clear unused chart data from memory
 * @param {Object} chartInstances - Map of chart instances
 */
export const clearUnusedChartData = (chartInstances) => {
  for (const [id, chart] of Object.entries(chartInstances)) {
    if (!document.getElementById(id)) {
      chart.destroy();
      delete chartInstances[id];
    }
  }
};

/**
 * Clear old event listeners to prevent memory leaks
 * @param {Object} listeners - Map of event listeners
 */
export const clearEventListeners = (listeners) => {
  for (const [element, eventMap] of Object.entries(listeners)) {
    if (!document.contains(element)) {
      for (const [event, handler] of Object.entries(eventMap)) {
        element.removeEventListener(event, handler);
      }
      delete listeners[element];
    }
  }
};

/**
 * Monitor memory usage and trigger cleanup if needed
 */
export const monitorMemoryUsage = () => {
  if (!performance.memory) return; // Only available in Chrome

  const checkMemory = () => {
    const { usedJSHeapSize } = performance.memory;
    
    if (usedJSHeapSize > MEMORY_WARNING_THRESHOLD) {
      // Force garbage collection through cleanup
      cleanupMemory();
    }
  };

  setInterval(checkMemory, MEMORY_CHECK_INTERVAL);
};

/**
 * Clean up memory by releasing unused resources
 */
export const cleanupMemory = () => {
  // Clear chart.js instances that are no longer visible
  if (window.chartInstances) {
    clearUnusedChartData(window.chartInstances);
  }

  // Clear event listeners for removed elements
  if (window.eventListeners) {
    clearEventListeners(window.eventListeners);
  }

  // Clear any cached data that's no longer needed
  if (window.dataCache) {
    for (const [key, value] of Object.entries(window.dataCache)) {
      if (Date.now() - value.timestamp > value.maxAge) {
        delete window.dataCache[key];
      }
    }
  }
};

/**
 * Initialize memory management
 */
export const initializeMemoryManagement = () => {
  // Set up periodic memory monitoring
  monitorMemoryUsage();

  // Set up cleanup on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cleanupMemory();
    }
  });

  // Clean up memory before unload
  window.addEventListener('beforeunload', cleanupMemory);
};
