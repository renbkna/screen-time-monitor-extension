import React from 'react';
import { Switch, Input, Select } from '../ui/forms';

const NotificationSettings = ({ settings, onChange }) => {
    const handleQuietHoursChange = (key, value) => {
        onChange('quietHours', {
            ...settings.quietHours,
            [key]: value
        });
    };

    const handleNotificationTypeChange = (typeId, enabled) => {
        onChange('types', {
            ...settings.types,
            [typeId]: enabled
        });
    };

    const notificationTypes = [
        {
            id: 'timeLimit',
            label: 'Time Limit Alerts',
            description: 'Notifications when approaching or exceeding time limits',
            priority: 'high'
        },
        {
            id: 'focusMode',
            label: 'Focus Mode Updates',
            description: 'Notifications about focus session progress',
            priority: 'high'
        },
        {
            id: 'dailyDigest',
            label: 'Daily Summary',
            description: 'Daily overview of your screen time and activities',
            priority: 'normal'
        },
        {
            id: 'weeklyReport',
            label: 'Weekly Report',
            description: 'Detailed weekly analysis of your usage patterns',
            priority: 'normal'
        },
        {
            id: 'achievements',
            label: 'Achievements',
            description: 'Notifications when you reach milestones',
            priority: 'low'
        }
    ];

    const priorityColors = {
        high: 'text-red-600',
        normal: 'text-blue-600',
        low: 'text-gray-600'
    };

    return (
        <div className="space-y-6">
            {/* Master Switch */}
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                <div>
                    <h3 className="text-lg font-medium text-blue-900">Enable Notifications</h3>
                    <p className="text-sm text-blue-600">Master control for all notifications</p>
                </div>
                <Switch
                    checked={settings.enabled}
                    onChange={(checked) => onChange('enabled', checked)}
                    className="scale-125"
                />
            </div>

            {settings.enabled && (
                <>
                    {/* Quiet Hours */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
                                <p className="text-sm text-gray-600">
                                    Don't show notifications during these hours
                                </p>
                            </div>
                            <Switch
                                checked={settings.quietHours.enabled}
                                onChange={(checked) => handleQuietHoursChange('enabled', checked)}
                            />
                        </div>

                        {settings.quietHours.enabled && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Start Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={settings.quietHours.start}
                                        onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        End Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={settings.quietHours.end}
                                        onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
                        <div className="divide-y divide-gray-200">
                            {notificationTypes.map(type => (
                                <div key={type.id} className="py-4 flex items-center justify-between">
                                    <div className="pr-4">
                                        <h4 className="text-sm font-medium text-gray-900">{type.label}</h4>
                                        <p className="text-sm text-gray-500">{type.description}</p>
                                        <span className={`text-xs font-medium ${priorityColors[type.priority]}`}>
                                            {type.priority.charAt(0).toUpperCase() + type.priority.slice(1)} Priority
                                        </span>
                                    </div>
                                    <Switch
                                        checked={settings.types[type.id]}
                                        onChange={(checked) => handleNotificationTypeChange(type.id, checked)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                        
                        {/* Rate Limiting */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Maximum Notifications per Hour
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="60"
                                value={settings.rateLimit || 10}
                                onChange={(e) => onChange('rateLimit', parseInt(e.target.value) || 10)}
                                className="w-32"
                            />
                            <p className="text-sm text-gray-500">
                                Limit the frequency of notifications to prevent overwhelming
                            </p>
                        </div>

                        {/* Sound Settings */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Notification Sound
                            </label>
                            <Select
                                value={settings.sound || 'default'}
                                onChange={(value) => onChange('sound', value)}
                                options={[
                                    { value: 'none', label: 'No Sound' },
                                    { value: 'default', label: 'Default Sound' },
                                    { value: 'subtle', label: 'Subtle Sound' },
                                    { value: 'urgent', label: 'Urgent Sound' }
                                ]}
                                className="w-full max-w-xs"
                            />
                        </div>

                        {/* Test Notifications */}
                        <div className="pt-4">
                            <button
                                onClick={() => {
                                    chrome.runtime.sendMessage({
                                        type: 'SHOW_TEST_NOTIFICATION'
                                    });
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Send Test Notification
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationSettings;