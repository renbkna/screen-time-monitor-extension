import { createChromeMock } from './mocks/chrome.mock';

global.chrome = createChromeMock();

// Setup DOM environment for popup tests
document.body.innerHTML = `
  <div id="app">
    <div id="stats-container"></div>
    <div id="settings-container"></div>
    <button id="focus-mode-toggle"></button>
    <div class="controls"></div>
  </div>
`;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = createChromeMock();
});