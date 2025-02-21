export function setupDOMEnvironment() {
  document.body.innerHTML = `
    <div id="app">
      <div id="stats-container"></div>
      <div id="settings-container"></div>
      <button id="focus-mode-toggle"></button>
      <div class="controls"></div>
    </div>
  `;
}
