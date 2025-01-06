/**
 * Browser utility functions
 */

/**
 * Get information about the currently active tab
 * @returns {Promise<chrome.tabs.Tab>} Current tab information
 */
export async function getCurrentTabInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    } catch (error) {
        console.error('Error getting current tab:', error);
        throw new Error('Could not get current tab information');
    }
}

/**
 * Extract domain from a URL
 * @param {string} url - URL to process
 * @returns {string} Domain name
 */
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        console.error('Error extracting domain:', error);
        return url;
    }
}

/**
 * Check if a URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if a URL is trackable (not a browser internal page)
 * @param {string} url - URL to check
 * @returns {boolean} True if URL should be tracked
 */
export function isTrackableUrl(url) {
    if (!isValidUrl(url)) return false;

    const untrackableProtocols = ['chrome:', 'chrome-extension:', 'about:', 'data:'];
    try {
        const urlObj = new URL(url);
        return !untrackableProtocols.some(protocol => urlObj.protocol === protocol);
    } catch {
        return false;
    }
}

/**
 * Get all open tabs in the current window
 * @returns {Promise<chrome.tabs.Tab[]>} Array of tabs
 */
export async function getAllTabs() {
    try {
        return await chrome.tabs.query({ currentWindow: true });
    } catch (error) {
        console.error('Error getting tabs:', error);
        throw new Error('Could not get tabs information');
    }
}

/**
 * Get favicon URL for a given tab
 * @param {chrome.tabs.Tab} tab - Tab object
 * @returns {string} Favicon URL
 */
export function getFaviconUrl(tab) {
    if (tab.favIconUrl) return tab.favIconUrl;
    
    try {
        const domain = extractDomain(tab.url);
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
        return 'assets/icons/default-favicon.png';
    }
}

/**
 * Check if the browser is in idle state
 * @returns {Promise<boolean>} True if browser is idle
 */
export async function isBrowserIdle() {
    try {
        const state = await chrome.idle.queryState(60); // Check for 1 minute of inactivity
        return state === 'idle' || state === 'locked';
    } catch (error) {
        console.error('Error checking idle state:', error);
        return false;
    }
}

/**
 * Create or update a browser notification
 * @param {string} id - Notification ID
 * @param {Object} options - Notification options
 */
export async function createNotification(id, options) {
    try {
        await chrome.notifications.create(id, {
            type: 'basic',
            iconUrl: 'assets/icons/icon128.png',
            ...options
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

/**
 * Focus a specific tab
 * @param {number} tabId - Tab ID to focus
 */
export async function focusTab(tabId) {
    try {
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update((await chrome.tabs.get(tabId)).windowId, { focused: true });
    } catch (error) {
        console.error('Error focusing tab:', error);
    }
}

/**
 * Check if extension has required permissions
 * @param {chrome.permissions.Permissions} permissions - Required permissions
 * @returns {Promise<boolean>} True if all permissions are granted
 */
export async function hasPermissions(permissions) {
    try {
        return await chrome.permissions.contains(permissions);
    } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
    }
}
