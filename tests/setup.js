// Mock Chrome APIs
const chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation(() => Promise.resolve({})),
      set: jest.fn().mockImplementation(() => Promise.resolve()),
      clear: jest.fn().mockImplementation(() => Promise.resolve()),
      remove: jest.fn().mockImplementation(() => Promise.resolve())
    },
    sync: {
      get: jest.fn().mockImplementation(() => Promise.resolve({})),
      set: jest.fn().mockImplementation(() => Promise.resolve()),
      clear: jest.fn().mockImplementation(() => Promise.resolve()),
      remove: jest.fn().mockImplementation(() => Promise.resolve())
    }
  },
  tabs: {
    query: jest.fn(),
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  webNavigation: {
    onCompleted: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  idle: {
    onStateChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    setDetectionInterval: jest.fn()
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn()
  }
};

// Add chrome to global scope
global.chrome = chrome;

// Mock document object for PopupManager tests
document.body.innerHTML = `
  <div id="app">
    <div id="stats-container"></div>
    <div id="settings-container"></div>
    <button id="focus-mode-toggle"></button>
  </div>
`;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  chrome.storage.local.get.mockClear();
  chrome.storage.local.set.mockClear();
  chrome.storage.local.clear.mockClear();
});
