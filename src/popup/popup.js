import { getFocusStatus, getFocusTemplates } from '../utils/focus.js';
import FocusMode from './components/FocusMode.js';
import FocusStats from './components/FocusStats.js';

class PopupManager {
  constructor() {
    this.currentTab = 'overview';
    this.components = {};
    this.init();
  }

  async init() {
    this.attachTabListeners();
    await this.initializeComponents();
    this.showTab(this.currentTab);
  }

  attachTabListeners() {
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        this.showTab(tab);
      });
    });
  }

  async initializeComponents() {
    // Initialize Focus Mode components
    const focusModeContainer = document.getElementById('focus-mode-controls');
    const focusStatsContainer = document.getElementById('focus-mode-stats');
    
    this.components.focusMode = new FocusMode(focusModeContainer);
    this.components.focusStats = new FocusStats(focusStatsContainer);

    // Update focus mode display
    const focusMode = await getFocusStatus();
    if (focusMode.enabled) {
      focusStatsContainer.classList.remove('hidden');
    }

    // Initialize other components (LimitSettings, etc.)
    // ...
  }

  showTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabId);
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });

    this.currentTab = tabId;
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
