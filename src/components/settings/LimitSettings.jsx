import React, { useState, useEffect } from 'react';
import { Input, Select, Switch } from '../ui/forms';
import { formatTime } from '../../utils/timeUtils';

const LimitSettings = ({ settings, onChange }) => {
    const [limits, setLimits] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [newLimit, setNewLimit] = useState({
        dailyLimit: settings.defaultDailyLimit,
        weeklyLimit: settings.defaultWeeklyLimit,
        enabled: true
    });
    const [editingDomain, setEditingDomain] = useState(null);

    useEffect(() => {
        loadLimits();
    }, []);

    const loadLimits = async () => {
        try {
            const { limits: storedLimits = {} } = await chrome.storage.local.get('limits');
            setLimits(Object.entries(storedLimits).map(([domain, limit]) => ({
                domain,
                ...limit
            })));
        } catch (error) {
            console.error('Error loading limits:', error);
        }
    };

    const handleAddLimit = async () => {
        if (!newDomain) return;

        try {
            const { limits: storedLimits = {} } = await chrome.storage.local.get('limits');
            const updatedLimits = {
                ...storedLimits,
                [newDomain]: newLimit
            };

            await chrome.storage.local.set({ limits: updatedLimits });
            await loadLimits();

            // Reset form
            setNewDomain('');
            setNewLimit({
                dailyLimit: settings.defaultDailyLimit,
                weeklyLimit: settings.defaultWeeklyLimit,
                enabled: true
            });

            // Notify background script
            chrome.runtime.sendMessage({
                type: 'LIMITS_UPDATED',
                data: { limits: updatedLimits }
            });
        } catch (error) {
            console.error('Error adding limit:', error);
        }
    };

    const handleRemoveLimit = async (domain) => {
        try {
            const { limits: storedLimits = {} } = await chrome.storage.local.get('limits');
            const updatedLimits = { ...storedLimits };
            delete updatedLimits[domain];

            await chrome.storage.local.set({ limits: updatedLimits });
            await loadLimits();

            // Notify background script
            chrome.runtime.sendMessage({
                type: 'LIMITS_UPDATED',
                data: { limits: updatedLimits }
            });
        } catch (error) {
            console.error('Error removing limit:', error);
        }
    };

    const handleUpdateLimit = async (domain, updates) => {
        try {
            const { limits: storedLimits = {} } = await chrome.storage.local.get('limits');
            const updatedLimits = {
                ...storedLimits,
                [domain]: {
                    ...storedLimits[domain],
                    ...updates
                }
            };

            await chrome.storage.local.set({ limits: updatedLimits });
            await loadLimits();

            // Notify background script
            chrome.runtime.sendMessage({
                type: 'LIMITS_UPDATED',
                data: { limits: updatedLimits }
            });
        } catch (error) {
            console.error('Error updating limit:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Default Settings */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Default Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Default Daily Limit (minutes)
                        </label>
                        <Input
                            type="number"
                            min="1"
                            value={settings.defaultDailyLimit}
                            onChange={(e) => onChange('defaultDailyLimit', parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Default Weekly Limit (minutes)
                        </label>
                        <Input
                            type="number"
                            min="1"
                            value={settings.defaultWeeklyLimit}
                            onChange={(e) => onChange('defaultWeeklyLimit', parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Warning Threshold (%)
                    </label>
                    <Input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.warningThreshold}
                        onChange={(e) => onChange('warningThreshold', parseInt(e.target.value))}
                        className="w-32"
                    />
                    <p className="text-sm text-gray-500">
                        Show warning when this percentage of the limit is reached
                    </p>
                </div>
            </div>

            {/* Website Limits */}
            <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Website Limits</h3>
                
                {/* Add New Limit */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="md:col-span-1">
                        <Input
                            type="text"
                            placeholder="Domain (e.g., example.com)"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Input
                            type="number"
                            min="1"
                            placeholder="Daily limit (minutes)"
                            value={newLimit.dailyLimit}
                            onChange={(e) => setNewLimit(prev => ({
                                ...prev,
                                dailyLimit: parseInt(e.target.value)
                            }))}
                            className="w-full"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Input
                            type="number"
                            min="1"
                            placeholder="Weekly limit (minutes)"
                            value={newLimit.weeklyLimit}
                            onChange={(e) => setNewLimit(prev => ({
                                ...prev,
                                weeklyLimit: parseInt(e.target.value)
                            }))}
                            className="w-full"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button
                            onClick={handleAddLimit}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Limit
                        </button>
                    </div>
                </div>

                {/* Existing Limits */}
                <div className="space-y-4">
                    {limits.map(({ domain, dailyLimit, weeklyLimit, enabled }) => (
                        <div
                            key={domain}
                            className="bg-gray-50 p-4 rounded-lg space-y-4"
                        >
                            {editingDomain === domain ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={dailyLimit}
                                        onChange={(e) => handleUpdateLimit(domain, {
                                            dailyLimit: parseInt(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        value={weeklyLimit}
                                        onChange={(e) => handleUpdateLimit(domain, {
                                            weeklyLimit: parseInt(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                    <button
                                        onClick={() => setEditingDomain(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{domain}</h4>
                                        <p className="text-sm text-gray-500">
                                            Daily: {formatTime(dailyLimit)} / Weekly: {formatTime(weeklyLimit)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Switch
                                            checked={enabled}
                                            onChange={(checked) => handleUpdateLimit(domain, { enabled: checked })}
                                        />
                                        <button
                                            onClick={() => setEditingDomain(domain)}
                                            className="text-blue-500 hover:text-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleRemoveLimit(domain)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {limits.length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                            No website limits set
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LimitSettings;