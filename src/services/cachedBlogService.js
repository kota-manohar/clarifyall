/**
 * Cached Blog Service
 * Wraps blogService with IndexedDB caching
 */

import blogService from './blogService';
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

const cachedBlogService = {
  // Get all articles (cached)
  async getArticles(filters = {}) {
    const cacheKey = cacheService.generateCacheKey('blog_articles', filters);
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.BLOG,
      () => blogService.getArticles(filters)
    );
  },

  // Get article by ID (cached)
  async getArticleById(id) {
    const cacheKey = `blog_article_${id}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.BLOG,
      () => blogService.getArticleById(id)
    );
  },

  // Get article by slug (cached)
  async getArticleBySlug(slug) {
    const cacheKey = `blog_article_slug_${slug}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.BLOG,
      () => blogService.getArticleBySlug(slug)
    );
  },

  // Get featured articles (cached)
  async getFeaturedArticles(limit = 5) {
    const cacheKey = `blog_featured_${limit}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.BLOG,
      () => blogService.getFeaturedArticles(limit)
    );
  },

  // Get articles by category (cached)
  async getArticlesByCategory(category, limit = 10) {
    const cacheKey = `blog_category_${category}_${limit}`;
    return fetchWithCache(
      cacheKey,
      cacheService.STORES.BLOG,
      () => blogService.getArticlesByCategory(category, limit)
    );
  },

  // Write operations (don't cache, clear cache instead)
  async createArticle(articleData) {
    await cacheService.clearStore(cacheService.STORES.BLOG);
    return blogService.createArticle(articleData);
  },

  async updateArticle(id, articleData) {
    await cacheService.deleteCached(`blog_article_${id}`, cacheService.STORES.BLOG);
    await cacheService.clearStore(cacheService.STORES.BLOG);
    return blogService.updateArticle(id, articleData);
  },

  async deleteArticle(id) {
    await cacheService.deleteCached(`blog_article_${id}`, cacheService.STORES.BLOG);
    await cacheService.clearStore(cacheService.STORES.BLOG);
    return blogService.deleteArticle(id);
  },

  // Cache management
  async clearCache() {
    return cacheService.clearStore(cacheService.STORES.BLOG);
  }
};

export default cachedBlogService;

