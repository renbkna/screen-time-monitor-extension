/**
 * Performance optimization utilities for the Screen Time Monitor extension
 */

// Cache for storing frequently accessed data
const cache = new Map();

/**
 * Debounce function to limit the rate at which a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time in milliseconds to wait before calling the function
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Throttle function to limit the rate at which a function is called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time in milliseconds between function calls
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Cache data with an expiration time
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} expirationMs - Time in milliseconds until cache expires
 */
export const setCacheData = (key, data, expirationMs = 5 * 60 * 1000) => {
  cache.set(key, {
    data,
    expiration: Date.now() + expirationMs
  });
};

/**
 * Get cached data if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {*} Cached data or null if expired/not found
 */
export const getCacheData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiration) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Clear expired items from cache
 */
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiration) {
      cache.delete(key);
    }
  }
};

/**
 * Calculate size of data in bytes (approximate)
 * @param {*} data - Data to measure
 * @returns {number} Size in bytes
 */
export const getDataSize = (data) => {
  return new Blob([JSON.stringify(data)]).size;
};

/**
 * Batch operations for better performance
 * @param {Array} items - Items to process
 * @param {Function} operation - Operation to perform on each item
 * @param {number} batchSize - Number of items to process in each batch
 * @returns {Promise} Promise that resolves when all batches are processed
 */
export const batchProcess = async (items, operation, batchSize = 100) => {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await Promise.all(batch.map(operation));
  }
};

// Set up periodic cache cleanup
const CACHE_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);