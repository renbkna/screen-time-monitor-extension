/**
 * UI utilities for handling loading states, errors, and notifications
 */

// Toast notification container
let toastContainer = null;

/**
 * Show a loading spinner in a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Loading spinner element
 */
export function showLoading(container) {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  container.appendChild(spinner);
  container.classList.add('loading');
  return spinner;
}

/**
 * Hide the loading spinner
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} spinner - Spinner element to remove
 */
export function hideLoading(container, spinner) {
  if (spinner && spinner.parentNode) {
    spinner.remove();
  }
  container.classList.remove('loading');
}

/**
 * Show an error message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 * @param {boolean} [isTemporary=false] - Whether to auto-hide the error
 */
export function showError(container, message, isTemporary = false) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-state';
  errorDiv.textContent = message;

  container.appendChild(errorDiv);

  if (isTemporary) {
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

/**
 * Show an empty state message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Empty state message
 */
export function showEmptyState(container, message) {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.textContent = message;

  container.appendChild(emptyDiv);
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {'success' | 'error' | 'warning'} type - Notification type
 */
export function showToast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '1000';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 300);
  }, 3000);
}

/**
 * Create a loading skeleton
 * @param {string} type - Type of skeleton ('text', 'circle', 'button')
 * @returns {HTMLElement} Skeleton element
 */
export function createSkeleton(type) {
  const skeleton = document.createElement('div');
  skeleton.className = `skeleton skeleton-${type}`;
  return skeleton;
}

/**
 * Add loading state to a button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Whether the button is in loading state
 */
export function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.dataset.originalText = button.textContent;
    button.textContent = '';
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/**
 * Add transition effect when switching tabs
 * @param {HTMLElement} oldContainer - Current container to transition out
 * @param {HTMLElement} newContainer - New container to transition in
 */
export function transitionContainers(oldContainer, newContainer) {
  // Hide old container
  oldContainer.style.opacity = '0';
  oldContainer.style.transform = 'translateY(10px)';

  setTimeout(() => {
    oldContainer.classList.add('hidden');
    newContainer.classList.remove('hidden');

    // Show new container
    requestAnimationFrame(() => {
      newContainer.style.opacity = '1';
      newContainer.style.transform = 'translateY(0)';
    });
  }, 300);
}

/**
 * Create an error boundary wrapper
 * @param {Function} component - Component function to wrap
 * @param {Function} fallback - Fallback function to call on error
 * @returns {Function} Wrapped component
 */
export function withErrorBoundary(component, fallback) {
  return function errorBoundaryWrapper(...args) {
    try {
      return component(...args);
    } catch (error) {
      console.error('Error in component:', error);
      return fallback(error);
    }
  };
}
