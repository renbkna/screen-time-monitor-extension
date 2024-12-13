// Get URL parameters
const params = new URLSearchParams(window.location.search);
const type = params.get('type');
const website = params.get('website');

// Update message
const message = document.getElementById('limit-message');
message.textContent = `You've reached your ${type} time limit for ${website}. Take a break and come back later!`;

// Handle button clicks
document.getElementById('close-tab').addEventListener('click', () => {
  window.close();
});

document.getElementById('view-stats').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'openPopup' });
});