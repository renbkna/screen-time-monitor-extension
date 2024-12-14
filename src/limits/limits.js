import { storage } from '../utils/storage.js';
import { messageActiveTab } from '../utils/messaging.js';

const LIMITS_STORAGE_KEY = 'screentime_limits';

export async function setLimit(domain, dailyLimit, weeklyLimit) {
  const limits = await storage.get(LIMITS_STORAGE_KEY) || {};
  limits[domain] = { 
    dailyLimit,
    weeklyLimit,
    enabled: true
  };
  await storage.set(LIMITS_STORAGE_KEY, limits);
}

export async function removeLimit(domain) {
  const limits = await storage.get(LIMITS_STORAGE_KEY) || {};
  delete limits[domain];  
  await storage.set(LIMITS_STORAGE_KEY, limits);
}

export async function getLimits() {
  return await storage.get(LIMITS_STORAGE_KEY) || {};
}

export async function checkLimits(domain, dailyUsage, weeklyUsage) {
  const limits = await getLimits();
  const limit = limits[domain];

  if (limit && limit.enabled) {
    const { dailyLimit, weeklyLimit } = limit;
    
    if (dailyUsage >= dailyLimit || weeklyUsage >= weeklyLimit) {
      await blockSite(domain);
      notifyLimitReached(domain);
    }
  }
}

async function blockSite(domain) {
  await messageActiveTab({ type: 'BLOCK_SITE', domain });
}

function notifyLimitReached(domain) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'path/to/icon.png',
    title: 'Screen Time Limit Reached',
    message: `You have reached your screen time limit for ${domain}.`
  });
}
