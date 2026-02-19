# Threads Gemini AI Prompts Scraper

This script scrapes Gemini AI prompts from a Threads profile and generates SQL INSERT statements for the `prompt_categories` and `prompts` tables.

## URL
- **Source**: https://www.threads.com/@fit_saahil

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
cd threadscap
npm install puppeteer fs-extra
```

## Usage

### Step 1: Scrape the data
```bash
node scrape-threads-prompts.js
# or
npm run scrape
```

This will:
- Scrape prompts from the Threads profile
- Save raw data to `output/threads-prompts-raw.json`
- Save categories to `output/threads-categories.json`

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

### Step 3: Generate SQL
```bash
node generate-sql.js
# or
npm run generate-sql
```

This will:
- Generate SQL INSERT statements for categories
- Generate SQL INSERT statements for prompts
- Save to `sql-output/insert-prompt-categories.sql` and `sql-output/insert-prompts.sql`

### Run all steps
```bash
npm run all
```

## Output Files

- `output/threads-prompts-raw.json` - Raw scraped data with all prompts and categories
- `output/threads-categories.json` - Categories only
- `sql-output/insert-prompt-categories.sql` - SQL for inserting categories
- `sql-output/insert-prompts.sql` - SQL for inserting prompts

## Notes

- The scraper automatically scrolls to load all posts from the Threads profile
- It filters posts to only include those containing Gemini/AI prompts
- Images are downloaded to the shared `logos` directory
- Tags are extracted from hashtags in the posts
- Categories are determined from hashtags or default to "Gemini Prompts"

