// Initialize content script
console.log('Content script loaded');

// Send initial page visit message to background script
chrome.runtime.sendMessage({
  type: 'PAGE_VISIT',
  data: {
    url: window.location.href,
    timestamp: Date.now()
  }
});
