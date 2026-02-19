const scrapeToolify = require('./scrape-toolify');
const parseToolifyData = require('./parse-toolify-data');
const downloadLogos = require('./download-logos');
const mapCategories = require('./map-categories');
const generateInsertSQL = require('./generate-insert-sql');
const cleanup = require('./cleanup');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');

/**
 * Main orchestration script
 */
async function runExtraction() {
  console.log('🚀 Starting Toolify.ai extraction process...\n');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Step 0: Cleanup old files
    console.log('\n🧹 STEP 0: Cleaning up old files');
    console.log('-'.repeat(60));
    cleanup();
    console.log(`✅ Cleanup complete\n`);
    
    // Step 1: Scrape Toolify.ai
    console.log('\n📥 STEP 1: Scraping Toolify.ai');
    console.log('-'.repeat(60));
    const scrapeResult = await scrapeToolify();
    console.log(`✅ Scraped ${scrapeResult.tools.length} tools and ${scrapeResult.categories.length} categories\n`);
    
    // Step 2: Parse and normalize data (only complete tools)
    console.log('🔧 STEP 2: Parsing and normalizing data');
    console.log('-'.repeat(60));
    const parsedTools = parseToolifyData();
    console.log(`✅ Parsed ${parsedTools.length} complete tools (with all required data)\n`);
    
    // Step 3: Download logos
    console.log('📥 STEP 3: Downloading logos');
    console.log('-'.repeat(60));
    const logoResult = await downloadLogos();
    console.log(`✅ Downloaded ${logoResult.downloaded} logos (${logoResult.toolsWithLogos} tools with logos)\n`);
    
    // Step 4: Map categories
    console.log('🗺️  STEP 4: Mapping categories');
    console.log('-'.repeat(60));
    const categoryResult = await mapCategories();
    console.log(`✅ Mapped ${categoryResult.mapping.length} categories (${categoryResult.newCategories.length} new)\n`);
    
    // Step 5: Generate SQL scripts
    console.log('📝 STEP 5: Generating SQL INSERT scripts');
    console.log('-'.repeat(60));
    const summary = generateInsertSQL();
    console.log(`✅ Generated SQL scripts for ${summary.valid_tools} tools\n`);
    
    // Final summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('✅ EXTRACTION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Total tools scraped: ${scrapeResult.tools.length}`);
    console.log(`   - Complete tools (with all data): ${summary.valid_tools}`);
    console.log(`   - Logos downloaded: ${logoResult.downloaded}`);
    console.log(`   - Total categories: ${summary.total_categories}`);
    console.log(`   - New categories: ${summary.new_categories}`);
    console.log(`   - SQL files created: ${summary.sql_files.tools.length + 1}`);
    console.log(`   - Processing time: ${duration} seconds`);
    console.log(`\n📁 Output files:`);
    console.log(`   - Raw data: ${path.join(OUTPUT_DIR, 'toolify-tools-raw.json')}`);
    console.log(`   - Parsed data: ${path.join(OUTPUT_DIR, 'toolify-tools-parsed.json')}`);
    console.log(`   - Category mapping: ${path.join(OUTPUT_DIR, 'category-mapping.json')}`);
    console.log(`   - Logo mapping: ${path.join(OUTPUT_DIR, 'logo-mapping.json')}`);
    console.log(`   - SQL files: ${path.join(__dirname, 'sql-output')}`);
    console.log(`   - Logos folder: ${path.join(__dirname, 'logos')}`);
    console.log(`   - Summary: ${path.join(OUTPUT_DIR, 'extraction-summary.json')}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Review the SQL files in the sql-output directory`);
    console.log(`   2. Copy logos from scripts/logos/ to your server's public/logos/ directory`);
    console.log(`   3. Run insert-categories.sql first to create new categories`);
    console.log(`   4. Then run insert-tools-part*.sql files to insert tools`);
    console.log(`   5. Verify the data in your database`);
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ EXTRACTION FAILED!');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runExtraction()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = runExtraction;

