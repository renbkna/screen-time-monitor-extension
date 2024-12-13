export default class BlockingSettings {
  constructor(container) {
    this.container = container;
    this.blockingRules = new Map();
    this.init();
  }

  async init() {
    await this.loadBlockingRules();
    this.render();
    this.attachEventListeners();
  }

  async loadBlockingRules() {
    const { blocking = {} } = await chrome.storage.local.get('blocking');
    this.blockingRules = new Map(Object.entries(blocking));
  }

  async saveBlockingRules() {
    const blocking = Object.fromEntries(this.blockingRules);
    await chrome.storage.local.set({ blocking });
  }

  render() {
    this.container.innerHTML = `
      <div class="blocking-settings">
        <h2>Website Blocking</h2>
        
        <div class="add-site">
          <input type="text" id="newSite" placeholder="Enter domain (e.g., facebook.com, *.youtube.com)">
          <button id="addSiteBtn">Add Site</button>
        </div>

        <div class="blocked-sites" id="blockedSitesList">
          ${this.renderBlockedSites()}
        </div>
      </div>
    `;
  }

  renderBlockedSites() {
    if (this.blockingRules.size === 0) {
      return '<p class="no-sites">No sites blocked yet</p>';
    }

    return Array.from(this.blockingRules.entries()).map(([domain, rules]) => `
      <div class="blocked-site" data-domain="${domain}">
        <div class="site-header">
          <input type="checkbox" 
                 class="site-enabled" 
                 ${rules.enabled ? 'checked' : ''}>
          <span class="domain">${domain}</span>
          <button class="remove-site">×</button>
        </div>

        <div class="site-settings">
          <div class="schedule-settings">
            <h4>Blocking Schedule</h4>
            <div class="days-select">
              ${this.renderDaySelectors(rules.schedule?.days || [])}
            </div>
            <div class="time-range">
              <input type="time" 
                     class="start-time" 
                     value="${rules.schedule?.startTime || '00:00'}">
              <span>to</span>
              <input type="time" 
                     class="end-time" 
                     value="${rules.schedule?.endTime || '23:59'}">
            </div>
          </div>

          <div class="limit-settings">
            <label>
              <input type="checkbox" 
                     class="block-on-limit" 
                     ${rules.blockOnLimit ? 'checked' : ''}>
              Block when daily time limit is reached
            </label>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderDaySelectors(selectedDays) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, index) => `
      <label class="day-select">
        <input type="checkbox" 
               value="${index}" 
               ${selectedDays.includes(index) ? 'checked' : ''}>
        ${day}
      </label>
    `).join('');
  }

  attachEventListeners() {
    // Add new site
    const addSiteBtn = this.container.querySelector('#addSiteBtn');
    const newSiteInput = this.container.querySelector('#newSite');

    addSiteBtn.addEventListener('click', () => {
      const domain = newSiteInput.value.trim();
      if (domain) {
        this.addBlockedSite(domain);
        newSiteInput.value = '';
      }
    });

    // Site list event delegation
    const sitesList = this.container.querySelector('#blockedSitesList');
    sitesList.addEventListener('click', (e) => {
      const siteEl = e.target.closest('.blocked-site');
      if (!siteEl) return;

      const domain = siteEl.dataset.domain;

      if (e.target.matches('.remove-site')) {
        this.removeBlockedSite(domain);
      }
    });

    // Handle changes to site settings
    sitesList.addEventListener('change', (e) => {
      const siteEl = e.target.closest('.blocked-site');
      if (!siteEl) return;

      const domain = siteEl.dataset.domain;
      this.updateSiteSettings(domain, siteEl);
    });
  }

  async addBlockedSite(domain) {
    if (this.blockingRules.has(domain)) return;

    this.blockingRules.set(domain, {
      enabled: true,
      schedule: {
        days: [0, 1, 2, 3, 4, 5, 6],
        startTime: '00:00',
        endTime: '23:59'
      },
      blockOnLimit: false
    });

    await this.saveBlockingRules();
    this.render();
  }

  async removeBlockedSite(domain) {
    this.blockingRules.delete(domain);
    await this.saveBlockingRules();
    this.render();
  }

  async updateSiteSettings(domain, siteEl) {
    const rules = this.blockingRules.get(domain);
    if (!rules) return;

    // Update enabled state
    rules.enabled = siteEl.querySelector('.site-enabled').checked;

    // Update schedule
    const selectedDays = Array.from(siteEl.querySelectorAll('.day-select input:checked'))
      .map(input => parseInt(input.value));

    rules.schedule = {
      days: selectedDays,
      startTime: siteEl.querySelector('.start-time').value,
      endTime: siteEl.querySelector('.end-time').value
    };

    // Update limit settings
    rules.blockOnLimit = siteEl.querySelector('.block-on-limit').checked;

    await this.saveBlockingRules();
  }
}
