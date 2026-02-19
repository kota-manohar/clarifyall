# Futurepedia Scraper

## Overview

Complete data extraction pipeline for Futurepedia.io that scrapes AI tool listings from the personal assistant category, downloads logos as binary data, maps categories, and generates SQL INSERT scripts.

## Project Structure

```
futurepedia/
├── scrape-futurepedia.js          # Main scraper using Puppeteer
├── parse-futurepedia-data.js      # Data normalization and validation
├── map-futurepedia-categories.js  # Category mapping
├── download-futurepedia-logos.js  # Logo downloader with binary conversion
├── generate-futurepedia-sql.js    # SQL INSERT script generator
├── run-futurepedia-extraction.js  # Pipeline orchestrator
├── test-selectors.js              # Selector testing utility
├── output/                        # Data files (created on run)
└── sql-output/                    # Generated SQL files (created on run)
```

## Quick Start

### Run Complete Pipeline

```bash
cd c:\Users\manoh\IdeaProjects\clarifyall\frontend-standalone\scripts\futurepedia
node run-futurepedia-extraction.js
```

This will:
1. Scrape tools from https://www.futurepedia.io/ai-tools/personal-assistant
2. Parse and normalize data
3. Map categories
4. Download logos as binary data
5. Generate SQL INSERT scripts

### Run Individual Steps

```bash
# 1. Scrape only
node scrape-futurepedia.js

# 2. Parse data
node parse-futurepedia-data.js

# 3. Map categories
node map-futurepedia-categories.js

# 4. Download logos
node download-futurepedia-logos.js

# 5. Generate SQL
node generate-futurepedia-sql.js

# Test selectors
node test-selectors.js
```

## Selector Verification

Test results show the scraper correctly finds:
- **36 tool links** with `a[href*="/tool/"]`
- **35 category links** with `a.hover:text-underline`
- **11 external links** with `a[href*="utm_source=futurepedia"]`

Sample tool data extracted:
- Tool URL: `https://www.futurepedia.io/tool/magictrips`
- Has name (`<p>` tag): ✅
- Has logo (`<img>` tag): ✅

## Database Schema Support

### Categories Table
```sql
CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL
)
```

### Tools Table (Complete Schema)
- ✅ name, slug, description, website_url, short_description, full_description
- ✅ logo_url, logo_binary (MEDIUMBLOB), logo_mime_type
- ✅ category_id (mapped to categories table)
- ✅ pricing_model (FREE, FREEMIUM, FREE_TRIAL, PAID)
- ✅ SEO fields (meta_title, meta_description, og_*, twitter_*)
- ✅ platforms, feature_tags (JSON arrays)
- ✅ status, view_count, save_count, rating, review_count

## Output Files

### Data Files
- `output/futurepedia-tools-raw.json` - Raw scraped data
- `output/futurepedia-tools-parsed.json` - Normalized data
- `output/futurepedia-category-mapping.json` - Category mappings
- `output/futurepedia-new-categories.json` - New categories
- `output/futurepedia-tools-with-logos.json` - Tools with logo binary data
- `output/futurepedia-logos/` - Downloaded logo files

### SQL Files
- `sql-output/insert-futurepedia-categories.sql` - Category INSERT statements
- `sql-output/insert-tools-futurepedia-part*.sql` - Tool INSERT statements (500 per file)

## Database Import

### Step 1: Import Categories
```sql
SOURCE sql-output/insert-futurepedia-categories.sql;
```

### Step 2: Import Tools
```sql
SOURCE sql-output/insert-tools-futurepedia-part1.sql;
SOURCE sql-output/insert-tools-futurepedia-part2.sql;
-- ... continue for all part files
```

### Step 3: Verify
```sql
-- Check tools from Futurepedia
SELECT COUNT(*) FROM tools WHERE submitter_email = 'manohar@clarifyall.com';

-- Verify logo binary data
SELECT name, logo_mime_type, LENGTH(logo_binary) as logo_size 
FROM tools 
WHERE logo_binary IS NOT NULL 
LIMIT 10;

-- Test category associations
SELECT t.name, c.name as category 
FROM tools t 
LEFT JOIN categories c ON t.category_id = c.id 
WHERE t.submitter_email = 'manohar@clarifyall.com' 
LIMIT 10;
```

## Configuration

### Scraper Settings

Edit `scrape-futurepedia.js`:
```javascript
const MAX_SCROLLS = 30; // Increase for more tools (line 38)
```

### SQL File Size

Edit `generate-futurepedia-sql.js`:
```javascript
const toolsPerFile = 500; // Tools per SQL file
```

## Features

✅ **Infinite scroll support** - Loads all tools from the page
✅ **Complete data extraction** - Name, description, logo, category, website URL
✅ **Binary logo storage** - Converts logos to MEDIUMBLOB with MIME type detection
✅ **Category mapping** - Automatic slug generation and mapping
✅ **SQL generation** - Complete schema support with proper escaping
✅ **Duplicate removal** - Handles duplicate tools by name
✅ **Data validation** - Filters incomplete tools

## Troubleshooting

### Issue: No tools scraped

**Solution**: 
1. Run `node test-selectors.js` to verify selectors are working
2. Check internet connection
3. Verify Futurepedia.io is accessible
4. Increase wait times in scraper

### Issue: Missing data fields

**Possible causes**:
- Website structure changed
- Elements not loaded yet
- Selectors need adjustment

**Solution**: 
- Run test-selectors.js to debug
- Check browser console logs
- Adjust selectors in scrape-futurepedia.js

## Next Steps

1. Run the pipeline: `node run-futurepedia-extraction.js`
2. Review generated SQL files in `sql-output/`
3. Import categories first, then tools
4. Verify data in your database

## Notes

- The scraper targets the "personal-assistant" category page
- To scrape other categories, modify the URL in `scrape-futurepedia.js`
- Logo download may take time depending on the number of tools
- SQL files use INSERT IGNORE to prevent duplicates
