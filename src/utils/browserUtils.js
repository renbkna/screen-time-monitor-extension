/**
 * Utility functions for browser operations
 */

/**
 * Gets the currently active tab
 * @returns {Promise<chrome.tabs.Tab>} The current tab
 */
export async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    return tab;
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

/**
 * Extracts the domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain name
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}
