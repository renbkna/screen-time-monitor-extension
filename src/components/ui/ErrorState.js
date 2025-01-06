/**
 * Error state component
 */
export default class ErrorState {
  constructor(message, options = {}) {
    this.message = message;
    this.options = options;
  }

  render(container) {
    const { retryButton = false, onRetry = null } = this.options;

    const errorHtml = `
      <div class="error-container">
        <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                clip-rule="evenodd" />
        </svg>
        <div class="error-content">
          <p class="error-message">${this.message}</p>
          ${retryButton ? 
            '<button class="btn btn-secondary retry-button">Try Again</button>' : 
            ''}
        </div>
      </div>
    `;

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (container) {
      container.innerHTML = errorHtml;

      if (retryButton && onRetry) {
        container
          .querySelector('.retry-button')
          .addEventListener('click', onRetry);
      }
    }

    return errorHtml;
  }

  static show(container, message, options = {}) {
    return new ErrorState(message, options).render(container);
  }
}