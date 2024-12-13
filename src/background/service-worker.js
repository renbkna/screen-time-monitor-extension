// Initialize message passing system
const MESSAGE_TYPES = {
  PAGE_VISIT: 'PAGE_VISIT',
  IDLE_STATE: 'IDLE_STATE',
  UPDATE_TIME: 'UPDATE_TIME'
};

// Initialize storage system
const initializeStorage = async () => {
  const data = await chrome.storage.local.get('dailyStats');
  if (!data.dailyStats) {
    await chrome.storage.local.set({
      dailyStats: {}
    });
  }
};

// Initialize background worker
const initialize = async () => {
  await initializeStorage();
  console.log('Background service worker initialized');
};

initialize();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  // Handle message based on type
  switch (message.type) {
    case MESSAGE_TYPES.PAGE_VISIT:
      // Handle page visit
      break;
    case MESSAGE_TYPES.IDLE_STATE:
      // Handle idle state change
      break;
    case MESSAGE_TYPES.UPDATE_TIME:
      // Handle time update
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
});
