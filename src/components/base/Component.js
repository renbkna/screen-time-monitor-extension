/**
 * Base component class that provides common functionality
 */

import LoadingState from '../ui/LoadingState.js';
import ErrorState from '../ui/ErrorState.js';
import Toast from '../ui/Toast.js';

export default class Component {
  constructor(container) {
    this.container = typeof container === 'string' ? 
      document.querySelector(container) : container;
    this.state = {};
    this.loadingState = new LoadingState();
    this.isLoading = false;
    this.error = null;
  }

  /**
   * Set the component's state and trigger a re-render
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    this.isLoading = true;
    this.loadingState.render(this.container, { message });
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false;
  }

  /**
   * Show error state
   */
  showError(message, options = {}) {
    this.error = message;
    ErrorState.show(this.container, message, options);
  }

  /**
   * Clear error state
   */
  clearError() {
    this.error = null;
  }

  /**
   * Show success toast notification
   */
  showSuccess(message, duration = 3000) {
    Toast.success(message, duration);
  }

  /**
   * Show error toast notification
   */
  showErrorToast(message, duration = 3000) {
    Toast.error(message, duration);
  }

  /**
   * Show warning toast notification
   */
  showWarning(message, duration = 3000) {
    Toast.warning(message, duration);
  }

  /**
   * Show info toast notification
   */
  showInfo(message, duration = 3000) {
    Toast.info(message, duration);
  }

  /**
   * Wrap an async operation with loading state
   */
  async withLoading(operation, loadingMessage = 'Loading...') {
    try {
      this.showLoading(loadingMessage);
      await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Add event listener with automatic cleanup
   */
  addListener(element, event, handler) {
    if (!this._listeners) {
      this._listeners = [];
    }

    element.addEventListener(event, handler);
    this._listeners.push({ element, event, handler });
  }

  /**
   * Clean up all event listeners
   */
  cleanup() {
    if (this._listeners) {
      this._listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this._listeners = [];
    }
  }

  /**
   * Default render method - should be overridden by child classes
   */
  render() {
    throw new Error('render() method must be implemented by child class');
  }

  /**
   * Initialize the component
   */
  async init() {
    await this.render();
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.cleanup();
  }
}