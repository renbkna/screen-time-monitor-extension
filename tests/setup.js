import '@testing-library/jest-dom';
import { createChromeMock } from './mocks/chrome.mock';

// Set up global chrome mock
global.chrome = createChromeMock();

// Set up DOM environment for popup tests
document.body.innerHTML = `
  <div id="app">
    <div id="stats-container"></div>
    <div id="settings-container"></div>
    <button id="focus-mode-toggle"></button>
    <div class="controls"></div>
  </div>
`;

// Extend Jest with additional matchers
expect.extend({
  toBeValidDate: function(received) {
    const pass = received instanceof Date && !isNaN(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid date`
    };
  }
});

// Global test hooks
global.beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = createChromeMock();
});

global.afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});