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

// Listen for blocking status
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLOCK_STATUS') {
    if (message.data.isBlocked) {
      // Redirect to blocked page with reason and end time
      const params = new URLSearchParams({
        reason: message.data.reason,
        endTime: message.data.endTime
      });
      window.location.href = chrome.runtime.getURL(`blocking/blocked.html?${params}`);
    }
  }
});

// Check block status when page loads
chrome.runtime.sendMessage({
  type: 'CHECK_BLOCK_STATUS',
  data: {
    url: window.location.href
  }
});
