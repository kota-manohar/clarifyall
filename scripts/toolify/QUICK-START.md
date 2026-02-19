# Quick Start Guide

## 1. Install Dependencies

```bash
cd scripts
npm install
```

## 2. Configure Database (Optional)

If you want category mapping to work, create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

## 3. Run Extraction

**Default (1000 tools - recommended for testing):**
```bash
npm run toolify:extract
```

**For all tools (27k+ - takes 30-60+ minutes):**
```bash
MAX_TOOLS=null npm run toolify:extract
```

This will:
- Scrape tools from Toolify.ai (default: 1000 tools, ~5-10 minutes)
- Parse and normalize the data
- Map categories
- Generate SQL INSERT scripts

## 4. Import SQL Files

```bash
# Import categories first
mysql -u your_user -p your_database < toolify/sql-output/insert-categories.sql

# Then import tools (all parts)
for file in toolify/sql-output/insert-tools-part*.sql; do
  mysql -u your_user -p your_database < "$file"
done
```

## Expected Output

- **Raw data**: `toolify/output/toolify-tools-raw.json`
- **Parsed data**: `toolify/output/toolify-tools-parsed.json`
- **SQL files**: `toolify/sql-output/insert-*.sql`
- **Summary**: `toolify/output/extraction-summary.json`

## Troubleshooting

- **Scraping takes too long**: By default, only 1000 tools are scraped (~5-10 min). For all 27k+ tools, set `MAX_TOOLS=null` (takes 30-60+ minutes)
- **Database connection fails**: Check your `.env` file or run without DB (categories will all be new)
- **No tools found**: Toolify.ai structure may have changed - check the website manually
- **Want to scrape more tools**: Set `MAX_TOOLS=5000` or any number, or `MAX_TOOLS=null` for all

