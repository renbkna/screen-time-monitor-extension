/**
 * LimitSettingsPanel component for managing website time limits
 */
class LimitSettingsPanel {
  constructor() {
    this.limitManager = new LimitManager();
    this.container = null;
    this.currentDomain = '';
    this.initializePanel();
  }

  async initializePanel() {
    this.container = document.createElement('div');
    this.container.className = 'limit-settings-panel';
    this.container.innerHTML = `
      <div class="limit-settings-header">
        <h2>Screen Time Limits</h2>
        <button id="add-limit-btn" class="primary-btn">Add New Limit</button>
      </div>
      <div class="limit-list-container">
        <div id="limit-list" class="limit-list"></div>
      </div>
      <div id="limit-form" class="limit-form hidden">
        <h3>Set Time Limit</h3>
        <div class="form-group">
          <label for="domain-input">Website Domain</label>
          <input type="text" id="domain-input" placeholder="e.g., example.com">
        </div>
        <div class="form-group">
          <label for="daily-limit">Daily Limit (minutes)</label>
          <input type="number" id="daily-limit" min="0" step="5">
        </div>
        <div class="form-group">
          <label for="weekly-limit">Weekly Limit (minutes)</label>
          <input type="number" id="weekly-limit" min="0" step="5">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="limit-enabled">
            Enable Limit
          </label>
        </div>
        <div class="form-actions">
          <button id="save-limit-btn" class="primary-btn">Save</button>
          <button id="cancel-limit-btn" class="secondary-btn">Cancel</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadExistingLimits();
  }

  attachEventListeners() {
    const addBtn = this.container.querySelector('#add-limit-btn');
    const saveBtn = this.container.querySelector('#save-limit-btn');
    const cancelBtn = this.container.querySelector('#cancel-limit-btn');
    const dailyInput = this.container.querySelector('#daily-limit');
    const weeklyInput = this.container.querySelector('#weekly-limit');

    addBtn.addEventListener('click', () => this.showLimitForm());
    saveBtn.addEventListener('click', () => this.handleSaveLimit());
    cancelBtn.addEventListener('click', () => this.hideLimitForm());

    // Validate weekly limit is greater than daily
    dailyInput.addEventListener('change', () => this.validateLimits());
    weeklyInput.addEventListener('change', () => this.validateLimits());
  }

  async loadExistingLimits() {
    const limits = await this.limitManager.getAllLimits();
    const listContainer = this.container.querySelector('#limit-list');
    listContainer.innerHTML = '';

    Object.entries(limits).forEach(([domain, config]) => {
      const limitCard = this.createLimitCard(domain, config);
      listContainer.appendChild(limitCard);
    });
  }

  createLimitCard(domain, config) {
    const card = document.createElement('div');
    card.className = 'limit-card';
    card.innerHTML = `
      <div class="limit-card-header">
        <h4>${domain}</h4>
        <label class="switch">
          <input type="checkbox" ${config.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="limit-card-body">
        <p>Daily: ${config.dailyLimit} minutes</p>
        <p>Weekly: ${config.weeklyLimit} minutes</p>
      </div>
      <div class="limit-card-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // Attach card event listeners
    const toggle = card.querySelector('input[type="checkbox"]');
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    toggle.addEventListener('change', () => this.handleToggleLimit(domain, toggle.checked));
    editBtn.addEventListener('click', () => this.handleEditLimit(domain));
    deleteBtn.addEventListener('click', () => this.handleDeleteLimit(domain));

    return card;
  }

  async handleToggleLimit(domain, enabled) {
    await this.limitManager.updateLimit(domain, { enabled });
    await this.loadExistingLimits(); // Refresh the list
  }

  async handleEditLimit(domain) {
    const limit = await this.limitManager.getLimit(domain);
    if (limit) {
      this.currentDomain = domain;
      this.showLimitForm(limit);
    }
  }

  async handleDeleteLimit(domain) {
    if (confirm(`Are you sure you want to delete the limit for ${domain}?`)) {
      await this.limitManager.removeLimit(domain);
      await this.loadExistingLimits();
    }
  }

  async handleSaveLimit() {
    const domainInput = this.container.querySelector('#domain-input');
    const dailyInput = this.container.querySelector('#daily-limit');
    const weeklyInput = this.container.querySelector('#weekly-limit');
    const enabledInput = this.container.querySelector('#limit-enabled');

    const domain = domainInput.value.trim();
    const config = {
      dailyLimit: parseInt(dailyInput.value, 10),
      weeklyLimit: parseInt(weeklyInput.value, 10),
      enabled: enabledInput.checked
    };

    if (!this.validateForm(domain, config)) {
      return;
    }

    const success = this.currentDomain ?
      await this.limitManager.updateLimit(this.currentDomain, config) :
      await this.limitManager.setLimit(domain, config);

    if (success) {
      this.hideLimitForm();
      await this.loadExistingLimits();
    } else {
      alert('Failed to save limit settings. Please try again.');
    }
  }

  validateForm(domain, config) {
    if (!domain) {
      alert('Please enter a domain name');
      return false;
    }

    if (isNaN(config.dailyLimit) || config.dailyLimit < 0) {
      alert('Please enter a valid daily limit');
      return false;
    }

    if (isNaN(config.weeklyLimit) || config.weeklyLimit < 0) {
      alert('Please enter a valid weekly limit');
      return false;
    }

    if (config.weeklyLimit < config.dailyLimit) {
      alert('Weekly limit must be greater than or equal to daily limit');
      return false;
    }

    return true;
  }

  validateLimits() {
    const dailyInput = this.container.querySelector('#daily-limit');
    const weeklyInput = this.container.querySelector('#weekly-limit');
    const saveBtn = this.container.querySelector('#save-limit-btn');

    const daily = parseInt(dailyInput.value, 10);
    const weekly = parseInt(weeklyInput.value, 10);

    if (!isNaN(daily) && !isNaN(weekly) && weekly < daily) {
      weeklyInput.setCustomValidity('Weekly limit must be greater than or equal to daily limit');
      saveBtn.disabled = true;
    } else {
      weeklyInput.setCustomValidity('');
      saveBtn.disabled = false;
    }
  }

  showLimitForm(existingLimit = null) {
    const form = this.container.querySelector('#limit-form');
    const domainInput = this.container.querySelector('#domain-input');
    const dailyInput = this.container.querySelector('#daily-limit');
    const weeklyInput = this.container.querySelector('#weekly-limit');
    const enabledInput = this.container.querySelector('#limit-enabled');

    if (existingLimit) {
      domainInput.value = this.currentDomain;
      domainInput.disabled = true;
      dailyInput.value = existingLimit.dailyLimit;
      weeklyInput.value = existingLimit.weeklyLimit;
      enabledInput.checked = existingLimit.enabled;
    } else {
      this.currentDomain = '';
      form.reset();
      domainInput.disabled = false;
    }

    form.classList.remove('hidden');
  }

  hideLimitForm() {
    const form = this.container.querySelector('#limit-form');
    form.classList.add('hidden');
    form.reset();
    this.currentDomain = '';
  }

  getContainer() {
    return this.container;
  }
}

export default LimitSettingsPanel;
