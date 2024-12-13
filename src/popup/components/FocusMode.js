import Component from '../../components/base/Component.js';
import { getFocusStatus, startFocusMode, endFocusMode, getFocusTemplates } from '../../utils/focus.js';

export default class FocusMode extends Component {
  constructor(container) {
    super(container);
    this.updateInterval = null;
    this.state = {
      focusMode: null,
      templates: getFocusTemplates(),
      selectedTemplate: null,
      customDuration: 25
    };
  }

  async init() {
    await this.loadFocusStatus();
    this.startUpdates();
    await this.render();
    this.attachEventListeners();
  }

  async loadFocusStatus() {
    await this.withLoading(async () => {
      const focusMode = await getFocusStatus();
      this.setState({ focusMode });
    }, 'Loading focus mode status...');
  }

  startUpdates() {
    // Update the display every minute
    this.updateInterval = setInterval(async () => {
      if (this.state.focusMode?.enabled) {
        await this.loadFocusStatus();
      }
    }, 60000);
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getRemainingTime() {
    const { focusMode } = this.state;
    if (!focusMode?.enabled || !focusMode.endTime) return 0;
    return Math.max(0, Math.ceil((focusMode.endTime - Date.now()) / (60 * 1000)));
  }

  getProgressPercentage() {
    const { focusMode } = this.state;
    if (!focusMode?.enabled) return 0;
    const elapsed = Date.now() - focusMode.startTime;
    const total = focusMode.duration * 60 * 1000;
    return Math.min(100, (elapsed / total) * 100);
  }

  renderActiveSession() {
    const remainingTime = this.getRemainingTime();
    const progress = this.getProgressPercentage();
    const { focusMode } = this.state;

    return `
      <div class="focus-active card">
        <div class="focus-timer">
          <div class="time-display">
            <span class="time-value">${remainingTime}</span>
            <span class="time-label">minutes remaining</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
        </div>

        <div class="focus-details">
          ${focusMode.blockedSites.length > 0 ? `
            <div class="blocked-sites">
              <h4>Currently Blocking:</h4>
              <ul>
                ${focusMode.blockedSites.map(site => `<li>${site}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${focusMode.allowedSites.length > 0 ? `
            <div class="allowed-sites">
              <h4>Allowed Sites:</h4>
              <ul>
                ${focusMode.allowedSites.map(site => `<li>${site}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <button class="btn btn-secondary end-focus" data-action="end-focus">
          <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>
          End Focus Session
        </button>
      </div>
    `;
  }

  renderSetup() {
    const { templates, selectedTemplate, customDuration } = this.state;

    return `
      <div class="focus-setup card">
        <div class="setup-header">
          <h3>Start Focus Session</h3>
          <p>Choose a template or customize your session</p>
        </div>

        <div class="templates-grid">
          ${templates.map((template, index) => `
            <div class="template-card ${selectedTemplate === index ? 'selected' : ''}" 
                 data-template="${index}">
              <h4>${template.name}</h4>
              <div class="template-details">
                <span>${template.duration} minutes</span>
                <span>${template.blockedSites.length} sites blocked</span>
              </div>
            </div>
          `).join('')}

          <div class="template-card custom ${selectedTemplate === 'custom' ? 'selected' : ''}"
               data-template="custom">
            <h4>Custom Session</h4>
            <div class="custom-duration">
              <input type="number" 
                     id="customDuration" 
                     value="${customDuration}"
                     min="1" 
                     max="480"
                     class="duration-input">
              <span class="duration-label">minutes</span>
            </div>
          </div>
        </div>

        <div class="site-lists ${selectedTemplate === 'custom' ? '' : 'hidden'}">
          <div class="blocked-sites">
            <h4>Block These Sites</h4>
            <textarea id="blockedSites" 
                      placeholder="Enter domains to block (one per line)\nExample: facebook.com"></textarea>
          </div>

          <div class="allowed-sites">
            <h4>Allow These Sites</h4>
            <textarea id="allowedSites" 
                      placeholder="Enter domains to allow (one per line)\nExample: docs.google.com"></textarea>
          </div>
        </div>

        <button class="btn btn-primary start-focus" data-action="start-focus">
          <svg viewBox="0 0 20 20" fill="currentColor" class="btn-icon">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          Start Focus Session
        </button>
      </div>
    `;
  }

  render() {
    const { focusMode, error } = this.state;

    if (error) {
      this.showError(error, {
        retryButton: true,
        onRetry: () => this.loadFocusStatus()
      });
      return;
    }

    if (this.isLoading) return;

    this.container.innerHTML = focusMode?.enabled ? 
      this.renderActiveSession() : 
      this.renderSetup();
  }

  attachEventListeners() {
    // Template selection
    this.addListener(this.container, 'click', (e) => {
      const templateCard = e.target.closest('[data-template]');
      if (templateCard) {
        const templateIndex = templateCard.dataset.template;
        this.setState({ selectedTemplate: templateIndex });
      }
    });

    // Custom duration input
    this.addListener(this.container, 'input', (e) => {
      if (e.target.id === 'customDuration') {
        this.setState({ customDuration: parseInt(e.target.value) || 25 });
      }
    });

    // Start/End focus actions
    this.addListener(this.container, 'click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'start-focus') {
        await this.handleStartFocus();
      } else if (action === 'end-focus') {
        await this.handleEndFocus();
      }
    });
  }

  async handleStartFocus() {
    const { selectedTemplate, templates, customDuration } = this.state;

    try {
      let duration, blockedSites, allowedSites;

      if (selectedTemplate === 'custom') {
        duration = customDuration;
        blockedSites = document.getElementById('blockedSites')
          .value.split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        allowedSites = document.getElementById('allowedSites')
          .value.split('\n')
          .map(s => s.trim())
          .filter(Boolean);
      } else {
        const template = templates[selectedTemplate];
        duration = template.duration;
        blockedSites = template.blockedSites;
        allowedSites = template.allowedSites;
      }

      await startFocusMode(duration, blockedSites, allowedSites);
      this.showSuccess('Focus session started');
      await this.loadFocusStatus();
    } catch (error) {
      this.showErrorToast('Failed to start focus session');
      console.error('Error starting focus session:', error);
    }
  }

  async handleEndFocus() {
    try {
      await endFocusMode();
      this.showInfo('Focus session ended');
      await this.loadFocusStatus();
    } catch (error) {
      this.showErrorToast('Failed to end focus session');
      console.error('Error ending focus session:', error);
    }
  }

  destroy() {
    this.stopUpdates();
    super.destroy();
  }
}