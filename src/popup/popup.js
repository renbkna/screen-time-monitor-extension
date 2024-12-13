import { registerShortcuts, makeAccessible, setupKeyboardNavigation } from '../utils/keyboard.js';
import Tooltip from '../components/ui/Tooltip.js';
import Onboarding from '../components/ui/Onboarding.js';
import FocusMode from './components/FocusMode.js';
import FocusStats from './components/FocusStats.js';

class PopupManager {
  constructor() {
    this.currentTab = 'overview';
    this.components = {};
    this.init();
  }

  async init() {
    this.initializeKeyboardShortcuts();
    this.setupAccessibility();
    await this.initializeComponents();
    this.showTab(this.currentTab);
    
    // Start onboarding for first-time users
    await Onboarding.init();
  }

  initializeKeyboardShortcuts() {
    registerShortcuts({
      toggleFocus: () => {
        this.showTab('focus');
      },
      showStats: () => {
        this.showTab('overview');
      },
      showLimits: () => {
        this.showTab('limits');
      },
      quickFocus: async () => {
        this.showTab('focus');
        await this.components.focusMode?.startQuickFocus();
      },
      closePopup: () => {
        window.close();
      }
    });
  }

  setupAccessibility() {
    // Make tabs accessible
    const tablist = document.querySelector('.tab-navigation');
    makeAccessible(tablist, { role: 'tablist' });

    document.querySelectorAll('.tab-button').forEach(button => {
      makeAccessible(button, {
        role: 'tab',
        selected: button.classList.contains('active'),
        controls: button.dataset.tab
      });
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      makeAccessible(panel, {
        role: 'tabpanel',
        label: `${panel.id} panel`
      });
    });

    // Setup keyboard navigation for tabs
    setupKeyboardNavigation(tablist, '.tab-button');
  }

  async initializeComponents() {
    // Initialize Focus Mode components
    const focusModeContainer = document.getElementById('focus-mode-controls');
    const focusStatsContainer = document.getElementById('focus-mode-stats');
    
    this.components.focusMode = new FocusMode(focusModeContainer);
    this.components.focusStats = new FocusStats(focusStatsContainer);

    // Add tooltips to key elements
    const tooltip = new Tooltip();
    this.addTooltips();

    // Initialize other components as needed
    // ...

    // Setup tab switching animation
    this.setupTabTransitions();
  }

  addTooltips() {
    const tooltips = [
      {
        target: '[data-tab="focus"]',
        content: 'Start a focus session (Alt+F)',
      },
      {
        target: '#quick-focus-button',
        content: 'Quick 25-minute focus session (Alt+Q)',
      },
      {
        target: '[data-tab="limits"]',
        content: 'Set website time limits (Alt+L)',
      },
      {
        target: '.stats-range-select',
        content: 'Change time range for statistics',
      }
    ];

    tooltips.forEach(({ target, content }) => {
      const element = document.querySelector(target);
      if (element) {
        element.dataset.tooltip = content;
      }
    });
  }

  setupTabTransitions() {
    const content = document.querySelector('.tab-content');
    content.addEventListener('beforeTransition', () => {
      content.classList.add('transitioning');
    });

    content.addEventListener('afterTransition', () => {
      content.classList.remove('transitioning');
    });
  }

  showTab(tabId) {
    const beforeEvent = new CustomEvent('beforeTransition', {
      detail: { from: this.currentTab, to: tabId }
    });
    document.dispatchEvent(beforeEvent);

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive);
      
      // Add ripple effect on tab change
      if (isActive) {
        this.addRipple(button);
      }
    });

    // Update tab panels with transition
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === tabId) {
        panel.classList.add('fade-enter');
        panel.classList.add('active');
        requestAnimationFrame(() => {
          panel.classList.remove('fade-enter');
        });
      } else {
        panel.classList.remove('active');
      }
    });

    this.currentTab = tabId;

    const afterEvent = new CustomEvent('afterTransition', {
      detail: { from: this.currentTab, to: tabId }
    });
    document.dispatchEvent(afterEvent);
  }

  addRipple(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    element.appendChild(ripple);

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  // Clean up when popup is closed
  destroy() {
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
  }
}

// Initialize popup
const popup = new PopupManager();

// Clean up on popup close
window.addEventListener('unload', () => {
  popup.destroy();
});
