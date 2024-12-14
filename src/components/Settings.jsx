import React, { useState, useEffect } from 'react';
import { Tabs, TabList, TabPanel } from '../components/ui/Tabs';

const Settings = () => {
    const [settings, setSettings] = useState({
        general: {
            startOfDay: '00:00',
            theme: 'system',
            badgeDisplay: 'timer', // 'timer', 'icon', or 'none'
            showInactiveTabs: true
        },
        timeTracking: {
            idleThreshold: 5, // minutes
            includeInactiveTabs: false,
            trackIncognito: false
        },
        notifications: {
            enabled: true,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            },
            types: {
                timeLimit: true,
                focusMode: true,
                dailyDigest: true,
                weeklyReport: true,
                achievements: true
            }
        },
        privacy: {
            collectAnonymousStats: false,
            keepDataDuration: 30, // days
            syncData: false
        },
        limits: {
            defaultDailyLimit: 120, // minutes
            defaultWeeklyLimit: 840, // minutes
            warningThreshold: 90 // percentage
        },
        focusMode: {
            defaultDuration: 25,
            autoStartBreak: true,
            breakDuration: 5
        }
    });

    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { settings: savedSettings } = await chrome.storage.local.get('settings');
            if (savedSettings) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...savedSettings
                }));
            }
        } catch (error) {
            setError('Failed to load settings');
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            await chrome.storage.local.set({ settings });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);

            // Notify background script of settings change
            chrome.runtime.sendMessage({
                type: 'SETTINGS_UPDATED',
                data: settings
            });
        } catch (error) {
            setError('Failed to save settings');
            console.error('Error saving settings:', error);
        }
    };

    const handleChange = (section, key, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {saved && (
                <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
                    Settings saved successfully!
                </div>
            )}

            <Tabs defaultValue="general">
                <TabList>
                    <Tab value="general">General</Tab>
                    <Tab value="timeTracking">Time Tracking</Tab>
                    <Tab value="notifications">Notifications</Tab>
                    <Tab value="privacy">Privacy</Tab>
                    <Tab value="limits">Limits</Tab>
                    <Tab value="focusMode">Focus Mode</Tab>
                    <Tab value="data">Data</Tab>
                </TabList>

                <TabPanel value="general">
                    <GeneralSettings 
                        settings={settings.general}
                        onChange={(key, value) => handleChange('general', key, value)}
                    />
                </TabPanel>

                <TabPanel value="timeTracking">
                    <TimeTrackingSettings
                        settings={settings.timeTracking}
                        onChange={(key, value) => handleChange('timeTracking', key, value)}
                    />
                </TabPanel>

                <TabPanel value="notifications">
                    <NotificationSettings
                        settings={settings.notifications}
                        onChange={(key, value) => handleChange('notifications', key, value)}
                    />
                </TabPanel>

                <TabPanel value="privacy">
                    <PrivacySettings
                        settings={settings.privacy}
                        onChange={(key, value) => handleChange('privacy', key, value)}
                    />
                </TabPanel>

                <TabPanel value="limits">
                    <LimitSettings
                        settings={settings.limits}
                        onChange={(key, value) => handleChange('limits', key, value)}
                    />
                </TabPanel>

                <TabPanel value="focusMode">
                    <FocusModeSettings
                        settings={settings.focusMode}
                        onChange={(key, value) => handleChange('focusMode', key, value)}
                    />
                </TabPanel>

                <TabPanel value="data">
                    <DataSettings />
                </TabPanel>
            </Tabs>

            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={loadSettings}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                    Reset
                </button>
                <button
                    onClick={saveSettings}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default Settings;
