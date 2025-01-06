/**
 * Storage utility functions for managing extension data
 */

// Get data from storage
export async function getData(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key];
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
}

// Save data to storage
export async function saveData(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Remove data from storage
export async function removeData(key) {
  try {
    await chrome.storage.local.remove(key);
  } catch (error) {
    console.error('Error removing data:', error);
  }
}

// Clear all storage
export async function clearAllData() {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}