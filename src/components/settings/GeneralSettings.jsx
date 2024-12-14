import React from 'react';
import { Select, Input, Switch } from '../ui/forms';

const GeneralSettings = ({ settings, onChange }) => {
    const themes = [
        { value: 'system', label: 'System Default' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' }
    ];

    const badgeOptions = [
        { value: 'timer', label: 'Timer' },
        { value: 'icon', label: 'Icon' },
        { value: 'none', label: 'None' }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start of Day */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Start of Day
                    </label>
                    <Input
                        type="time"
                        value={settings.startOfDay}
                        onChange={(e) => onChange('startOfDay', e.target.value)}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                        Daily statistics will reset at this time
                    </p>
                </div>

                {/* Theme Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Theme
                    </label>
                    <Select
                        value={settings.theme}
                        onChange={(value) => onChange('theme', value)}
                        options={themes}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                        Choose your preferred color theme
                    </p>
                </div>

                {/* Badge Display */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Extension Badge
                    </label>
                    <Select
                        value={settings.badgeDisplay}
                        onChange={(value) => onChange('badgeDisplay', value)}
                        options={badgeOptions}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                        Choose what to show on the extension icon
                    </p>
                </div>

                {/* Show Inactive Tabs */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            Show Inactive Tabs
                        </label>
                        <Switch
                            checked={settings.showInactiveTabs}
                            onChange={(checked) => onChange('showInactiveTabs', checked)}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Include inactive tabs in the overview
                    </p>
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm text-gray-600">Toggle Focus Mode</span>
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-sm">
                            Alt + F
                        </kbd>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm text-gray-600">Show Statistics</span>
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-sm">
                            Alt + S
                        </kbd>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm text-gray-600">Quick Block</span>
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-sm">
                            Alt + B
                        </kbd>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm text-gray-600">Open Settings</span>
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-sm">
                            Alt + ,
                        </kbd>
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Note: Some shortcuts may not work if another extension or application is using them
                </p>
            </div>
        </div>
    );
};

export default GeneralSettings;