# Toolify.ai Scraper

This folder contains scripts to extract all AI tools from Toolify.ai and generate SQL INSERT scripts for your database.

**Note:** This scraper is now located in the `toolify/` folder. Run commands from the `scripts/` directory using npm scripts with the `toolify:` prefix.

## Overview

The scraper extracts all 27,178+ tools from Toolify.ai, creates new categories as needed, and generates SQL INSERT scripts ready to import into your database.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MySQL Database** (for category mapping)
3. **Internet Connection** (for scraping)

## Installation

1. Navigate to the scripts directory:
```bash
cd scripts
```

2. Install dependencies (if not already installed):
```bash
npm install
```

**Note:** Dependencies are shared across all scrapers in the parent `scripts/` directory.

3. (Optional) Create a `.env` file for database configuration:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u530425252_kyc
```

## Usage

### Option 1: Run Complete Extraction (Recommended)

Run all steps in sequence:
```bash
# From scripts/ directory
npm run toolify:extract
# or
node toolify/run-extraction.js
```

This will:
1. Scrape all tools from Toolify.ai
2. Parse and normalize the data
3. Map categories (check existing, create new)
4. Generate SQL INSERT scripts

### Option 2: Run Steps Individually

You can also run each step separately:

```bash
# Step 1: Scrape Toolify.ai
npm run toolify:scrape
# or
node toolify/scrape-toolify.js

# Step 2: Parse and normalize data
npm run toolify:parse
# or
node toolify/parse-toolify-data.js

# Step 3: Map categories
npm run toolify:map-categories
# or
node toolify/map-categories.js

# Step 4: Generate SQL scripts
npm run toolify:generate-sql
# or
node toolify/generate-insert-sql.js
```

## Output Files

### Intermediate Files (in `toolify/output/` directory)

- `toolify-tools-raw.json` - Raw scraped data
- `toolify-tools-parsed.json` - Parsed and normalized tools
- `toolify-categories.json` - Extracted categories
- `category-mapping.json` - Category mapping (Toolify → Database)
- `new-categories.json` - New categories to create
- `extraction-summary.json` - Summary report

### SQL Files (in `toolify/sql-output/` directory)

- `insert-categories.sql` - SQL to insert new categories
- `insert-tools-part1.sql` - Tools INSERT (part 1)
- `insert-tools-part2.sql` - Tools INSERT (part 2)
- ... (additional parts as needed)

## Database Import

1. **First, import categories:**
```bash
mysql -u your_user -p your_database < sql-output/insert-categories.sql
```

2. **Then, import tools (run all parts):**
```bash
mysql -u your_user -p your_database < sql-output/insert-tools-part1.sql
mysql -u your_user -p your_database < sql-output/insert-tools-part2.sql
# ... continue for all parts
```

Or import all at once:
```bash
for file in sql-output/insert-tools-part*.sql; do
  mysql -u your_user -p your_database < "$file"
done
```

## Configuration

### Database Connection

Update database credentials in `map-categories.js` or use environment variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u530425252_kyc
```

### Scraping Settings

You can modify scraping behavior using environment variables or by editing `scrape-toolify.js`:

**Environment Variables:**
```env
MAX_TOOLS=1000        # Limit number of tools to scrape (default: 1000, set to null for all)
MAX_PAGES=50          # Maximum pages to scrape (default: 50)
```

**In scrape-toolify.js:**
- `MAX_TOOLS` - Limit number of tools to scrape (default: 1000, set to null for all 27k+)
- `MAX_PAGES` - Maximum pages to scrape (default: 50)
- `waitForTimeout` - Delay between requests (rate limiting)
- `headless` - Run browser in headless mode

**Example: Scrape only 1000 tools (default):**
```bash
npm run toolify:scrape
# or
node toolify/scrape-toolify.js
```

**Example: Scrape all tools:**
```bash
MAX_TOOLS=null npm run toolify:scrape
# or
MAX_TOOLS=null node toolify/scrape-toolify.js
# or edit toolify/scrape-toolify.js and set MAX_TOOLS = null
```

## Data Structure

### Tools Table Fields

- `name` - Tool name (max 200 chars)
- `description` - Short description (max 500 chars)
- `full_description` - Full description (max 2000 chars)
- `website_url` - Tool website URL
- `logo_url` - Tool logo/image URL
- `category_id` - Foreign key to categories table
- `pricing_model` - FREE, FREEMIUM, FREE_TRIAL, OPEN_SOURCE, or PAID
- `platforms` - JSON array of platforms
- `feature_tags` - JSON array of feature tags
- `view_count` - Default 0
- `save_count` - Default 0
- `status` - APPROVED (default)

### Categories Table Fields

- `name` - Category name
- `slug` - URL-friendly slug
- `description` - Category description
- `icon` - Emoji icon (default: 🤖)

## Troubleshooting

### Scraping Issues

- **Rate Limiting**: Increase delays between requests in `scrape-toolify.js`
- **Timeout Errors**: Increase timeout values in Puppeteer
- **No Tools Found**: Check if Toolify.ai structure has changed

### Database Issues

- **Connection Failed**: Verify database credentials in `.env` or `map-categories.js`
- **Category Mapping Errors**: Check if categories table exists and has correct structure

### Data Quality Issues

- **Duplicate Tools**: The parser automatically removes duplicates by name/URL
- **Invalid URLs**: Invalid URLs are set to NULL
- **Missing Data**: Missing fields are set to NULL or defaults

## Notes

- The scraper uses `INSERT IGNORE` to prevent duplicate errors
- Large datasets are split into multiple SQL files (1000 tools per file)
- Category IDs for new categories are resolved using subqueries in SQL
- All data is validated and sanitized before SQL generation

## License

This scraper is for educational and personal use. Please respect Toolify.ai's terms of service and robots.txt when scraping.

