import React, { useState, useEffect } from 'react';
import { formatTime } from '../utils/timeUtils';

const FocusMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [duration, setDuration] = useState(25); // Default 25 minutes
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [blockedSites, setBlockedSites] = useState([]);
  const [allowedSites, setAllowedSites] = useState([]);

  const templates = [
    {
      name: 'Quick Focus',
      duration: 25,
      blockedSites: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'],
      allowedSites: ['docs.google.com', 'github.com']
    },
    {
      name: 'Deep Work',
      duration: 90,
      blockedSites: ['*'],
      allowedSites: ['docs.google.com', 'github.com', 'stackoverflow.com']
    },
    {
      name: 'Study Session',
      duration: 45,
      blockedSites: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'netflix.com'],
      allowedSites: ['*.edu', 'wikipedia.org', 'scholar.google.com']
    }
  ];

  useEffect(() => {
    checkFocusStatus();
    const interval = setInterval(checkFocusStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkFocusStatus = async () => {
    try {
      const { focusMode } = await chrome.storage.local.get('focusMode');
      if (focusMode?.enabled) {
        setIsActive(true);
        const remaining = Math.max(0, Math.floor((focusMode.endTime - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) {
          await endFocusSession();
        }
      } else {
        setIsActive(false);
        setTimeRemaining(0);
      }
    } catch (error) {
      console.error('Error checking focus status:', error);
    }
  };

  const startFocusSession = async () => {
    try {
      const endTime = Date.now() + duration * 60 * 1000;
      const focusMode = {
        enabled: true,
        startTime: Date.now(),
        endTime,
        duration,
        blockedSites,
        allowedSites
      };

      await chrome.storage.local.set({ focusMode });
      setIsActive(true);
      
      // Notify service worker
      chrome.runtime.sendMessage({
        type: 'FOCUS_MODE_STARTED',
        data: focusMode
      });

      // Create notification
      chrome.notifications.create('focusStarted', {
        type: 'basic',
        iconUrl: '/assets/icons/icon128.png',
        title: 'Focus Mode Started',
        message: `Focus mode active for ${duration} minutes. Stay focused!`,
        buttons: [{ title: 'End Session' }]
      });
    } catch (error) {
      console.error('Error starting focus session:', error);
    }
  };

  const endFocusSession = async () => {
    try {
      await chrome.storage.local.set({
        focusMode: { enabled: false }
      });
      setIsActive(false);
      setTimeRemaining(0);

      // Notify service worker
      chrome.runtime.sendMessage({
        type: 'FOCUS_MODE_ENDED'
      });

      // Create notification
      chrome.notifications.create('focusEnded', {
        type: 'basic',
        iconUrl: '/assets/icons/icon128.png',
        title: 'Focus Session Complete',
        message: 'Great job! Your focus session is complete.',
        buttons: [{ title: 'View Stats' }]
      });
    } catch (error) {
      console.error('Error ending focus session:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setDuration(template.duration);
    setBlockedSites(template.blockedSites);
    setAllowedSites(template.allowedSites);
  };

  const handleCustomDuration = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDuration(value);
    }
  };

  if (isActive) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Focus Mode Active</h2>
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
          </div>
          <p className="text-gray-600">Stay focused and avoid distractions!</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Blocked Sites</h3>
            <ul className="space-y-1">
              {blockedSites.map((site, index) => (
                <li key={index} className="text-blue-600">{site}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={endFocusSession}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            End Session Early
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Start Focus Session</h2>

      <div className="space-y-6">
        {/* Templates */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Choose Template</label>
          <div className="grid grid-cols-1 gap-2">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateSelect(template)}
                className={`p-3 rounded-lg border text-left ${selectedTemplate?.name === template.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-500'}`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-500">{template.duration} minutes</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={handleCustomDuration}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={startFocusSession}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Start Focus Session
        </button>
      </div>
    </div>
  );
};

export default FocusMode;