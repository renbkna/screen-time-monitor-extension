/**
 * Error handling utilities for the Screen Time Monitor extension
 */

import { showToast } from './ui.js';

// Custom error classes
class ExtensionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
  }
}

class StorageError extends ExtensionError {
  constructor(message) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

class NetworkError extends ExtensionError {
  constructor(message) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

class ValidationError extends ExtensionError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error handler function
 * @param {Error} error - Error object
 * @param {Object} options - Error handling options
 * @param {boolean} options.showNotification - Whether to show a notification
 * @param {boolean} options.logError - Whether to log the error
 * @param {Function} options.onError - Custom error handler
 */
export function handleError(error, options = {}) {
  const {
    showNotification = true,
    logError = true,
    onError = null
  } = options;

  // Log error if enabled
  if (logError) {
    console.error('Extension Error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }

  // Show notification if enabled
  if (showNotification) {
    let message = 'An error occurred. Please try again.';

    // Customize message based on error type
    if (error instanceof StorageError) {
      message = 'Storage error. Please check your browser settings.';
    } else if (error instanceof NetworkError) {
      message = 'Network error. Please check your connection.';
    } else if (error instanceof ValidationError) {
      message = error.message || 'Invalid input. Please check your data.';
    }

    showToast(message, 'error');
  }

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    try {
      onError(error);
    } catch (handlerError) {
      console.error('Error in custom error handler:', handlerError);
    }
  }

  // Return false to indicate error was handled
  return false;
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @param {Object} errorOptions - Options for error handling
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, errorOptions = {}) {
  return async function errorWrapper(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, errorOptions);
    }
  };
}

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @throws {ValidationError} If validation fails
 */
export function validateData(data, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
    }

    if (rules.type && value !== undefined && value !== null) {
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (valueType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
      }
    }

    if (rules.min !== undefined && (value < rules.min)) {
      errors.push(`${key} must be at least ${rules.min}`);
    }

    if (rules.max !== undefined && (value > rules.max)) {
      errors.push(`${key} must be at most ${rules.max}`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${key} has an invalid format`);
    }

    if (rules.custom && !rules.custom(value)) {
      errors.push(rules.message || `${key} is invalid`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
}

/**
 * Recovery function for critical errors
 * @param {Error} error - Error that occurred
 * @param {Object} state - Current state to recover
 * @returns {Object} Recovered state
 */
export function recoverFromError(error, state) {
  const recoveredState = { ...state };

  // Attempt to recover based on error type
  if (error instanceof StorageError) {
    // Reset to default state
    recoveredState.data = {};
    recoveredState.settings = {};
  } else if (error instanceof NetworkError) {
    // Retry mechanism or offline mode
    recoveredState.isOffline = true;
    recoveredState.pendingUpdates = [];
  }

  return recoveredState;
}

// Export error classes
export {
  ExtensionError,
  StorageError,
  NetworkError,
  ValidationError
};
