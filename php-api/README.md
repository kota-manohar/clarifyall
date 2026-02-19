# ClarifyAll API Documentation

## Overview

The ClarifyAll API provides RESTful endpoints for managing AI tools, prompts, users, and content. This API is built with PHP using PDO for database connections and implements modern security practices.

## Base URL

```
https://clarifyall.com/php-api/
```

## API Versioning

Current version: `v1`

All endpoints follow the versioning pattern, though v1 is currently the default.

## Authentication

### API Key Authentication

Most endpoints require an API key for authentication. Include your API key in one of the following ways:

**Header (Recommended):**
```
Authorization: Bearer YOUR_API_KEY
```
or
```
X-API-Key: YOUR_API_KEY
```

**Query Parameter (Less Secure):**
```
?api_key=YOUR_API_KEY
```

### JWT Tokens (Coming Soon)

JWT token authentication will be implemented for user sessions.

## Rate Limiting

- **Limit:** 100 requests per hour per IP address
- **Response Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds to wait before retrying (when limited)

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Security

### HTTPS Required

All API calls must use HTTPS in production.

### Security Headers

The API automatically sets security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security` (when HTTPS is enforced)

## Error Responses

All errors follow a standardized format:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection issues)

## Endpoints

### Tools

#### Get All Tools
```
GET /tools.php
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (integer): Filter by category ID
- `search` (string): Search in name/description
- `status` (string): Filter by status (PENDING, APPROVED, REJECTED)

**Example Response:**
```json
{
  "tools": [...],
  "totalElements": 150,
  "totalPages": 8,
  "currentPage": 1
}
```

#### Get Tool by ID
```
GET /tools.php/{id}
```

#### Create Tool
```
POST /tools.php
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Tool Name",
  "description": "Tool description",
  "website_url": "https://example.com",
  ...
}
```

### Prompts

#### Get All Prompts
```
GET /allprompts.php
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `sort` (string): Sort field (created_at, upvotes, etc.)
- `order` (string): Sort direction (asc, desc)
- `category` (integer): Filter by category
- `type` (string): Filter by type
- `difficulty` (string): Filter by difficulty

### Users

#### Get User Profile
```
GET /users.php?id={userId}
```

#### Update User Profile
```
PUT /users.php/{userId}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "User bio",
  ...
}
```

### Categories

#### Get All Categories
```
GET /categories.php
```

#### Get Category by ID
```
GET /categories.php/{id}
```

## Input Validation

All inputs are validated and sanitized:
- Strings are trimmed and HTML-escaped
- Integers are validated with min/max bounds
- Emails are validated for proper format
- SQL injection attempts are detected and logged

Always use prepared statements (which all endpoints do).

## Caching

Frequently accessed data is cached to reduce database load:
- Cache TTL: 300 seconds (5 minutes) by default
- Cache can be cleared via admin interface
- Cache automatically expires and cleans up

## Best Practices

1. **Always use HTTPS** in production
2. **Store API keys securely** - never commit them to version control
3. **Handle rate limits** - implement exponential backoff
4. **Validate all inputs** on the client side before sending
5. **Use appropriate HTTP methods** (GET for reads, POST/PUT/DELETE for modifications)
6. **Implement error handling** - check status codes and error messages
7. **Respect caching headers** - don't make unnecessary requests
8. **Log errors** on your end for debugging

## Environment Configuration

Create a `.env` file in the `php-api` directory:

```env
DB_HOST=your_host
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_username
DB_PASS=your_password

API_VERSION=v1
REQUIRE_HTTPS=true
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
ENABLE_CACHE=true
LOG_LEVEL=INFO
```

## Monitoring

### Logs

API logs are stored in `php-api/logs/` directory:
- Daily log files: `api-YYYY-MM-DD.log`
- Includes errors, rate limit violations, and security events

### Metrics to Monitor

- Database connection pool usage
- Rate limit violations per IP
- Failed authentication attempts
- Error rates by endpoint
- Response times

## Support

For API support or to report issues:
- Email: support@clarifyall.com
- Check logs in `php-api/logs/` for error details

## Changelog

### v1.0.0 (Current)
- Initial API release
- Database connection pooling
- Rate limiting
- Security headers
- Input validation and sanitization
- File-based caching


