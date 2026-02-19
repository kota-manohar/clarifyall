# Scrapers Directory

This directory contains scraping scripts organized by website source. Each website has its own folder with website-specific scripts, while common files are kept in the root directory.

## Structure

```
scripts/
├── toolify/              # Toolify.ai scraper
│   ├── scrape-toolify.js
│   ├── parse-toolify-data.js
│   ├── run-extraction.js
│   ├── output/
│   └── sql-output/
├── logos/                # Common logos directory (shared across all scrapers)
├── node_modules/         # Common dependencies
├── package.json         # Common package configuration
└── README.md            # This file
```

## Common Files

These files are shared across all scrapers:

- `package.json` - Common dependencies and scripts
- `node_modules/` - Common dependencies
- `logos/` - Shared logos directory (can be used by all scrapers)

## Website-Specific Folders

Each website scraper has its own folder containing:

- Scraping scripts
- Parsing scripts
- Data processing scripts
- Output directories
- SQL generation scripts
- Documentation

## Available Scrapers

### Toolify.ai

Located in `toolify/` folder. See [toolify/README-SCRAPING.md](toolify/README-SCRAPING.md) for details.

**Quick Start:**
```bash
cd scripts
npm install
npm run toolify:extract
```

**Available Commands:**
- `npm run toolify:scrape` - Scrape tools from Toolify.ai
- `npm run toolify:parse` - Parse scraped data
- `npm run toolify:download-logos` - Download tool logos
- `npm run toolify:map-categories` - Map categories to database
- `npm run toolify:generate-sql` - Generate SQL INSERT scripts
- `npm run toolify:validate-sql` - Validate SQL files
- `npm run toolify:extract` - Run complete extraction workflow

## Adding New Scrapers

To add a new website scraper:

1. Create a new folder in `scripts/` (e.g., `scripts/newwebsite/`)
2. Add website-specific scripts to that folder
3. Update `package.json` to add new scripts with prefix (e.g., `newwebsite:scrape`)
4. Create a README in the new folder documenting the scraper
5. Use common `logos/` directory for shared logos, or create website-specific logo folder if needed

## Installation

```bash
cd scripts
npm install
```

## Dependencies

Common dependencies (installed once for all scrapers):
- `puppeteer` - Browser automation
- `cheerio` - HTML parsing
- `axios` - HTTP requests
- `mysql2` - Database connection
- `fs-extra` - File system utilities
- `dotenv` - Environment variables

