/**
 * Cached Prompt Service
 * Wraps promptService with IndexedDB caching
 */

import promptService from './promptService';
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
    console.debug('Background fetch failed (using cached data):', error.message);
  }
}

const cachedPromptService = {
  // Get prompts (public, approved only)
  async getPrompts(filters = {}) {
    const cacheKey = cacheService.generateCacheKey('prompts', filters);
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.PROMPTS,
      () => promptService.getPrompts(filters)
    );
  },

  // Get all prompts (admin - don't cache admin data)
  async getAllPrompts(status = null) {
    return promptService.getAllPrompts(status);
  },

  // Get prompt by ID
  async getPromptById(id) {
    const cacheKey = `prompt_${id}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.PROMPT_DETAILS,
      () => promptService.getPromptById(id)
    );
  },

  // Get prompt by slug
  async getPromptBySlug(slug) {
    const cacheKey = `prompt_slug_${slug}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.PROMPT_DETAILS,
      () => promptService.getPromptBySlug(slug)
    );
  },

  // Get trending prompts
  async getTrendingPrompts() {
    const cacheKey = 'prompts_trending';
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.PROMPTS,
      () => promptService.getTrendingPrompts()
    );
  },

  // Get popular prompts
  async getPopularPrompts() {
    const cacheKey = 'prompts_popular';
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.PROMPTS,
      () => promptService.getPopularPrompts()
    );
  },

  // Get statistics (cache for short duration)
  async getStatistics() {
    const cacheKey = 'prompts_statistics';
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.METADATA,
      () => promptService.getStatistics()
    );
  },

  // Write operations (don't cache, clear cache instead)
  async createPrompt(promptData) {
    await cacheService.clearStore(cacheService.STORES.PROMPTS);
    return promptService.createPrompt(promptData);
  },

  async updatePrompt(id, promptData) {
    await cacheService.deleteCached(`prompt_${id}`, cacheService.STORES.PROMPT_DETAILS);
    await cacheService.clearStore(cacheService.STORES.PROMPTS);
    return promptService.updatePrompt(id, promptData);
  },

  async approvePrompt(id) {
    await cacheService.deleteCached(`prompt_${id}`, cacheService.STORES.PROMPT_DETAILS);
    await cacheService.clearStore(cacheService.STORES.PROMPTS);
    return promptService.approvePrompt(id);
  },

  async rejectPrompt(id) {
    await cacheService.deleteCached(`prompt_${id}`, cacheService.STORES.PROMPT_DETAILS);
    await cacheService.clearStore(cacheService.STORES.PROMPTS);
    return promptService.rejectPrompt(id);
  },

  async deletePrompt(id) {
    await cacheService.deleteCached(`prompt_${id}`, cacheService.STORES.PROMPT_DETAILS);
    await cacheService.clearStore(cacheService.STORES.PROMPTS);
    return promptService.deletePrompt(id);
  },

  // Voting (don't cache)
  async upvotePrompt(id, userId) {
    return promptService.upvotePrompt(id, userId);
  },

  async downvotePrompt(id, userId) {
    return promptService.downvotePrompt(id, userId);
  },

  // Categories
  async getCategories() {
    const cacheKey = 'prompt_categories';
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.CATEGORIES,
      () => promptService.getCategories()
    );
  },

  async getCategoryById(id) {
    return promptService.getCategoryById(id);
  },

  // Category write operations
  async createCategory(categoryData) {
    await cacheService.clearStore(cacheService.STORES.CATEGORIES);
    return promptService.createCategory(categoryData);
  },

  async updateCategory(id, categoryData) {
    await cacheService.clearStore(cacheService.STORES.CATEGORIES);
    return promptService.updateCategory(id, categoryData);
  },

  async deleteCategory(id) {
    await cacheService.clearStore(cacheService.STORES.CATEGORIES);
    return promptService.deleteCategory(id);
  },

  // Collections (user-specific, don't cache)
  async getCollections(userId = null, isPublic = null) {
    return promptService.getCollections(userId, isPublic);
  },

  async getCollectionById(id) {
    return promptService.getCollectionById(id);
  },

  async getCollectionPrompts(collectionId) {
    return promptService.getCollectionPrompts(collectionId);
  },

  async createCollection(collectionData) {
    return promptService.createCollection(collectionData);
  },

  async updateCollection(id, collectionData) {
    return promptService.updateCollection(id, collectionData);
  },

  async deleteCollection(id) {
    return promptService.deleteCollection(id);
  },

  async addPromptToCollection(collectionId, promptId) {
    return promptService.addPromptToCollection(collectionId, promptId);
  },

  async removePromptFromCollection(collectionId, promptId) {
    return promptService.removePromptFromCollection(collectionId, promptId);
  },

  // Cache management
  async clearCache() {
    return cacheService.clearAllCache();
  },

  async clearPromptsCache() {
    return cacheService.clearStore(cacheService.STORES.PROMPTS);
  }
};

export default cachedPromptService;

