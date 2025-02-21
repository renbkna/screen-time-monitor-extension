export const createChromeMock = () => ({
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
});
