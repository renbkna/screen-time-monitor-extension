// Mock Chrome APIs
const chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    onActivated: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    }
  },
  webNavigation: {
    onCompleted: {
      addListener: jest.fn()
    }
  },
  idle: {
    onStateChanged: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn()
  }
};

global.chrome = chrome;