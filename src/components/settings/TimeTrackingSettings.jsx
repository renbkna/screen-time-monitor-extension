import React, { useState } from 'react';
import { Input, Select, Switch } from '../ui/forms';

const TimeTrackingSettings = ({ settings, onChange }) => {
    const [newDomain, setNewDomain] = useState('');
    const [newCategory, setNewCategory] = useState('');

    const handleIdleThresholdChange = (value) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            onChange('idleThreshold', Math.min(numValue, 60));
        }
    };

    const categories = [
        'Work',
        'Social Media',
        'Entertainment',
        'Shopping',
        'Education',
        'News',
        'Productivity',
        'Other'
    ];

    return (
        <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Idle Detection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Idle Detection Threshold (minutes)
                    </label>
                    <Input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.idleThreshold}
                        onChange={(e) => handleIdleThresholdChange(e.target.value)}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                        Stop tracking after this many minutes of inactivity
                    </p>
                </div>

                {/* Include Inactive Tabs */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            Track Inactive Tabs
                        </label>
                        <Switch
                            checked={settings.includeInactiveTabs}
                            onChange={(checked) => onChange('includeInactiveTabs', checked)}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Include time spent in background tabs
                    </p>
                </div>

                {/* Track Incognito */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            Track Incognito Browsing
                        </label>
                        <Switch
                            checked={settings.trackIncognito}
                            onChange={(checked) => onChange('trackIncognito', checked)}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Include activity from incognito windows
                    </p>
                </div>
            </div>

            {/* Category Mappings */}
            <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Website Categories
                </h3>

                {/* Add New Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input
                        type="text"
                        placeholder="Domain (e.g., example.com)"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="w-full"
                    />
                    <Select
                        value={newCategory}
                        onChange={setNewCategory}
                        options={categories.map(cat => ({ value: cat, label: cat }))}
                        placeholder="Select category"
                        className="w-full"
                    />
                    <button
                        onClick={() => {
                            if (newDomain && newCategory) {
                                onChange('categoryMappings', {
                                    ...settings.categoryMappings,
                                    [newDomain]: newCategory
                                });
                                setNewDomain('');
                                setNewCategory('');
                            }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Mapping
                    </button>
                </div>

                {/* Existing Mappings */}
                <div className="bg-gray-50 rounded-lg p-4">
                    {Object.entries(settings.categoryMappings || {}).map(([domain, category]) => (
                        <div key={domain} className="flex items-center justify-between py-2">
                            <div>
                                <span className="font-medium">{domain}</span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="text-gray-600">{category}</span>
                            </div>
                            <button
                                onClick={() => {
                                    const newMappings = { ...settings.categoryMappings };
                                    delete newMappings[domain];
                                    onChange('categoryMappings', newMappings);
                                }}
                                className="text-red-500 hover:text-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    {Object.keys(settings.categoryMappings || {}).length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            No category mappings defined
                        </p>
                    )}
                </div>
            </div>

            {/* Time Rounding */}
            <div className="pt-6 border-t border-gray-200">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Time Rounding
                    </label>
                    <Select
                        value={settings.timeRounding || 'none'}
                        onChange={(value) => onChange('timeRounding', value)}
                        options={[
                            { value: 'none', label: 'No rounding' },
                            { value: '5min', label: 'Round to 5 minutes' },
                            { value: '15min', label: 'Round to 15 minutes' },
                            { value: '30min', label: 'Round to 30 minutes' }
                        ]}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                        Round tracked time intervals for cleaner statistics
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TimeTrackingSettings;