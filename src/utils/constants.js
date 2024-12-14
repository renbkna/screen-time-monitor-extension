/**
 * Application-wide constants
 */

// Category definitions for site classification
export const SITE_CATEGORIES = {
  'Social Media': [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'tiktok.com',
    'pinterest.com',
    'reddit.com',
    'tumblr.com',
    'snapchat.com',
    'whatsapp.com'
  ],
  'Productivity': [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'notion.so',
    'trello.com',
    'asana.com',
    'slack.com',
    'zoom.us',
    'docs.google.com',
    'drive.google.com',
    'office.com',
    'microsoft365.com',
    'clickup.com',
    'monday.com',
    'basecamp.com'
  ],
  'Entertainment': [
    'youtube.com',
    'netflix.com',
    'twitch.tv',
    'spotify.com',
    'hulu.com',
    'disneyplus.com',
    'primevideo.com',
    'vimeo.com',
    'soundcloud.com',
    'dailymotion.com',
    'hbomax.com',
    'crunchyroll.com',
    'pandora.com'
  ],
  'News & Information': [
    'news.google.com',
    'reuters.com',
    'bloomberg.com',
    'nytimes.com',
    'wsj.com',
    'bbc.com',
    'cnn.com',
    'theguardian.com',
    'washingtonpost.com',
    'apnews.com',
    'reuters.com',
    'aljazeera.com'
  ],
  'Shopping': [
    'amazon.com',
    'ebay.com',
    'etsy.com',
    'walmart.com',
    'target.com',
    'bestbuy.com',
    'aliexpress.com',
    'shopify.com',
    'wayfair.com',
    'homedepot.com',
    'costco.com',
    'newegg.com'
  ],
  'Education': [
    'coursera.org',
    'udemy.com',
    'edx.org',
    'khanacademy.org',
    'duolingo.com',
    'quizlet.com',
    'stackoverflow.com',
    'w3schools.com',
    'developer.mozilla.org',
    'codecademy.com',
    'freecodecamp.org',
    'brilliant.org',
    'udacity.com'
  ],
  'Reference': [
    'wikipedia.org',
    'medium.com',
    'quora.com',
    'stackexchange.com',
    'wikihow.com',
    'britannica.com',
    'dictionary.com',
    'thesaurus.com',
    'merriam-webster.com'
  ]
};

// Chart colors for consistent visualization
export const CHART_COLORS = {
  primary: '#3B82F6',    // Blue
  secondary: '#10B981',  // Green
  warning: '#F59E0B',    // Yellow
  danger: '#EF4444',     // Red
  info: '#6366F1',       // Indigo
  accent: '#EC4899',     // Pink
  neutral: '#6B7280',    // Gray
  purple: '#8B5CF6',     // Purple
  teal: '#14B8A6',       // Teal
  orange: '#F97316'      // Orange
};

// Category color mapping
export const CATEGORY_COLORS = {
  'Social Media': CHART_COLORS.primary,
  'Productivity': CHART_COLORS.secondary,
  'Entertainment': CHART_COLORS.warning,
  'News & Information': CHART_COLORS.info,
  'Shopping': CHART_COLORS.accent,
  'Education': CHART_COLORS.teal,
  'Reference': CHART_COLORS.purple,
  'Other': CHART_COLORS.neutral
};

// Time intervals for statistics
export const TIME_INTERVALS = {
  HOURLY: 60 * 60 * 1000,        // 1 hour in milliseconds
  DAILY: 24 * 60 * 60 * 1000,    // 1 day in milliseconds
  WEEKLY: 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
};

// Default chart options
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 4,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
};

// Data storage keys
export const STORAGE_KEYS = {
  DAILY_STATS: 'dailyStats',
  WEEKLY_STATS: 'weeklyStats',
  SETTINGS: 'settings',
  CATEGORIES: 'categories',
  FOCUS_MODE: 'focusMode'
};

// Maximum data retention periods
export const DATA_RETENTION = {
  DAILY: 30,  // Keep daily stats for 30 days
  WEEKLY: 12  // Keep weekly stats for 12 weeks
};
