/**
 * Onboarding component for first-time users
 */
export default class Onboarding {
  constructor() {
    this.steps = [
      {
        target: '.tab-navigation',
        title: 'Welcome to Screen Time Monitor',
        content: 'Use these tabs to navigate between different features.',
        position: 'bottom'
      },
      {
        target: '#focus-mode-controls',
        title: 'Focus Mode',
        content: 'Start a focus session to block distracting websites and stay productive.',
        position: 'left'
      },
      {
        target: '#limit-settings',
        title: 'Set Time Limits',
        content: 'Set daily or weekly limits for specific websites.',
        position: 'right'
      },
      {
        target: '#daily-overview',
        title: 'Track Your Time',
        content: 'Monitor your daily screen time and browsing habits.',
        position: 'top'
      }
    ];
    
    this.currentStep = 0;
    this.overlay = null;
    this.tooltip = null;
  }

  async start() {
    const isFirstTime = await this.checkFirstTimeUser();
    if (!isFirstTime) return;

    this.createOverlay();
    this.createTooltip();
    this.showStep(0);
    this.markOnboardingComplete();
  }

  async checkFirstTimeUser() {
    const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');
    return !onboardingComplete;
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(this.overlay);

    // Fade in
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'onboarding-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--space-4);
      max-width: 300px;
      opacity: 0;
      transition: all 0.3s;
    `;
    document.body.appendChild(this.tooltip);
  }

  showStep(index) {
    const step = this.steps[index];
    if (!step) {
      this.finish();
      return;
    }

    const target = document.querySelector(step.target);
    if (!target) {
      this.nextStep();
      return;
    }

    // Highlight target element
    const targetRect = target.getBoundingClientRect();
    const buffer = 8; // padding around the element

    this.overlay.innerHTML = `
      <div class="highlight" style="
        position: absolute;
        top: ${targetRect.top - buffer}px;
        left: ${targetRect.left - buffer}px;
        width: ${targetRect.width + buffer * 2}px;
        height: ${targetRect.height + buffer * 2}px;
        border-radius: var(--radius);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      "></div>
    `;

    // Show tooltip
    this.tooltip.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${step.title}</h3>
      <p class="text-gray-600 mb-4">${step.content}</p>
      <div class="flex justify-between items-center">
        <div class="flex gap-1">
          ${this.steps.map((_, i) => `
            <div class="w-2 h-2 rounded-full ${i === index ? 'bg-primary' : 'bg-gray-300'}"></div>
          `).join('')}
        </div>
        <div class="flex gap-2">
          ${index > 0 ? `
            <button class="btn btn-secondary btn-sm" data-action="prev">
              Previous
            </button>
          ` : ''}
          <button class="btn btn-primary btn-sm" data-action="${index < this.steps.length - 1 ? 'next' : 'finish'}">
            ${index < this.steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    `;

    // Position tooltip
    this.positionTooltip(targetRect, step.position);

    // Add event listeners
    this.tooltip.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'next') this.nextStep();
        else if (action === 'prev') this.previousStep();
        else if (action === 'finish') this.finish();
      });
    });
  }

  positionTooltip(targetRect, position) {
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const margin = 16;

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - margin;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + margin;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.opacity = '1';
  }

  nextStep() {
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  previousStep() {
    this.currentStep--;
    this.showStep(this.currentStep);
  }

  finish() {
    // Fade out overlay and tooltip
    this.overlay.style.opacity = '0';
    this.tooltip.style.opacity = '0';

    // Remove elements after animation
    setTimeout(() => {
      this.overlay.remove();
      this.tooltip.remove();
    }, 300);
  }

  async markOnboardingComplete() {
    await chrome.storage.local.set({ onboardingComplete: true });
  }

  // Static method to initialize onboarding
  static async init() {
    const onboarding = new Onboarding();
    await onboarding.start();
    return onboarding;
  }
}