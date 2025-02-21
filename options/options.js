// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded'); // Debug log
  setupTabNavigation();
  await loadSettings();
  setupEventListeners();
});

// Get domain from URL (moved from utils.js)
function getDomainFromUrl(url) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    console.error('Error parsing URL:', error);
    return url.toLowerCase().replace(/^www\./, '');
  }
}

// Set up tab navigation
function setupTabNavigation() {
  console.log('Setting up tab navigation'); // Debug log
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabs = document.querySelectorAll('.settings-tab');

  tabButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      console.log('Tab clicked:', button.dataset.tab); // Debug log
      // Remove active class from all buttons and hide all tabs
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabs.forEach((tab) => tab.classList.add('hidden'));

      // Add active class to clicked button and show corresponding tab
      button.classList.add('active');
      const tabName = button.getAttribute('data-tab');
      const tabElement = document.getElementById(tabName);
      if (tabElement) {
        tabElement.classList.remove('hidden');
      }
    });
  });
}

// Load saved settings
async function loadSettings() {
  try {
    console.log('Loading settings'); // Debug log
    const data = await chrome.storage.local.get([
      'settings',
      'dailyLimits',
      'categories'
    ]);

    if (data.settings) {
      // Load general settings
      document.getElementById('timeFormat').value =
        data.settings.timeFormat || '24-hour';
      document.getElementById('weekStart').value =
        data.settings.weekStart || 'Monday';
      document.getElementById('dailyGoal').value = data.settings.dailyGoal || 8;

      // Load notification settings
      document.getElementById('enableNotifications').checked =
        data.settings.notificationsEnabled || false;
      document.getElementById('breakReminders').checked =
        data.settings.breakReminders?.enabled || false;
      document.getElementById('breakInterval').value =
        data.settings.breakReminders?.interval || 60;
    }

    // Load time limits using the correct key
    if (data.dailyLimits) {
      const limitsList = document.getElementById('limitsList');
      limitsList.innerHTML = '';
      Object.entries(data.dailyLimits).forEach(([domain, minutes]) => {
        limitsList.appendChild(createLimitItem(domain, minutes));
      });
    }

    // Load categories
    if (data.categories) {
      const categoriesList = document.getElementById('categoriesList');
      categoriesList.innerHTML = '';
      Object.entries(data.categories).forEach(([key, category]) => {
        categoriesList.appendChild(createCategoryItem(key, category));
      });
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showToast('Failed to load settings', true);
  }
}

// Normalize domain
function normalizeDomain(domain) {
  try {
    return domain.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    console.error('Error normalizing domain:', error);
    return domain.toLowerCase().replace(/^www\./, '');
  }
}

// Create time limit item
function createLimitItem(domain = '', minutes = 60) {
  const item = document.createElement('div');
  item.className = 'limit-item';

  item.innerHTML = `
        <input type="text" class="form-input domain-input" value="${domain}" 
               placeholder="Domain (e.g., youtube.com)" style="width: 70%">
        <input type="number" class="form-input minutes-input" value="${minutes}" 
               min="1" max="1440" style="width: 20%">
        <button class="btn-danger remove-limit">Remove</button>
    `;

  // Add domain normalization on blur
  const domainInput = item.querySelector('.domain-input');
  domainInput.addEventListener('blur', () => {
    const normalized = normalizeDomain(domainInput.value.trim());
    if (normalized) {
      domainInput.value = normalized;
    }
  });

  item
    .querySelector('.remove-limit')
    .addEventListener('click', () => item.remove());
  return item;
}

// Create category item
function createCategoryItem(
  key = '',
  category = { name: '', color: '#3B82F6' }
) {
  const item = document.createElement('div');
  item.className = 'category-item';

  item.innerHTML = `
        <input type="text" class="form-input category-key" value="${key}" 
               placeholder="Category key" style="width: 30%">
        <input type="text" class="form-input category-name" value="${category.name}" 
               placeholder="Display name" style="width: 40%">
        <input type="color" class="color-picker" value="${category.color}">
        <button class="btn-danger remove-category">Remove</button>
    `;

  item
    .querySelector('.remove-category')
    .addEventListener('click', () => item.remove());
  return item;
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners'); // Debug log
  // Add new limit
  const addLimitButton = document.getElementById('addLimit');
  if (addLimitButton) {
    addLimitButton.addEventListener('click', () => {
      console.log('Add limit clicked'); // Debug log
      const limitsList = document.getElementById('limitsList');
      limitsList.appendChild(createLimitItem());
    });
  }

  // Add new category
  const addCategoryButton = document.getElementById('addCategory');
  if (addCategoryButton) {
    addCategoryButton.addEventListener('click', () => {
      console.log('Add category clicked'); // Debug log
      const categoriesList = document.getElementById('categoriesList');
      categoriesList.appendChild(createCategoryItem());
    });
  }

  // Save settings
  const saveButton = document.getElementById('saveSettings');
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }
}

// Save all settings
async function saveSettings() {
  try {
    console.log('Saving settings'); // Debug log
    const settings = {
      timeFormat: document.getElementById('timeFormat').value,
      weekStart: document.getElementById('weekStart').value,
      dailyGoal: parseInt(document.getElementById('dailyGoal').value),
      notificationsEnabled: document.getElementById('enableNotifications')
        .checked,
      breakReminders: {
        enabled: document.getElementById('breakReminders').checked,
        interval: parseInt(document.getElementById('breakInterval').value)
      }
    };

    // Collect time limits with proper normalization
    const limits = {};
    document.querySelectorAll('.limit-item').forEach((item) => {
      const domainInput = item.querySelector('.domain-input').value.trim();
      const minutes = parseInt(item.querySelector('.minutes-input').value);

      // Normalize domain without adding protocol
      const domain = domainInput.toLowerCase().replace(/^www\./, '');

      if (domain && minutes) {
        limits[domain] = minutes;
      }
    });

    // Collect categories
    const categories = {};
    document.querySelectorAll('.category-item').forEach((item) => {
      const key = item.querySelector('.category-key').value.trim();
      const name = item.querySelector('.category-name').value.trim();
      const color = item.querySelector('.color-picker').value;

      if (key && name) {
        categories[key] = { name, color };
      }
    });

    // Save all settings at once
    await chrome.storage.local.set({
      settings: settings,
      dailyLimits: limits,
      categories: categories
    });

    // Notify background script that settings were updated
    await chrome.runtime.sendMessage({ action: 'settingsUpdated' });

    console.log('Settings saved successfully');
    showToast('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Failed to save settings', true);
  }
}

function showToast(message, isError = false) {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Force a reflow to trigger animation
  toast.offsetHeight;

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
