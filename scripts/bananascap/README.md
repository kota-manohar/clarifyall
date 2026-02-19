# BananaPrompts.xyz Scraper

This scraper extracts image prompts from [bananaprompts.xyz/explore](https://www.bananaprompts.xyz/explore).

## Features

- ✅ Extracts all non-premium prompt cards
- ✅ Skips premium prompts automatically
- ✅ Downloads associated images
- ✅ Generates SQL INSERT scripts for database import
- ✅ Organizes prompts by category

## Installation

```bash
cd scripts/bananascap
npm install
```

## Usage

### Run all steps (scrape → download images → generate SQL)

```bash
npm run all
```

### Run individual steps

```bash
# Step 1: Scrape prompts
npm run scrape

# Step 2: Download images
npm run download-images

# Step 3: Generate SQL
npm run generate-sql
```

## Output Files

### JSON Data
- `output/banana-prompts-raw.json` - Complete scraped data with categories and prompts
- `output/banana-categories.json` - Categories only

### SQL Scripts
- `sql-output/insert-prompt-categories.sql` - SQL to insert categories
- `sql-output/insert-prompts.sql` - SQL to insert prompts

### Images
- Images are downloaded to `../logos/` directory
- Filenames: `banana-{category}-{title}.{ext}`

## How It Works

1. **Scraping**: 
   - Loads the explore page
   - Finds all prompt cards
   - Filters out premium cards
   - Opens each non-premium card to extract details
   - Saves data to JSON

2. **Image Download**:
   - Reads scraped data
   - Downloads all example images
   - Updates image URLs to local paths

3. **SQL Generation**:
   - Reads scraped data
   - Generates INSERT statements for categories and prompts
   - Handles SQL escaping and formatting

## Notes

- Premium prompts are automatically skipped
- The scraper waits between requests to avoid overwhelming the server
- Images are saved with descriptive filenames
- SQL scripts use subqueries to link prompts to categories

## Troubleshooting

If the scraper doesn't find cards correctly, you may need to update the selectors in `scrape-banana-prompts.js` to match the actual website structure.



