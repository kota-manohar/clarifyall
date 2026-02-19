# Local Data Caching System

## Overview

This caching system uses IndexedDB to store API responses locally, preventing "Service temporarily unavailable" errors when the backend database is unstable.

## How It Works

1. **Immediate Cache Load**: When data is requested, the app first checks IndexedDB cache
2. **Fast Response**: If cached data exists and is fresh (< 24 hours), it's returned immediately
3. **Background Refresh**: Fresh data is fetched from the API in the background
4. **Silent Fallback**: If the API fails, cached data is used (no errors shown to users)
5. **Auto-Update**: When fresh data arrives, the cache is automatically updated

## Benefits

✅ **Eliminates "Service temporarily unavailable" errors**
✅ **App works even when PHP/MySQL server is unstable**
✅ **Faster load times** (cached data loads instantly)
✅ **Perfect for shared hosting environments**
✅ **No user-facing errors** when backend is down

## Services

### `cacheService.js`
Core IndexedDB wrapper that handles:
- Database initialization
- Reading/writing cached data
- Cache expiration (24 hours)
- Cache clearing

### `cachedDbService.js`
Cached wrapper for `dbService` that handles:
- Tools data caching
- Categories data caching
- Tool details caching
- Automatic cache invalidation on writes

### `cachedPromptService.js`
Cached wrapper for `promptService` that handles:
- Prompts list caching
- Prompt details caching
- Trending/popular prompts caching
- Automatic cache invalidation on writes

## Usage

The cached services are automatically used by:
- `toolService.js` → uses `cachedDbService`
- `categoryService.js` → uses `cachedDbService`
- Components using `promptService` → can be updated to use `cachedPromptService`

## Cache Management

### Clear All Cache
```javascript
import cachedDbService from './services/cachedDbService';
await cachedDbService.clearCache();
```

### Clear Specific Cache
```javascript
await cachedDbService.clearToolsCache();
await cachedDbService.clearCategoriesCache();
```

## Cache Duration

- Default: **24 hours**
- Can be modified in `cacheService.js` → `CACHE_DURATION` constant

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 10+)
- Opera: ✅ Full support

## Storage Limits

- IndexedDB has no hard limit (browser-dependent)
- Typically 50% of available disk space
- Automatically handles quota exceeded errors gracefully

