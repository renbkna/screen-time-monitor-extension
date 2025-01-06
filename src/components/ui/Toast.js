/**
 * Toast notification component
 */
export default class Toast {
  constructor() {
    this.timeouts = new Map();
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      `;
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const id = Date.now().toString();
    const toast = document.createElement('div');
    toast.id = `toast-${id}`;
    toast.className = `toast toast-${type} fade-enter`;
    toast.style.cssText = `
      padding: 0.75rem 1rem;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 24rem;
      animation: slideIn 0.2s ease-out;
    `;

    const icon = this.getIcon(type);
    const messageText = document.createElement('span');
    messageText.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(messageText);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--gray-500);
      padding: 0 0.25rem;
    `;
    closeButton.onclick = () => this.hide(id);
    toast.appendChild(closeButton);

    this.container.appendChild(toast);

    // Add timeout for auto-removal
    if (duration > 0) {
      const timeout = setTimeout(() => this.hide(id), duration);
      this.timeouts.set(id, timeout);
    }

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('fade-enter');
    });

    return id;
  }

  hide(id) {
    const toast = document.getElementById(`toast-${id}`);
    if (toast) {
      toast.classList.add('fade-exit');
      setTimeout(() => {
        toast.remove();
      }, 200);

      // Clear timeout if exists
      if (this.timeouts.has(id)) {
        clearTimeout(this.timeouts.get(id));
        this.timeouts.delete(id);
      }
    }
  }

  getIcon(type) {
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    `;

    switch (type) {
      case 'success':
        icon.innerHTML = `
          <svg viewBox="0 0 20 20" fill="var(--success)">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        `;
        break;
      case 'error':
        icon.innerHTML = `
          <svg viewBox="0 0 20 20" fill="var(--danger)">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
        `;
        break;
      case 'warning':
        icon.innerHTML = `
          <svg viewBox="0 0 20 20" fill="var(--warning)">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        `;
        break;
      default: // info
        icon.innerHTML = `
          <svg viewBox="0 0 20 20" fill="var(--primary)">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        `;
    }

    return icon;
  }

  // Static convenience methods
  static success(message, duration) {
    return new Toast().show(message, 'success', duration);
  }

  static error(message, duration) {
    return new Toast().show(message, 'error', duration);
  }

  static warning(message, duration) {
    return new Toast().show(message, 'warning', duration);
  }

  static info(message, duration) {
    return new Toast().show(message, 'info', duration);
  }
}