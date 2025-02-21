import PopupManager from '../src/popup/popup';

describe('PopupManager', () => {
  let popupManager;
  let mockChrome;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="nav-tabs"></div>
      <div id="dashboard-container" class="tab-container">
        <div id="current-site-info"></div>
      </div>
      <div id="limits-container" class="tab-container hidden"></div>
      <div id="settings-container" class="tab-container hidden"></div>
    `;

    mockChrome = {
      tabs: {
        query: jest.fn().mockResolvedValue([
          {
            url: 'https://example.com'
          }
        ])
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() }
      }
    };

    global.chrome = mockChrome;
    popupManager = new PopupManager();
  });

  describe('initialization', () => {
    it('should set up navigation tabs', () => {
      const navTabs = document.querySelectorAll('.nav-tab');
      expect(navTabs.length).toBe(3);
      expect(navTabs[0].textContent).toBe('Dashboard');
      expect(navTabs[1].textContent).toBe('Time Limits');
      expect(navTabs[2].textContent).toBe('Settings');
    });

    it('should initialize components', () => {
      expect(popupManager.limitSettingsPanel).toBeDefined();
      expect(popupManager.timeRemainingDisplay).toBeDefined();
    });

    it('should show dashboard by default', () => {
      const dashboard = document.querySelector('#dashboard-container');
      const limits = document.querySelector('#limits-container');
      const settings = document.querySelector('#settings-container');

      expect(dashboard.classList.contains('hidden')).toBeFalsy();
      expect(limits.classList.contains('hidden')).toBeTruthy();
      expect(settings.classList.contains('hidden')).toBeTruthy();
    });
  });

  describe('tab switching', () => {
    it('should switch tabs correctly', () => {
      popupManager.switchTab('limits');

      const dashboard = document.querySelector('#dashboard-container');
      const limits = document.querySelector('#limits-container');

      expect(dashboard.classList.contains('hidden')).toBeTruthy();
      expect(limits.classList.contains('hidden')).toBeFalsy();
    });

    it('should update active tab styling', () => {
      const limitsTab = document.querySelector('[data-tab="limits"]');
      limitsTab.click();

      expect(limitsTab.classList.contains('active')).toBeTruthy();
      expect(
        document
          .querySelector('[data-tab="dashboard"]')
          .classList.contains('active')
      ).toBeFalsy();
    });
  });

  describe('current site info', () => {
    it('should update current site information', async () => {
      await popupManager.loadCurrentTabInfo();
      const siteInfo = document.querySelector('#current-site-info');

      expect(siteInfo.textContent).toContain('example.com');
      expect(siteInfo.querySelector('#quick-limit-btn')).toBeTruthy();
    });

    it('should handle quick limit button clicks', async () => {
      await popupManager.loadCurrentTabInfo();
      const quickLimitBtn = document.querySelector('#quick-limit-btn');

      quickLimitBtn.click();

      expect(
        document.querySelector('#limits-container').classList.contains('hidden')
      ).toBeFalsy();
      const domainInput = document.querySelector('#domain-input');
      expect(domainInput.value).toBe('example.com');
    });
  });

  describe('message handling', () => {
    it('should refresh display on limit updates', () => {
      const refreshSpy = jest.spyOn(popupManager, 'refreshTimeDisplay');

      // Simulate limit update message
      chrome.runtime.onMessage.addListener.mock.calls[0][0]({
        action: 'limitUpdated'
      });

      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});
