// Message types enumeration
export const MESSAGE_TYPES = {
  PAGE_VISIT: 'PAGE_VISIT',
  IDLE_STATE: 'IDLE_STATE',
  UPDATE_TIME: 'UPDATE_TIME'
};

// Messaging utility functions
export const messaging = {
  sendMessage: async (type, data) => {
    try {
      return await chrome.runtime.sendMessage({ type, data });
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }
};
