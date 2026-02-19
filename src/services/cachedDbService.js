/**
 * Cached Database Service
 * Wraps dbService with IndexedDB caching to prevent "Service temporarily unavailable" errors
 * 
 * Strategy:
 * 1. Try to load from cache immediately (fast, reliable)
 * 2. Fetch fresh data from API in background
 * 3. If API succeeds: update cache and optionally notify
 * 4. If API fails: continue using cached data (no errors shown)
 */

import dbService from './dbService';
import cacheService from './cacheService';

/**
 * Fetch with cache fallback
 */
async function fetchWithCache(cacheKey, storeName, fetchFn, useCache = true) {
  let cachedData = null;

  // Step 1: Try to get cached data immediately
  if (useCache) {
    cachedData = await cacheService.getCached(cacheKey, storeName);
    if (cachedData) {
      // Return cached data immediately, then fetch fresh in background
      fetchFreshInBackground(cacheKey, storeName, fetchFn).catch(console.error);
      return cachedData;
    }
  }

  // Step 2: No cache available, fetch from API
  try {
    const freshData = await fetchFn();
    
    // Step 3: Cache the fresh data
    if (useCache && freshData) {
      await cacheService.setCached(cacheKey, freshData, storeName);
    }
    
    return freshData;
  } catch (error) {
    // Step 4: API failed, try cache as fallback
    if (useCache && !cachedData) {
      cachedData = await cacheService.getCached(cacheKey, storeName);
      if (cachedData) {
        console.warn('API failed, using cached data:', error.message);
        return cachedData;
      }
    }
    
    // No cache available, throw the error
    throw error;
  }
}

/**
 * Fetch fresh data in background (non-blocking)
 */
async function fetchFreshInBackground(cacheKey, storeName, fetchFn) {
  try {
    const freshData = await fetchFn();
    if (freshData) {
      await cacheService.setCached(cacheKey, freshData, storeName);
    }
  } catch (error) {
    // Silently fail in background - we already have cached data
    console.debug('Background fetch failed (using cached data):', error.message);
  }
}

const cachedDbService = {
  // Tools methods
  async getTools(filters = {}) {
    const cacheKey = cacheService.generateCacheKey('tools', filters);
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.TOOLS,
      () => dbService.getTools(filters)
    );
  },

  async getToolById(id) {
    const cacheKey = `tool_${id}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.TOOL_DETAILS,
      () => dbService.getToolById(id)
    );
  },

  async createTool(toolData) {
    // Clear tools cache when creating new tool
    await cacheService.clearStore(cacheService.STORES.TOOLS);
    return dbService.createTool(toolData);
  },

  async incrementViewCount(id) {
    // Don't cache this, just pass through
    return dbService.incrementViewCount(id);
  },

  // Categories methods
  async getCategories() {
    const cacheKey = 'categories_all';
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.CATEGORIES,
      () => dbService.getCategories()
    );
  },

  async getCategoryById(id) {
    const categories = await this.getCategories();
    return categories.find(cat => cat.id === parseInt(id));
  },

  // User methods (don't cache user-specific data)
  async createUser(userData) {
    return dbService.createUser(userData);
  },

  async getUserByEmail(email, password) {
    return dbService.getUserByEmail(email, password);
  },

  async getUserById(id) {
    return dbService.getUserById(id);
  },

  async updateUser(id, userData) {
    return dbService.updateUser(id, userData);
  },

  // User saved tools (don't cache user-specific data)
  async getUserSavedTools(userId) {
    return dbService.getUserSavedTools(userId);
  },

  async saveTool(userId, toolId) {
    return dbService.saveTool(userId, toolId);
  },

  async unsaveTool(userId, toolId) {
    return dbService.unsaveTool(userId, toolId);
  },

  async isToolSaved(userId, toolId) {
    return dbService.isToolSaved(userId, toolId);
  },

  // Logo upload (don't cache)
  async uploadLogo(logoFile) {
    return dbService.uploadLogo(logoFile);
  },

  // Cache management
  async clearCache() {
    return cacheService.clearAllCache();
  },

  async clearToolsCache() {
    return cacheService.clearStore(cacheService.STORES.TOOLS);
  },

  async clearCategoriesCache() {
    return cacheService.clearStore(cacheService.STORES.CATEGORIES);
  }
};

export default cachedDbService;

