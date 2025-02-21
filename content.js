// Content script for Screen Time Manager
let lastActivity = Date.now();
let idleTimeout = null;
let isLimitExceeded = false;
let retryCount = 0;
const MAX_RETRIES = 3;
let isInitialized = false;
let messageQueue = [];
let isProcessingQueue = false;

// Site-specific handlers
const siteHandlers = {
  'youtube.com': {
    initialize: function () {
      // YouTube specific initialization
      if (typeof YT === 'undefined') {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Create observer for video player changes
      const observer = new MutationObserver((mutations) => {
        const player = document.querySelector('#movie_player');
        if (player) {
          handleYouTubeActivity();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },
    cleanup: function () {
      // YouTube specific cleanup
    }
  },
  'pinterest.com': {
    initialize: function () {
      // Pinterest specific initialization
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            handlePinterestActivity();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    },
    cleanup: function () {
      // Pinterest specific cleanup
    }
  }
};

// Site-specific activity handlers
function handleYouTubeActivity() {
  const player = document.querySelector('#movie_player');
  if (player && player.getPlayerState) {
    const state = player.getPlayerState();
    // Only count as activity if video is playing
    if (state === 1) {
      // 1 = playing
      updateActivity();
    }
  }
}

function handlePinterestActivity() {
  // Track Pinterest infinite scroll and modal interactions
  updateActivity();
}

// Initialize content script
function initialize() {
  try {
    if (!document || !document.body) {
      setTimeout(initialize, 100);
      return;
    }

    // Set up site-specific handlers
    const hostname = window.location.hostname;
    const domain = Object.keys(siteHandlers).find((site) =>
      hostname.includes(site)
    );
    if (domain) {
      console.log(`Initializing handler for ${domain}`);
      siteHandlers[domain].initialize();
    }

    setupActivityTracking();
    injectCustomStyles();
    sendTabInfo();
    checkTimeLimits();

    console.log('Screen Time Manager content script initialized');
  } catch (error) {
    console.error('Initialization failed:', error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(initialize, 1000 * Math.pow(2, retryCount));
    }
  }
}

// Set up activity tracking
function setupActivityTracking() {
  // Track more user activities with error handling
  ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'].forEach(
    (event) => {
      try {
        document.addEventListener(event, handleUserActivity, { passive: true });
      } catch (error) {
        console.warn(`Failed to add ${event} listener:`, error);
      }
    }
  );

  // Track visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Set up idle detection
  startIdleDetection();

  // Periodic active check
  setInterval(sendActiveStatus, 2000);
}

// Handle user activity with debouncing
let activityTimeout = null;
function handleUserActivity() {
  try {
    lastActivity = Date.now();
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }

    activityTimeout = setTimeout(async () => {
      await sendMessageSafely({
        action: 'updateActivity',
        lastActivity: lastActivity
      });
    }, 500);
  } catch (error) {
    console.warn('Error handling user activity:', error);
  }
}

// Send active status periodically
async function sendActiveStatus() {
  if (!document.hidden) {
    await sendMessageSafely({
      action: 'updateActivity',
      lastActivity: lastActivity
    });
  }
}

// Handle visibility change
function handleVisibilityChange() {
  try {
    if (document.hidden) {
      sendMessageSafely({ action: 'pageHidden' });
    } else {
      sendMessageSafely({ action: 'pageVisible' });
      handleUserActivity();
    }
  } catch (error) {
    console.warn('Error handling visibility change:', error);
  }
}

// Start idle detection
function startIdleDetection() {
  try {
    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }

    idleTimeout = setTimeout(
      () => {
        sendMessageSafely({ action: 'idle' });
      },
      5 * 60 * 1000
    ); // 5 minutes of inactivity
  } catch (error) {
    console.warn('Error starting idle detection:', error);
  }
}

// Safe message sender with queuing
async function sendMessageSafely(message) {
  try {
    if (!chrome.runtime) {
      console.warn('Chrome runtime not available');
      return null;
    }
    return await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.warn(`Message sending failed: ${error.message}`);
    return null;
  }
}

// Check time limits periodically
function checkTimeLimits() {
  setInterval(async () => {
    try {
      if (!document.hidden) {
        const response = await sendMessageSafely({ action: 'checkLimit' });
        if (response?.isExceeded && !isLimitExceeded) {
          isLimitExceeded = true;
          showLimitExceededOverlay();
        }
      }
    } catch (error) {
      console.warn('Error checking time limit:', error);
    }
  }, 2000); // Check every 2 seconds
}

// Get current tab info
async function sendTabInfo() {
  try {
    const response = await sendMessageSafely({ action: 'getTabInfo' });
    if (response?.domain) {
      console.log('Current domain:', response.domain);
      if (response.isLimitExceeded) {
        showLimitExceededOverlay(response.domain);
      }
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
}

// Show limit exceeded overlay
function showLimitExceededOverlay(domain) {
  try {
    // Remove any existing overlay first
    const existingOverlay = document.querySelector('.screen-time-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'screen-time-overlay';
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

    const content = document.createElement('div');
    content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 400px;
            margin: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

    content.innerHTML = `
            <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
                Time Limit Reached
            </h2>
            <p style="margin-bottom: 1.5rem; color: #666;">
                You've reached your daily limit for ${domain || 'this website'}. 
                Take a break and come back tomorrow!
            </p>
            <div style="display: flex; justify-content: center; gap: 1rem;">
                <button id="openSettings" style="
                    background: #3B82F6;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    border: none;
                    font-weight: 500;
                    transition: background-color 0.2s;
                ">Adjust Limits</button>
                <button id="closeTab" style="
                    background: #6B7280;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    border: none;
                    font-weight: 500;
                    transition: background-color 0.2s;
                ">Close Tab</button>
            </div>
        `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Add event listeners
    const settingsButton = overlay.querySelector('#openSettings');
    const closeButton = overlay.querySelector('#closeTab');

    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        sendMessageSafely({ action: 'openSettings' });
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        try {
          window.close();
        } catch (error) {
          console.warn('Error closing tab:', error);
          // Fallback to navigation
          window.location.href = 'about:blank';
        }
      });
    }

    // Prevent background page interaction and escape key
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        e.stopPropagation();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isLimitExceeded) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  } catch (error) {
    console.error('Error showing limit exceeded overlay:', error);
  }
}

// Inject custom styles
function injectCustomStyles() {
  try {
    const existingStyle = document.getElementById('screen-time-styles');
    if (existingStyle) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'screen-time-styles';
    style.textContent = `
            .screen-time-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #fff;
                border-radius: 8px;
                padding: 12px 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 999999;
                font-family: system-ui, -apple-system, sans-serif;
                animation: slideIn 0.3s ease-out;
            }

            .screen-time-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                backdrop-filter: blur(4px);
            }

            .screen-time-overlay button:hover {
                filter: brightness(110%);
            }

            @keyframes slideIn {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @media (prefers-color-scheme: dark) {
                .screen-time-notification {
                    background: #1f2937;
                    color: #fff;
                }
                
                .screen-time-overlay .content {
                    background: #1f2937;
                    color: #fff;
                }
            }
        `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error injecting custom styles:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message?.action === 'limitExceeded') {
      showLimitExceededOverlay(message.domain);
      isLimitExceeded = true;
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
  return true;
});
