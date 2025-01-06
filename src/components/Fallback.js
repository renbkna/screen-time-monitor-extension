/**
 * Fallback component for handling component failures
 */

class Fallback {
  /**
   * Create a fallback component
   * @param {string} message - Error message to display
   * @param {Function} retryAction - Action to retry
   */
  constructor(message, retryAction = null) {
    this.message = message;
    this.retryAction = retryAction;
  }

  /**
   * Render the fallback UI
   * @param {HTMLElement} container - Container to render in
   */
  render(container) {
    container.innerHTML = `
      <div class="fallback-container">
        <div class="fallback-content">
          <div class="fallback-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p class="fallback-message">${this.message}</p>
          ${this.retryAction ? `
            <button class="btn" id="fallback-retry">Try Again</button>
          ` : ''}
        </div>
      </div>
    `;

    if (this.retryAction) {
      const retryButton = container.querySelector('#fallback-retry');
      retryButton?.addEventListener('click', () => {
        try {
          this.retryAction();
        } catch (error) {
          console.error('Error during retry:', error);
        }
      });
    }
  }

  /**
   * Create a fallback for loading failures
   * @param {Function} retryAction - Action to retry loading
   * @returns {Fallback} Fallback instance
   */
  static loading(retryAction = null) {
    return new Fallback(
      'Failed to load content. Please try again.',
      retryAction
    );
  }

  /**
   * Create a fallback for data failures
   * @param {Function} retryAction - Action to retry data fetch
   * @returns {Fallback} Fallback instance
   */
  static data(retryAction = null) {
    return new Fallback(
      'Failed to load data. Please check your connection and try again.',
      retryAction
    );
  }

  /**
   * Create a fallback for permission failures
   * @returns {Fallback} Fallback instance
   */
  static permission() {
    return new Fallback(
      'Permission denied. Please check your extension permissions.',
      null
    );
  }

  /**
   * Create a fallback for storage failures
   * @param {Function} retryAction - Action to retry storage operation
   * @returns {Fallback} Fallback instance
   */
  static storage(retryAction = null) {
    return new Fallback(
      'Storage error. Please check your browser settings.',
      retryAction
    );
  }
};

export default Fallback;