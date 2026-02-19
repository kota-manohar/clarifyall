/**
 * IndexedDB Cache Service
 * Provides local caching for API data to prevent "Service temporarily unavailable" errors
 * Uses IndexedDB for structured data storage
 */

const DB_NAME = 'ClarifyAllCache';
const DB_VERSION = 1;
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds (reduced for faster updates)

// Store names
const STORES = {
  TOOLS: 'tools',
  TOOL_DETAILS: 'toolDetails',
  CATEGORIES: 'categories',
  PROMPTS: 'prompts',
  PROMPT_DETAILS: 'promptDetails',
  BLOG: 'blog',
  METADATA: 'metadata' // For cache timestamps
};

let dbInstance = null;

/**
 * Initialize IndexedDB database
 */
async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
    };
  });
}

/**
 * Get cached data
 */
async function getCached(key, storeName) {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const now = Date.now();
        const cacheAge = now - result.timestamp;
        if (cacheAge > CACHE_DURATION) {
          // Cache expired, delete it
          deleteCached(key, storeName).catch(console.error);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => {
        console.error('Error reading from cache:', request.error);
        resolve(null); // Return null on error, don't fail
      };
    });
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
async function setCached(key, data, storeName) {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now()
    };

    const request = store.put(cacheEntry);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error writing to cache:', request.error);
        resolve(); // Don't fail on cache write errors
      };
    });
  } catch (error) {
    console.error('Cache set error:', error);
    // Don't throw, caching is optional
  }
}

/**
 * Delete cached data
 */
async function deleteCached(key, storeName) {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error deleting from cache:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Clear all cache for a store
 */
async function clearStore(storeName) {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error clearing cache:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clear all cache
 */
async function clearAllCache() {
  try {
    await Promise.all(Object.values(STORES).map(storeName => clearStore(storeName)));
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Generate cache key from filters/params
 */
function generateCacheKey(prefix, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return sortedParams ? `${prefix}?${sortedParams}` : prefix;
}

const cacheService = {
  STORES,
  initDB,
  getCached,
  setCached,
  deleteCached,
  clearStore,
  clearAllCache,
  generateCacheKey
};

export default cacheService;

