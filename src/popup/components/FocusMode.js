import { getFocusStatus, startFocusMode, endFocusMode } from '../../utils/focus.js';

export default class FocusMode {
  constructor(container) {
    this.container = container;
    this.updateInterval = null;
    this.init();
  }

  async init() {
    await this.render();
    this.attachEventListeners();
    this.startUpdates();
  }

  async render() {
    const focusMode = await getFocusStatus();
    let content;

    if (focusMode.enabled) {
      content = this.renderActiveFocusMode(focusMode);
    } else {
      content = this.renderFocusSetup();
    }

    this.container.innerHTML = `
      <div class="focus-mode-container">
        <h2>Focus Mode</h2>
        ${content}
      </div>
    `;
  }

  renderFocusSetup() {
    return `
      <div class="focus-setup">
        <p class="focus-description">
          Block distracting websites and stay focused on your tasks.
        </p>
        
        <div class="focus-duration">
          <label for="duration">Focus Duration (minutes):</label>
          <select id="duration" class="duration-select">
            <option value="25">25 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="custom">Custom...</option>
          </select>
          <input type="number" 
                 id="customDuration" 
                 class="custom-duration hidden" 
                 min="1" 
                 max="480" 
                 placeholder="Enter minutes">
        </div>

        <div class="site-lists">
          <div class="blocked-sites">
            <h3>Block These Sites</h3>
            <textarea id="blockedSites" 
                      placeholder="Enter domains to block (one per line)&#10;Example: facebook.com">
            </textarea>
          </div>

          <div class="allowed-sites">
            <h3>Allow These Sites</h3>
            <textarea id="allowedSites" 
                      placeholder="Enter domains to allow (one per line)&#10;Example: docs.google.com">
            </textarea>
          </div>
        </div>

        <button id="startFocus" class="primary-btn">Start Focus Session</button>
      </div>
    `;
  }

  renderActiveFocusMode(focusMode) {
    const remainingTime = Math.max(0, Math.ceil((focusMode.endTime - Date.now()) / (60 * 1000)));
    
    return `
      <div class="focus-active">
        <div class="focus-timer">
          <div class="time-remaining">${remainingTime} minutes remaining</div>
          <div class="progress-bar">
            <div class="progress" style="width: ${(remainingTime / focusMode.duration) * 100}%"></div>
          </div>
        </div>

        <div class="focus-details">
          <h3>Currently Blocking:</h3>
          <ul class="blocked-list">
            ${focusMode.blockedSites.map(site => `<li>${site}</li>`).join('')}
          </ul>
        </div>

        <button id="endFocus" class="secondary-btn">End Focus Session</button>
      </div>
    `;
  }

  attachEventListeners() {
    // Handle duration selection
    const durationSelect = this.container.querySelector('#duration');
    const customDuration = this.container.querySelector('#customDuration');

    if (durationSelect) {
      durationSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          customDuration.classList.remove('hidden');
          customDuration.focus();
        } else {
          customDuration.classList.add('hidden');
        }
      });
    }

    // Handle start focus button
    const startButton = this.container.querySelector('#startFocus');
    if (startButton) {
      startButton.addEventListener('click', async () => {
        const duration = durationSelect.value === 'custom' 
          ? parseInt(customDuration.value) 
          : parseInt(durationSelect.value);

        if (!duration || duration < 1) {
          alert('Please enter a valid duration');
          return;
        }

        const blockedSites = this.container
          .querySelector('#blockedSites')
          .value
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

        const allowedSites = this.container
          .querySelector('#allowedSites')
          .value
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

        await startFocusMode(duration, blockedSites, allowedSites);
        await this.render();
      });
    }

    // Handle end focus button
    const endButton = this.container.querySelector('#endFocus');
    if (endButton) {
      endButton.addEventListener('click', async () => {
        await endFocusMode();
        await this.render();
      });
    }
  }

  startUpdates() {
    // Update the display every minute
    this.updateInterval = setInterval(async () => {
      const focusMode = await getFocusStatus();
      if (focusMode.enabled) {
        await this.render();
      }
    }, 60000); // Update every minute
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
