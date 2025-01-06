/**
 * Loading state component
 */
export default class LoadingState {
  constructor(type = 'spinner') {
    this.type = type;
  }

  render(container, options = {}) {
    const { message = 'Loading...', height = 'auto' } = options;

    const loadingHtml = `
      <div class="loading-container" style="height: ${height}; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: var(--space-3);">
        ${this.type === 'spinner' ? 
          '<div class="loading-spinner"></div>' : 
          '<div class="loading-pulse"></div>'
        }
        ${message ? `<p class="loading-message" style="color: var(--gray-600); font-size: 0.875rem;">${message}</p>` : ''}
      </div>
    `;

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (container) {
      container.innerHTML = loadingHtml;
    }

    return loadingHtml;
  }

  static spinner(container, options) {
    return new LoadingState('spinner').render(container, options);
  }

  static pulse(container, options) {
    return new LoadingState('pulse').render(container, options);
  }
}