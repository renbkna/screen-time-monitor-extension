/**
 * Tooltip and guidance component
 */
export default class Tooltip {
  constructor() {
    this.tooltipElement = null;
    this.activeTarget = null;
    this.hideTimeout = null;
    this.init();
  }

  init() {
    // Create tooltip element
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'tooltip';
    this.tooltipElement.style.cssText = `
      position: fixed;
      z-index: 9999;
      padding: 8px 12px;
      background: var(--gray-900);
      color: white;
      border-radius: var(--radius);
      font-size: 0.875rem;
      max-width: 250px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    `;
    document.body.appendChild(this.tooltipElement);

    // Initialize tooltips
    this.initializeTooltips();
  }

  initializeTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', () => this.show(element));
      element.addEventListener('mouseleave', () => this.hide());
      element.addEventListener('focus', () => this.show(element));
      element.addEventListener('blur', () => this.hide());
    });
  }

  show(target) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    const tooltip = target.dataset.tooltip;
    if (!tooltip) return;

    this.activeTarget = target;
    this.tooltipElement.textContent = tooltip;
    this.tooltipElement.style.opacity = '1';

    // Position the tooltip
    this.position(target);
  }

  hide() {
    this.hideTimeout = setTimeout(() => {
      this.tooltipElement.style.opacity = '0';
      this.activeTarget = null;
    }, 100);
  }

  position(target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    // Default position above the element
    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

    // Check if tooltip would go off screen
    if (top < 8) {
      // Show below instead
      top = targetRect.bottom + 8;
    }

    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  // Update tooltip content
  updateContent(target, content) {
    target.dataset.tooltip = content;
    if (this.activeTarget === target) {
      this.show(target);
    }
  }

  // Show a tooltip programmatically
  static show(target, content, duration = 3000) {
    const instance = new Tooltip();
    instance.updateContent(target, content);
    instance.show(target);

    if (duration > 0) {
      setTimeout(() => instance.hide(), duration);
    }

    return instance;
  }
}
