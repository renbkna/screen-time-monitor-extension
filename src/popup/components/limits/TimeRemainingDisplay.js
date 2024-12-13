/**
 * Component for displaying remaining time information
 */
class TimeRemainingDisplay {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'time-remaining-display';
    this.initializeDisplay();
  }

  initializeDisplay() {
    this.container.innerHTML = `
      <div class="time-remaining-header">
        <h3>Time Remaining</h3>
        <span class="refresh-btn">↻</span>
      </div>
      <div class="time-bars">
        <div class="time-bar daily">
          <div class="bar-label">
            <span>Daily Limit</span>
            <span class="time-value">--:--</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
        <div class="time-bar weekly">
          <div class="bar-label">
            <span>Weekly Limit</span>
            <span class="time-value">--:--</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    // Add refresh button functionality
    const refreshBtn = this.container.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', () => this.refreshDisplay());
  }

  /**
   * Updates the display with current time information
   * @param {Object} timeInfo - Time remaining information
   * @param {Object} timeInfo.daily - Daily time information
   * @param {Object} timeInfo.weekly - Weekly time information
   */
  updateDisplay(timeInfo) {
    if (!timeInfo) return;

    const { daily, weekly } = timeInfo;

    // Update daily time bar
    if (daily) {
      const dailyBar = this.container.querySelector('.daily');
      const dailyValue = dailyBar.querySelector('.time-value');
      const dailyFill = dailyBar.querySelector('.progress-fill');

      dailyValue.textContent = this.formatTime(daily.remaining);
      dailyFill.style.width = `${this.calculatePercentage(daily.used, daily.limit)}%`;
      this.updateBarColor(dailyFill, daily.remaining);
    }

    // Update weekly time bar
    if (weekly) {
      const weeklyBar = this.container.querySelector('.weekly');
      const weeklyValue = weeklyBar.querySelector('.time-value');
      const weeklyFill = weeklyBar.querySelector('.progress-fill');

      weeklyValue.textContent = this.formatTime(weekly.remaining);
      weeklyFill.style.width = `${this.calculatePercentage(weekly.used, weekly.limit)}%`;
      this.updateBarColor(weeklyFill, weekly.remaining);
    }
  }

  /**
   * Formats time in minutes to HH:MM format
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time string
   */
  formatTime(minutes) {
    if (minutes === undefined || minutes === null) return '--:--';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Calculates percentage for progress bar
   * @param {number} used - Time used
   * @param {number} limit - Time limit
   * @returns {number} Percentage value
   */
  calculatePercentage(used, limit) {
    if (!used || !limit) return 0;
    return Math.min((used / limit) * 100, 100);
  }

  /**
   * Updates progress bar color based on remaining time
   * @param {HTMLElement} fillElement - Progress bar fill element
   * @param {number} remaining - Remaining time in minutes
   */
  updateBarColor(fillElement, remaining) {
    if (remaining <= 5) {
      fillElement.style.backgroundColor = '#e53935'; // Red
    } else if (remaining <= 15) {
      fillElement.style.backgroundColor = '#ff9800'; // Orange
    } else {
      fillElement.style.backgroundColor = '#4caf50'; // Green
    }
  }

  /**
   * Refreshes the time display
   */
  async refreshDisplay() {
    try {
      const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab[0] && currentTab[0].url) {
        const domain = new URL(currentTab[0].url).hostname;
        // Send message to background script to get updated time info
        chrome.runtime.sendMessage(
          { action: 'getTimeRemaining', domain },
          timeInfo => this.updateDisplay(timeInfo)
        );
      }
    } catch (error) {
      console.error('Error refreshing time display:', error);
    }
  }

  getContainer() {
    return this.container;
  }
}

export default TimeRemainingDisplay;