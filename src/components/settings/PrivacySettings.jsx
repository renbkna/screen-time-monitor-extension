import React, { useState } from 'react';
import { Switch, Select, Button } from '../ui/forms';

const PrivacySettings = ({ settings, onChange }) => {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);

    const dataDurations = [
        { value: 7, label: '1 Week' },
        { value: 30, label: '30 Days' },
        { value: 90, label: '90 Days' },
        { value: 180, label: '6 Months' },
        { value: 365, label: '1 Year' },
        { value: -1, label: 'Forever' }
    ];

    const exportData = async () => {
        try {
            const data = await chrome.storage.local.get(null);
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `screen-time-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const importData = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setOperationType('import');
            setIsConfirmDialogOpen(true);
        }
    };

    const handleImportConfirm = async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await chrome.storage.local.set(data);
            // Notify background script to reload data
            chrome.runtime.sendMessage({ type: 'RELOAD_DATA' });
            // Show success message
            chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                    title: 'Data Imported',
                    message: 'Your data has been successfully imported',
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error importing data:', error);
            chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                    title: 'Import Failed',
                    message: 'There was an error importing your data',
                    type: 'error'
                }
            });
        }
    };

    const clearData = () => {
        setOperationType('clear');
        setIsConfirmDialogOpen(true);
    };

    const handleClearConfirm = async () => {
        try {
            await chrome.storage.local.clear();
            // Notify background script to reload data
            chrome.runtime.sendMessage({ type: 'RELOAD_DATA' });
            // Show success message
            chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                    title: 'Data Cleared',
                    message: 'All your data has been successfully cleared',
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error clearing data:', error);
            chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                    title: 'Error',
                    message: 'Failed to clear data',
                    type: 'error'
                }
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Data Collection */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Data Collection</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Anonymous Usage Statistics
                            </label>
                            <p className="text-sm text-gray-500">
                                Help improve the extension by sharing anonymous usage data
                            </p>
                        </div>
                        <Switch
                            checked={settings.collectAnonymousStats}
                            onChange={(checked) => onChange('collectAnonymousStats', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Sync Data Across Devices
                            </label>
                            <p className="text-sm text-gray-500">
                                Keep your settings and statistics in sync across browsers
                            </p>
                        </div>
                        <Switch
                            checked={settings.syncData}
                            onChange={(checked) => onChange('syncData', checked)}
                        />
                    </div>
                </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Data Retention</h3>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Keep Data For
                    </label>
                    <Select
                        value={settings.keepDataDuration}
                        onChange={(value) => onChange('keepDataDuration', value)}
                        options={dataDurations}
                        className="w-full max-w-xs"
                    />
                    <p className="text-sm text-gray-500">
                        Automatically delete data older than this period
                    </p>
                </div>
            </div>

            {/* Data Management */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Button
                            onClick={exportData}
                            className="w-full bg-blue-500 text-white hover:bg-blue-600"
                        >
                            Export Data
                        </Button>
                        <p className="text-sm text-gray-500">
                            Download all your data as a JSON file
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block w-full">
                            <span className="sr-only">Import Data</span>
                            <input
                                type="file"
                                accept=".json"
                                onChange={importData}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-sm file:font-medium
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                            />
                        </label>
                        <p className="text-sm text-gray-500">
                            Import data from a backup file
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={clearData}
                        className="w-full bg-red-500 text-white hover:bg-red-600"
                    >
                        Clear All Data
                    </Button>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                        Permanently delete all your data and reset the extension
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {isConfirmDialogOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {operationType === 'import' ? 'Import Data' : 'Clear Data'}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            {operationType === 'import'
                                                ? 'This will replace all your current data. Are you sure you want to continue?'
                                                : 'This will permanently delete all your data. This action cannot be undone. Are you sure you want to continue?'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <Button
                                    onClick={() => {
                                        if (operationType === 'import') {
                                            handleImportConfirm();
                                        } else {
                                            handleClearConfirm();
                                        }
                                        setIsConfirmDialogOpen(false);
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                                >
                                    Confirm
                                </Button>
                                <Button
                                    onClick={() => setIsConfirmDialogOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivacySettings;