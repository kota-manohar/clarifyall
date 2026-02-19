# Centralized API Configuration Guide

## Overview

All API files now use a **centralized configuration system** to prevent code duplication, reduce connection overhead, and improve maintainability.

## Architecture

```
php-api/
├── config.php          # Core configuration & database connection (SINGLETON)
├── api-init.php        # API initialization (includes config + middleware)
├── middleware/         # Security, rate limiting, authentication
│   ├── security.php
│   ├── rateLimit.php
│   └── auth.php
└── utils/
    └── cache.php
```

## Database Configuration Location

**All database credentials are stored in ONE place:**
- `php-api/config.php` - Lines 36-40
- Environment variables via `.env` file (optional but recommended)

**DO NOT** put database configuration in individual API files!

## How to Use in API Files

### Standard Pattern for All API Files:

```php
<?php
/**
 * Your API Name
 * Description of what this API does
 */

// Use centralized API initialization
require_once __DIR__ . '/api-init.php';

// Validate HTTP method (optional, but recommended)
validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);

// Your API logic here
// $pdo is already available from api-init.php
```

### What `api-init.php` Provides:

1. ✅ **CORS headers** - Automatically set
2. ✅ **Security headers** - X-Frame-Options, CSP, etc.
3. ✅ **Rate limiting** - Automatic per-IP limiting
4. ✅ **HTTPS enforcement** - If configured
5. ✅ **Database connection** - Shared singleton connection via `$pdo`
6. ✅ **Error handling** - Standardized error responses
7. ✅ **Input validation helpers** - sanitizeInput(), validateInt(), etc.

## Files Updated to Use Centralized Config:

✅ **Production API Files:**
- `allprompts.php`
- `users.php`
- `tools.php`
- `prompts.php`
- `categories.php`
- `blog-articles.php`
- `user-activity.php`
- `prompt-categories.php`
- `prompt-collections.php`
- `upload-prompt-image.php`

⏭️ **Test Files** (can keep local config for testing):
- `test-*.php` files

## Benefits

1. **Single Source of Truth** - Database config in one place
2. **Connection Pooling** - Prevents exceeding connection limits
3. **Consistent Security** - All endpoints have same security measures
4. **Easy Updates** - Change config once, affects all APIs
5. **Better Error Handling** - Standardized across all endpoints
6. **Rate Limiting** - Automatic protection against abuse

## Configuration Management

### Option 1: Environment Variables (.env file)

Create `.env` file in `php-api/` directory:

```env
DB_HOST=srv1148.hstgr.io
DB_PORT=3306
DB_NAME=u530425252_kyc
DB_USER=u530425252_kyc
DB_PASS=your_password

REQUIRE_HTTPS=false
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

### Option 2: Direct in config.php

Edit `php-api/config.php` lines 36-40:

```php
define('DB_HOST', 'srv1148.hstgr.io');
define('DB_PORT', '3306');
define('DB_NAME', 'u530425252_kyc');
define('DB_USER', 'u530425252_kyc');
define('DB_PASS', 'your_password');
```

## Important Notes

1. **Never put DB credentials in API files** - Always use `config.php`
2. **Never create new PDO connections** - Use `getDBConnection()`
3. **Always use `api-init.php`** - Don't manually set headers
4. **Test files are exception** - Can have local config for testing

## Migration Checklist

When creating a new API file:

- [ ] Remove all CORS header code
- [ ] Remove all database connection code  
- [ ] Remove database configuration variables
- [ ] Add `require_once __DIR__ . '/api-init.php';`
- [ ] Add method validation if needed
- [ ] Use `$pdo` (already available from api-init.php)

## Security

- `.env` file is protected via `.htaccess`
- `config.php` is protected via `.htaccess`
- Database credentials never exposed in responses
- All connections use prepared statements


