# Filmora Gemini AI Baby Photo Prompts Scraper

This script scrapes Gemini AI baby photo prompts from Filmora and generates SQL INSERT statements for the `prompt_categories` and `prompts` tables.

## URL
- **Source**: https://filmora.wondershare.com/ai-prompt/gemini-ai-baby-photo-prompt.html

## Database Tables

### `prompt_categories`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(100), NOT NULL)
- `description` (TEXT)
- `icon` (VARCHAR(50), DEFAULT '🎨')
- `parent_id` (INT, DEFAULT NULL)
- `order_index` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `prompts`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `prompt_text` (TEXT, NOT NULL)
- `prompt_type` (ENUM: 'IMAGE', 'VIDEO', 'IMAGE_EDIT', 'VIDEO_EDIT', DEFAULT 'IMAGE')
- `category_id` (INT, FOREIGN KEY to prompt_categories)
- `tool_id` (INT, FOREIGN KEY to tools, NULL)
- `difficulty` (ENUM: 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', DEFAULT 'BEGINNER')
- `tags` (JSON)
- `example_image_url` (VARCHAR(500))
- `example_video_url` (VARCHAR(500))
- `parameters` (JSON)
- `upvotes` (INT, DEFAULT 0)
- `downvotes` (INT, DEFAULT 0)
- `views` (INT, DEFAULT 0)
- `status` (ENUM: 'PENDING', 'APPROVED', 'REJECTED', DEFAULT 'PENDING')
- `submitted_by` (INT, FOREIGN KEY to users, NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Installation

1. Install dependencies:
```bash
npm install puppeteer fs-extra
```

## Usage

### Step 1: Scrape the data
```bash
node scrape-filmora-prompts.js
# or
npm run scrape
```

This will:
- Scrape prompts and categories from the Filmora page
- Save raw data to `output/filmora-prompts-raw.json`
- Save categories to `output/filmora-categories.json`

### Step 2: Download images
```bash
node download-images.js
# or
npm run download-images
```

This will:
- Download all example images from `example_image_url`
- Save images to `../logos/` directory
- Update `example_image_url` to point to local URLs (e.g., `https://clarifyall.com/logos/category-title.png`)

### Step 3: Generate SQL files
```bash
node generate-sql.js
# or
npm run generate-sql
```

This will:
- Read the scraped data (with updated image URLs)
- Generate SQL INSERT statements for `prompt_categories`
- Generate SQL INSERT statements for `prompts`
- Save SQL files to `sql-output/` directory

### Step 4: Import into database

1. First, insert categories:
```sql
SOURCE sql-output/insert-prompt-categories.sql;
```

2. Then, insert prompts:
```sql
SOURCE sql-output/insert-prompts.sql;
```

Or run them directly:
```bash
mysql -u username -p database_name < sql-output/insert-prompt-categories.sql
mysql -u username -p database_name < sql-output/insert-prompts.sql
```

Or run all steps at once:
```bash
npm run all
```

This will run: scrape → download images → generate SQL

## Output Files

- `output/filmora-prompts-raw.json` - Raw scraped data (categories with prompts, updated with local image URLs)
- `output/filmora-categories.json` - Categories only
- `../logos/` - Downloaded example images (e.g., `baby-photo-newborn-sleeping.png`)
- `sql-output/insert-prompt-categories.sql` - SQL INSERT for categories
- `sql-output/insert-prompts.sql` - SQL INSERT for prompts

## Notes

- The script extracts baby photo prompts organized by categories
- Each category contains multiple prompts with titles, descriptions, and prompt text
- Example images are extracted when available
- Tags are automatically extracted from prompt text and "Style Keywords" sections
- All prompts are set to `status = 'APPROVED'` and `prompt_type = 'IMAGE'` by default
- Category IDs are resolved using subqueries in the SQL, so categories must be inserted first

## Troubleshooting

If the scraper doesn't extract data correctly:
1. Check if the page structure has changed
2. Verify the URL is still accessible
3. Review the browser console for errors
4. Adjust the selectors in `scrape-filmora-prompts.js` if needed

