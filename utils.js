// Constants for storage keys
export const WEBSITE_DATA_KEY = 'websiteData';
export const DAILY_LIMITS_KEY = 'dailyLimits';
export const CATEGORIES_KEY = 'categories';
export const SETTINGS_KEY = 'settings';
export const NOTIFICATION_STATE_KEY = 'notificationSent';

// Website categories with color codes and keywords for automatic categorization
export const DEFAULT_CATEGORIES = {
  work: {
    name: 'Work',
    color: '#4F46E5',
    keywords: [
      'docs.google',
      'notion',
      'slack',
      'microsoft',
      'office',
      'linkedin',
      'github',
      'gitlab',
      'atlassian'
    ]
  },
  social: {
    name: 'Social Media',
    color: '#EC4899',
    keywords: [
      'facebook',
      'twitter',
      'instagram',
      'reddit',
      'tiktok',
      'snapchat',
      'whatsapp',
      'telegram',
      'discord'
    ]
  },
  entertainment: {
    name: 'Entertainment',
    color: '#F59E0B',
    keywords: [
      'youtube',
      'netflix',
      'twitch',
      'spotify',
      'disney',
      'hulu',
      'prime.video',
      'vimeo',
      'tiktok'
    ]
  },
  productivity: {
    name: 'Productivity',
    color: '#10B981',
    keywords: [
      'gmail',
      'outlook',
      'trello',
      'asana',
      'notion',
      'evernote',
      'calendar',
      'drive.google'
    ]
  },
  education: {
    name: 'Education',
    color: '#6366F1',
    keywords: [
      'coursera',
      'udemy',
      'edx',
      'khan',
      'academy',
      'educational',
      'university',
      'school',
      'learning',
      'study'
    ]
  },
  shopping: {
    name: 'Shopping',
    color: '#8B5CF6',
    keywords: [
      'amazon',
      'ebay',
      'etsy',
      'walmart',
      'shopping',
      'store',
      'shop',
      'buy',
      'cart'
    ]
  },
  uncategorized: {
    name: 'Uncategorized',
    color: '#6B7280'
  }
};

// Get domain from URL with improved normalization
export function getDomainFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    // Get the hostname and remove 'www.' prefix
    let hostname = parsedUrl.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// Get today's date key in YYYY-MM-DD format
export function getTodayKey() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Format milliseconds to readable time
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

// Guess the category of a domain based on keywords and common domains
export function guessDomainCategory(domain) {
  if (!domain) return 'other';

  // Common domain mappings
  const domainCategories = {
    'youtube.com': 'entertainment',
    'netflix.com': 'entertainment',
    'twitch.tv': 'entertainment',
    'spotify.com': 'entertainment',
    'facebook.com': 'social',
    'instagram.com': 'social',
    'twitter.com': 'social',
    'x.com': 'social',
    'linkedin.com': 'social',
    'github.com': 'work',
    'stackoverflow.com': 'work',
    'gitlab.com': 'work',
    'bitbucket.org': 'work',
    'google.com': 'productivity',
    'gmail.com': 'productivity',
    'docs.google.com': 'productivity',
    'drive.google.com': 'productivity',
    'calendar.google.com': 'productivity',
    'meet.google.com': 'productivity',
    'zoom.us': 'productivity',
    'coursera.org': 'education',
    'udemy.com': 'education',
    'edx.org': 'education',
    'amazon.com': 'shopping',
    'ebay.com': 'shopping',
    'walmart.com': 'shopping'
  };

  // Normalize the domain
  const normalizedDomain = domain.toLowerCase();

  // Direct domain match
  if (domainCategories[normalizedDomain]) {
    return domainCategories[normalizedDomain];
  }

  // Check for subdomain matches (e.g., mail.google.com should match google.com)
  for (const [key, category] of Object.entries(domainCategories)) {
    if (normalizedDomain === key || normalizedDomain.endsWith('.' + key)) {
      return category;
    }
  }

  // Keyword-based categorization
  const keywords = {
    entertainment: [
      'video',
      'movie',
      'music',
      'game',
      'play',
      'stream',
      'tv',
      'radio',
      'podcast',
      'entertainment'
    ],
    social: [
      'chat',
      'social',
      'community',
      'forum',
      'blog',
      'message',
      'connect',
      'friends'
    ],
    work: [
      'jira',
      'confluence',
      'slack',
      'teams',
      'office',
      'project',
      'work',
      'business',
      'enterprise'
    ],
    productivity: [
      'mail',
      'calendar',
      'task',
      'note',
      'doc',
      'sheet',
      'slide',
      'meet',
      'productivity'
    ],
    education: [
      'learn',
      'course',
      'study',
      'edu',
      'school',
      'university',
      'college',
      'academy',
      'education'
    ],
    shopping: [
      'shop',
      'store',
      'buy',
      'cart',
      'checkout',
      'market',
      'price',
      'shopping',
      'commerce'
    ]
  };

  const domainParts = normalizedDomain.split('.');
  for (const part of domainParts) {
    for (const [category, categoryKeywords] of Object.entries(keywords)) {
      if (categoryKeywords.some((keyword) => part.includes(keyword))) {
        return category;
      }
    }
  }

  // Default to 'other' if no match found
  return 'other';
}

// Update time spent for a domain with improved category handling
export async function updateTimeSpent(domain, timeSpent) {
  try {
    const websiteData = await getWebsiteData();
    const todayKey = getTodayKey();

    // Initialize today's data if needed
    if (!websiteData[todayKey]) {
      websiteData[todayKey] = {};
    }

    // Initialize domain data if needed
    if (!websiteData[todayKey][domain]) {
      const category = guessDomainCategory(domain);
      websiteData[todayKey][domain] = {
        timeSpent: 0,
        category: category
      };
    }

    // Update time spent
    websiteData[todayKey][domain].timeSpent += timeSpent;

    // Save updated data
    await setWebsiteData(websiteData);
    return websiteData[todayKey][domain];
  } catch (error) {
    console.error('Error updating time spent:', error);
    return null;
  }
}

// Show a notification with improved visibility
export function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Get website data from storage with error handling
export async function getWebsiteData() {
  try {
    const data = await chrome.storage.local.get([WEBSITE_DATA_KEY]);
    return data[WEBSITE_DATA_KEY] || {};
  } catch (error) {
    console.error('Error getting website data:', error);
    return {};
  }
}

// Set website data in storage with validation
export async function setWebsiteData(websiteData) {
  try {
    if (!websiteData || typeof websiteData !== 'object') {
      throw new Error('Invalid website data format');
    }
    await chrome.storage.local.set({ [WEBSITE_DATA_KEY]: websiteData });
    console.log('Website data saved successfully');
  } catch (error) {
    console.error('Error setting website data:', error);
    throw error;
  }
}

// Get categories from storage with default fallback
export async function getCategories() {
  try {
    const data = await chrome.storage.local.get([CATEGORIES_KEY]);
    return data[CATEGORIES_KEY] || DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error getting categories:', error);
    return DEFAULT_CATEGORIES;
  }
}

// Set categories in storage with validation
export async function setCategories(categories) {
  try {
    if (!categories || typeof categories !== 'object') {
      throw new Error('Invalid categories format');
    }
    await chrome.storage.local.set({ [CATEGORIES_KEY]: categories });
    console.log('Categories saved successfully');
  } catch (error) {
    console.error('Error setting categories:', error);
    throw error;
  }
}

// Get daily limits from storage with domain normalization
export async function getDailyLimits() {
  try {
    const data = await chrome.storage.local.get([DAILY_LIMITS_KEY]);
    const limits = data[DAILY_LIMITS_KEY] || {};

    // Normalize stored limits
    const normalizedLimits = {};
    for (const [domain, limit] of Object.entries(limits)) {
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      normalizedLimits[normalizedDomain] = limit;
    }

    return normalizedLimits;
  } catch (error) {
    console.error('Error getting daily limits:', error);
    return {};
  }
}

// Set daily limits in storage with validation
export async function setDailyLimits(dailyLimits) {
  try {
    if (!dailyLimits || typeof dailyLimits !== 'object') {
      throw new Error('Invalid daily limits format');
    }

    // Normalize all domains in the limits
    const normalizedLimits = {};
    for (const [domain, limit] of Object.entries(dailyLimits)) {
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      normalizedLimits[normalizedDomain] = limit;
    }

    await chrome.storage.local.set({ [DAILY_LIMITS_KEY]: normalizedLimits });
    console.log('Updated time limits:', normalizedLimits);
  } catch (error) {
    console.error('Error setting daily limits:', error);
    throw error;
  }
}

// Track whether the 90% notification has been sent for each domain
let notificationSent = {};

// Load notification state from storage
async function loadNotificationState() {
  try {
    const data = await chrome.storage.local.get([NOTIFICATION_STATE_KEY]);
    notificationSent = data[NOTIFICATION_STATE_KEY] || {};
  } catch (error) {
    console.error('Error loading notification state:', error);
  }
}

// Save notification state to storage
async function saveNotificationState() {
  try {
    await chrome.storage.local.set({
      [NOTIFICATION_STATE_KEY]: notificationSent
    });
  } catch (error) {
    console.error('Error saving notification state:', error);
  }
}

// Check if time limit is exceeded for a domain
export async function checkLimits(domain) {
  try {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    const todayKey = getTodayKey();
    const dailyLimits = await getDailyLimits();
    const websiteData = await getWebsiteData();

    const timeSpent = websiteData[todayKey]?.[normalizedDomain]?.timeSpent || 0;
    const limit = dailyLimits[normalizedDomain];

    if (limit) {
      const limitMs = limit * 60 * 1000; // Convert minutes to ms
      console.log(
        `Checking limit for ${normalizedDomain}: ${timeSpent}ms spent of ${limitMs}ms limit`
      );

      if (timeSpent >= limitMs) {
        showNotification(
          'Time Limit Exceeded',
          `You've reached your daily limit for ${domain}.`
        );
        return true;
      } else if (timeSpent >= limitMs * 0.9) {
        // Only send the 90% notification if it hasn't been sent yet
        if (!notificationSent[normalizedDomain]) {
          showNotification(
            'Time Limit Warning',
            `You've used 90% of your daily limit for ${domain}.`
          );
          notificationSent[normalizedDomain] = true; // Mark as sent
          await saveNotificationState(); // Save the state
        }
      } else {
        // Reset the flag if time spent is below 90%
        notificationSent[normalizedDomain] = false;
        await saveNotificationState(); // Save the state
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking limits:', error);
    return false;
  }
}

// Load notification state when the script starts
loadNotificationState();

// Initialize website data in storage
export async function initializeWebsiteData() {
  try {
    const websiteData = await getWebsiteData();
    const categories = await getCategories();
    const settings = await getSettings();

    let needsUpdate = false;

    if (Object.keys(websiteData).length === 0) {
      await setWebsiteData({});
      needsUpdate = true;
    }

    if (Object.keys(categories).length === 0) {
      await setCategories(DEFAULT_CATEGORIES);
      needsUpdate = true;
    }

    if (Object.keys(settings).length === 0) {
      await setSettings(getDefaultSettings());
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('Initialized extension data');
    }
  } catch (error) {
    console.error('Error initializing website data:', error);
    throw error;
  }
}

// Get default settings
function getDefaultSettings() {
  const darkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    notificationsEnabled: true,
    darkMode: darkMode,
    autoCategorizeDomains: true,
    showProductivityScore: true,
    timeFormat: '24h',
    weekStartsOn: 'monday',
    dailyGoal: 8 * 60, // 8 hours in minutes
    breakReminders: {
      enabled: true,
      interval: 60, // minutes
      minTimeForReminder: 30 // minutes
    }
  };
}

// Get settings from storage
export async function getSettings() {
  try {
    const data = await chrome.storage.local.get([SETTINGS_KEY]);
    return data[SETTINGS_KEY] || getDefaultSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    return getDefaultSettings();
  }
}

// Set settings in storage
export async function setSettings(settings) {
  try {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings format');
    }
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error setting settings:', error);
    throw error;
  }
}

export async function calculateProductivityScore() {
  try {
    const todayKey = getTodayKey();
    const websiteData = await getWebsiteData();
    const todayData = websiteData[todayKey] || {};

    // Category weights for productivity calculation
    const categoryWeights = {
      work: 1.0, // 100% productive
      education: 1.0, // 100% productive
      productivity: 0.8, // 80% productive
      uncategorized: 0.5, // 50% productive
      shopping: 0.3, // 30% productive
      social: 0.2, // 20% productive
      entertainment: 0.1 // 10% productive
    };

    let totalTime = 0;
    let productiveTime = 0;

    // Calculate total time and weighted productive time
    for (const [domain, data] of Object.entries(todayData)) {
      const timeInHours = data.timeSpent / (1000 * 60 * 60); // Convert ms to hours
      totalTime += timeInHours;

      const weight = categoryWeights[data.category] || 0.5; // Default to 0.5 if category not found
      productiveTime += timeInHours * weight;
    }

    // Calculate productivity score (0-100)
    const score =
      totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;

    // Store the score
    const settings = await getSettings();
    await setSettings({
      ...settings,
      productivityScore: score
    });

    console.log('Productivity score calculated:', score);
    return score;
  } catch (error) {
    console.error('Error calculating productivity score:', error);
    return 0;
  }
}
