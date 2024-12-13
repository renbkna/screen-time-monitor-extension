/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      operations: new Map(),
      timeouts: new Set(),
      intervals: new Set(),
      listeners: new WeakMap(),
      memoryUsage: []
    };

    this.thresholds = {
      operationTime: 100, // ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
      listenerCount: 10,
      storageSize: 5 * 1024 * 1024 // 5MB
    };

    this.init();
  }

  init() {
    this.startMemoryMonitoring();
    this.monitorStorage();
    this.monitorEventListeners();
  }

  async trackOperation(name, operation) {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - start;
      this.recordOperationMetrics(name, duration);
    }
  }

  recordOperationMetrics(name, duration) {
    if (!this.metrics.operations.has(name)) {
      this.metrics.operations.set(name, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        slowOperations: 0
      });
    }

    const metrics = this.metrics.operations.get(name);
    metrics.count++;
    metrics.totalTime += duration;
    metrics.averageTime = metrics.totalTime / metrics.count;

    if (duration > this.thresholds.operationTime) {
      metrics.slowOperations++;
      this.reportSlowOperation(name, duration);
    }
  }

  startMemoryMonitoring() {
    const recordMemory = () => {
      if (performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          used: usedJSHeapSize,
          total: totalJSHeapSize
        });

        const hourAgo = Date.now() - 3600000;
        this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
          m => m.timestamp > hourAgo
        );

        if (usedJSHeapSize > this.thresholds.memoryUsage) {
          this.reportMemoryWarning(usedJSHeapSize);
        }
      }
    };

    const intervalId = setInterval(recordMemory, 60000);
    this.metrics.intervals.add(intervalId);
  }

  async monitorStorage() {
    const checkStorage = async () => {
      const { bytesInUse } = await chrome.storage.local.getBytesInUse();
      
      if (bytesInUse > this.thresholds.storageSize) {
        this.reportStorageWarning(bytesInUse);
      }
    };

    const intervalId = setInterval(checkStorage, 300000);
    this.metrics.intervals.add(intervalId);
  }

  monitorEventListeners() {
    const addListener = EventTarget.prototype.addEventListener;
    const removeListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function(...args) {
      const listeners = this.metrics.listeners.get(this) || new Set();
      listeners.add(args[1]);
      this.metrics.listeners.set(this, listeners);

      if (listeners.size > this.thresholds.listenerCount) {
        this.reportListenerWarning(this, listeners.size);
      }

      return addListener.apply(this, args);
    }.bind(this);

    EventTarget.prototype.removeEventListener = function(...args) {
      const listeners = this.metrics.listeners.get(this);
      if (listeners) {
        listeners.delete(args[1]);
      }
      return removeListener.apply(this, args);
    }.bind(this);
  }

  reportSlowOperation(name, duration) {
    console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }

  reportMemoryWarning(usedMemory) {
    console.warn(`High memory usage: ${(usedMemory / 1024 / 1024).toFixed(2)}MB`);
  }

  reportStorageWarning(bytesInUse) {
    console.warn(`High storage usage: ${(bytesInUse / 1024 / 1024).toFixed(2)}MB`);
  }

  reportListenerWarning(target, count) {
    console.warn(`High listener count on ${target}: ${count} listeners`);
  }

  getMetrics() {
    return {
      operations: Object.fromEntries(this.metrics.operations),
      memoryUsage: this.metrics.memoryUsage,
      listenerCount: Array.from(this.metrics.listeners.values())
        .reduce((total, listeners) => total + listeners.size, 0)
    };
  }

  destroy() {
    this.metrics.intervals.forEach(id => clearInterval(id));
    this.metrics.intervals.clear();
    this.metrics.timeouts.forEach(id => clearTimeout(id));
    this.metrics.timeouts.clear();
    this.metrics.operations.clear();
    this.metrics.listeners = new WeakMap();
    this.metrics.memoryUsage = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export async function measureAsync(name, operation) {
  return performanceMonitor.trackOperation(name, operation);
}

export async function batchProcess(items, processFunction, batchSize = 5) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(item => processFunction(item))
    );
    results.push(...batchResults);
  }

  return results;
}