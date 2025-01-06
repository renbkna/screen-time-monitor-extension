/**
 * Production error tracking and reporting
 */

const ERROR_TYPES = {
  RUNTIME: 'runtime_error',
  STORAGE: 'storage_error',
  API: 'api_error',
  SYNC: 'sync_error',
  UI: 'ui_error'
};

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.initialized = false;
    this.init();
  }

  async init() {
    if (this.initialized) return;

    // Load existing errors from storage
    const { errorLog = [] } = await chrome.storage.local.get('errorLog');
    this.errors = errorLog;

    // Set up error listeners
    this.setupListeners();

    this.initialized = true;
  }

  setupListeners() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: ERROR_TYPES.RUNTIME,
        error: event.reason,
        context: 'Unhandled Promise Rejection'
      });
    });

    // Handle runtime errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: ERROR_TYPES.RUNTIME,
        error: event.error,
        context: 'Runtime Error'
      });
    });

    // Monitor Chrome API errors
    chrome.runtime.onError.addListener((error) => {
      this.trackError({
        type: ERROR_TYPES.API,
        error,
        context: 'Chrome API Error'
      });
    });
  }

  async trackError({
    type,
    error,
    context = '',
    metadata = {}
  }) {
    const errorInfo = {
      type,
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      version: chrome.runtime.getManifest().version
    };

    // Add error to the queue
    this.errors.push(errorInfo);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Save to storage
    await this.saveErrors();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorInfo);
    }

    // Check if error reporting is enabled
    const { enableErrorReporting = false } = await chrome.storage.sync.get('enableErrorReporting');
    if (enableErrorReporting) {
      await this.reportError(errorInfo);
    }
  }

  async saveErrors() {
    try {
      await chrome.storage.local.set({ errorLog: this.errors });
    } catch (error) {
      console.error('Failed to save errors:', error);
    }
  }

  async reportError(errorInfo) {
    try {
      const { errorReportingUrl = '' } = await chrome.storage.sync.get('errorReportingUrl');
      
      if (!errorReportingUrl) return;

      const response = await fetch(errorReportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorInfo,
          extensionId: chrome.runtime.id
        })
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  async getErrors(filter = {}) {
    const filteredErrors = this.errors.filter(error => {
      for (const [key, value] of Object.entries(filter)) {
        if (error[key] !== value) return false;
      }
      return true;
    });

    return filteredErrors;
  }

  async clearErrors() {
    this.errors = [];
    await this.saveErrors();
  }

  // Get error statistics
  async getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recentErrors: this.errors.slice(-5),
      errorRate: 0
    };

    // Calculate errors by type
    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    // Calculate error rate (errors per hour) over the last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp) > last24Hours
    );

    stats.errorRate = recentErrors.length / 24;

    return stats;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Export types for TypeScript support
export { ERROR_TYPES };
