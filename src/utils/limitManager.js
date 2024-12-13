/**
 * Manages screen time limits for websites
 */
class LimitManager {
  constructor() {
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      const data = await chrome.storage.local.get('limits');
      if (!data.limits) {
        await chrome.storage.local.set({ limits: {} });
      }
    } catch (error) {
      console.error('Error initializing limits storage:', error);
    }
  }

  /**
   * Sets a time limit for a specific domain
   * @param {string} domain - The domain to set limit for
   * @param {Object} limitConfig - The limit configuration
   * @param {number} limitConfig.dailyLimit - Daily limit in minutes
   * @param {number} limitConfig.weeklyLimit - Weekly limit in minutes
   * @param {boolean} limitConfig.enabled - Whether the limit is enabled
   * @returns {Promise<boolean>} - Success status
   */
  async setLimit(domain, limitConfig) {
    try {
      if (!this.validateLimitConfig(limitConfig)) {
        throw new Error('Invalid limit configuration');
      }

      const data = await chrome.storage.local.get('limits');
      const limits = data.limits || {};

      limits[domain] = {
        dailyLimit: limitConfig.dailyLimit,
        weeklyLimit: limitConfig.weeklyLimit,
        enabled: limitConfig.enabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await chrome.storage.local.set({ limits });
      return true;
    } catch (error) {
      console.error('Error setting limit:', error);
      return false;
    }
  }

  /**
   * Gets the limit configuration for a specific domain
   * @param {string} domain - The domain to get limit for
   * @returns {Promise<Object|null>} - The limit configuration
   */
  async getLimit(domain) {
    try {
      const data = await chrome.storage.local.get('limits');
      return data.limits?.[domain] || null;
    } catch (error) {
      console.error('Error getting limit:', error);
      return null;
    }
  }

  /**
   * Gets all configured limits
   * @returns {Promise<Object>} - All limit configurations
   */
  async getAllLimits() {
    try {
      const data = await chrome.storage.local.get('limits');
      return data.limits || {};
    } catch (error) {
      console.error('Error getting all limits:', error);
      return {};
    }
  }

  /**
   * Removes a limit for a specific domain
   * @param {string} domain - The domain to remove limit for
   * @returns {Promise<boolean>} - Success status
   */
  async removeLimit(domain) {
    try {
      const data = await chrome.storage.local.get('limits');
      const limits = data.limits || {};

      if (limits[domain]) {
        delete limits[domain];
        await chrome.storage.local.set({ limits });
      }
      
      return true;
    } catch (error) {
      console.error('Error removing limit:', error);
      return false;
    }
  }

  /**
   * Updates an existing limit configuration
   * @param {string} domain - The domain to update limit for
   * @param {Object} updates - The updates to apply
   * @returns {Promise<boolean>} - Success status
   */
  async updateLimit(domain, updates) {
    try {
      const currentLimit = await this.getLimit(domain);
      if (!currentLimit) {
        return false;
      }

      const updatedConfig = {
        ...currentLimit,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (!this.validateLimitConfig(updatedConfig)) {
        throw new Error('Invalid limit configuration');
      }

      return await this.setLimit(domain, updatedConfig);
    } catch (error) {
      console.error('Error updating limit:', error);
      return false;
    }
  }

  /**
   * Validates a limit configuration
   * @param {Object} config - The configuration to validate
   * @returns {boolean} - Whether the configuration is valid
   */
  validateLimitConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const { dailyLimit, weeklyLimit, enabled } = config;

    // Check if required properties exist and have correct types
    if (
      typeof dailyLimit !== 'number' ||
      typeof weeklyLimit !== 'number' ||
      typeof enabled !== 'boolean'
    ) {
      return false;
    }

    // Validate limit values
    if (
      dailyLimit < 0 ||
      weeklyLimit < 0 ||
      weeklyLimit < dailyLimit
    ) {
      return false;
    }

    return true;
  }
}

export default LimitManager;
