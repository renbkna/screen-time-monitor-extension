/**
 * LimitSettingsPanel Component
 * Handles the UI for setting and managing screen time limits
 */
export default class LimitSettingsPanel {
  constructor() {
    this.limits = new Map();
    this.element = this.createElement();
    this.bindEvents();
    this.loadLimits();
  }

  /**
   * Creates the main element for the limits panel
   */
  createElement() {
    const panel = document.createElement('div');
    panel.className = 'limit-settings-panel';
    panel.innerHTML = `
      <div class="limit-settings-header">
        <h2>Screen Time Limits</h2>
        <button class="primary-btn" id="add-limit-btn">Add Limit</button>
      </div>
      <div class="limit-list" id="limit-list"></div>
      <form class="limit-form hidden" id="limit-form">
        <div class="form-group">
          <label for="website">Website</label>
          <input type="text" id="website" required placeholder="example.com">
        </div>
        <div class="form-group">
          <label for="daily-limit">Daily Limit (minutes)</label>
          <input type="number" id="daily-limit" required min="1" max="1440">
        </div>
        <div class="form-group">
          <label for="weekly-limit">Weekly Limit (minutes)</label>
          <input type="number" id="weekly-limit" required min="1" max="10080">
        </div>
        <div class="form-actions">
          <button type="button" class="secondary-btn" id="cancel-limit-btn">Cancel</button>
          <button type="submit" class="primary-btn">Save</button>
        </div>
      </form>
    `;
    return panel;
  }

  /**
   * Binds event listeners to the panel elements
   */
  bindEvents() {
    const addBtn = this.element.querySelector('#add-limit-btn');
    const cancelBtn = this.element.querySelector('#cancel-limit-btn');
    const form = this.element.querySelector('#limit-form');

    addBtn.addEventListener('click', () => this.showForm());
    cancelBtn.addEventListener('click', () => this.hideForm());
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Shows the limit form
   */
  showForm() {
    const form = this.element.querySelector('#limit-form');
    form.classList.remove('hidden');
  }

  /**
   * Hides the limit form
   */
  hideForm() {
    const form = this.element.querySelector('#limit-form');
    form.classList.add('hidden');
    form.reset();
  }

  /**
   * Handles form submission for adding/editing limits
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const limit = {
      website: formData.get('website'),
      dailyLimit: parseInt(formData.get('daily-limit')),
      weeklyLimit: parseInt(formData.get('weekly-limit')),
      enabled: true
    };

    try {
      await this.saveLimitToStorage(limit);
      this.hideForm();
      this.refreshLimitsList();
    } catch (error) {
      console.error('Error saving limit:', error);
      // TODO: Show error message to user
    }
  }

  /**
   * Saves a limit to chrome storage
   */
  async saveLimitToStorage(limit) {
    const { website } = limit;
    const normalizedWebsite = this.normalizeWebsite(website);
    
    try {
      const storage = await chrome.storage.local.get('limits');
      const limits = storage.limits || {};
      limits[normalizedWebsite] = limit;
      await chrome.storage.local.set({ limits });
      this.limits.set(normalizedWebsite, limit);
    } catch (error) {
      throw new Error(`Failed to save limit: ${error.message}`);
    }
  }

  /**
   * Loads existing limits from storage
   */
  async loadLimits() {
    try {
      const storage = await chrome.storage.local.get('limits');
      const limits = storage.limits || {};
      
      this.limits.clear();
      Object.entries(limits).forEach(([website, limit]) => {
        this.limits.set(website, limit);
      });
      
      this.refreshLimitsList();
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  }

  /**
   * Refreshes the limits list UI
   */
  refreshLimitsList() {
    const listElement = this.element.querySelector('#limit-list');
    listElement.innerHTML = '';

    this.limits.forEach((limit, website) => {
      const card = this.createLimitCard(website, limit);
      listElement.appendChild(card);
    });
  }

  /**
   * Creates a card element for a limit
   */
  createLimitCard(website, limit) {
    const card = document.createElement('div');
    card.className = 'limit-card';
    card.innerHTML = `
      <div class="limit-card-header">
        <h3>${website}</h3>
        <label class="switch">
          <input type="checkbox" ${limit.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="limit-card-body">
        <p>Daily Limit: ${limit.dailyLimit} minutes</p>
        <p>Weekly Limit: ${limit.weeklyLimit} minutes</p>
      </div>
      <div class="limit-card-actions">
        <button class="secondary-btn" data-action="edit">Edit</button>
        <button class="secondary-btn" data-action="delete">Delete</button>
      </div>
    `;

    // Add event listeners for actions
    const toggle = card.querySelector('input[type="checkbox"]');
    toggle.addEventListener('change', () => this.toggleLimit(website, toggle.checked));

    const editBtn = card.querySelector('[data-action="edit"]');
    editBtn.addEventListener('click', () => this.editLimit(website, limit));

    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', () => this.deleteLimit(website));

    return card;
  }

  /**
   * Toggles a limit's enabled state
   */
  async toggleLimit(website, enabled) {
    const limit = this.limits.get(website);
    if (limit) {
      limit.enabled = enabled;
      await this.saveLimitToStorage(limit);
    }
  }

  /**
   * Prepares the form for editing an existing limit
   */
  editLimit(website, limit) {
    const form = this.element.querySelector('#limit-form');
    form.querySelector('#website').value = website;
    form.querySelector('#daily-limit').value = limit.dailyLimit;
    form.querySelector('#weekly-limit').value = limit.weeklyLimit;
    this.showForm();
  }

  /**
   * Deletes a limit
   */
  async deleteLimit(website) {
    try {
      const storage = await chrome.storage.local.get('limits');
      const limits = storage.limits || {};
      delete limits[website];
      await chrome.storage.local.set({ limits });
      this.limits.delete(website);
      this.refreshLimitsList();
    } catch (error) {
      console.error('Error deleting limit:', error);
    }
  }

  /**
   * Normalizes a website URL for consistent storage
   */
  normalizeWebsite(website) {
    // Remove protocol and www
    return website.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
  }
}