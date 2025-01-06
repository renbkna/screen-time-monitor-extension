/**
 * Error Boundary component for handling component errors gracefully
 */

class ErrorBoundary {
  constructor(container) {
    this.container = container;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Render error UI
    this.container.innerHTML = `
      <div class="error-state">
        <h3>Something went wrong</h3>
        <p>We're sorry, but something went wrong. Please try again.</p>
        <button class="btn" onclick="window.location.reload()">Reload</button>
        ${error.message ? `<p class="error-details">${error.message}</p>` : ''}
      </div>
    `;
  }

  /**
   * Wrap a component with error boundary
   * @param {Function} component - Component to wrap
   * @returns {Function} Wrapped component
   */
  static wrap(component) {
    return function wrappedComponent(...args) {
      try {
        return component.apply(this, args);
      } catch (error) {
        const boundary = new ErrorBoundary(this);
        boundary.componentDidCatch(error, { componentStack: error.stack });
        return null;
      }
    };
  }
}

export default ErrorBoundary;