document.addEventListener('DOMContentLoaded', () => {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const domain = params.get('domain');
  const limitType = params.get('type');

  // Update message with specific information
  const messageElement = document.getElementById('message');
  if (domain && limitType) {
    messageElement.textContent = 
      `You've reached your ${limitType} time limit for ${domain}.`;
  }

  // Handle settings button click
  const settingsButton = document.getElementById('openSettings');
  settingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
});
