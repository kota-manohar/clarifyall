const scrapeFuturepedia = require('./scrape-futurepedia');
const parseFuturepediaData = require('./parse-futurepedia-data');
const mapFuturepediaCategories = require('./map-futurepedia-categories');
const downloadFuturepediaLogos = require('./download-futurepedia-logos');
const generateFuturepediaSQL = require('./generate-futurepedia-sql');

/**
 * Run the complete Futurepedia extraction pipeline
 */
async function runFuturepediaExtraction() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Futurepedia.io Data Extraction Pipeline             ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    const startTime = Date.now();

    try {
        // Step 1: Scrape tools from Futurepedia.io
        console.log('📍 STEP 1: Scraping Futurepedia.io...');
        console.log('─'.repeat(60));
        await scrapeFuturepedia();
        console.log('');

        // Step 2: Parse and normalize data
        console.log('📍 STEP 2: Parsing and normalizing data...');
        console.log('─'.repeat(60));
        const parsedTools = parseFuturepediaData();
        console.log('');

        // Step 3: Map categories
        console.log('📍 STEP 3: Mapping categories...');
        console.log('─'.repeat(60));
        const { categoryMapping, newCategories } = mapFuturepediaCategories();
        console.log('');

        // Step 4: Download logos
        console.log('📍 STEP 4: Downloading logos...');
        console.log('─'.repeat(60));
        const { tools, stats } = await downloadFuturepediaLogos();
        console.log('');

        // Step 5: Generate SQL scripts
        console.log('📍 STEP 5: Generating SQL scripts...');
        console.log('─'.repeat(60));
        const sqlResult = generateFuturepediaSQL();
        console.log('');

        // Summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║   EXTRACTION COMPLETE - SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('📊 Data Statistics:');
        console.log(`   • Total tools scraped: ${parsedTools.length}`);
        console.log(`   • Valid tools (complete data): ${sqlResult.validTools}`);
        console.log(`   • Categories found: ${newCategories.length}`);
        console.log('');
        console.log('🖼️  Logo Download:');
        console.log(`   • Successfully downloaded: ${stats.success}`);
        console.log(`   • Failed: ${stats.failed}`);
        console.log(`   • Success rate: ${((stats.success / stats.total) * 100).toFixed(2)}%`);
        console.log('');
        console.log('📝 SQL Files Generated:');
        console.log(`   • Categories: insert-futurepedia-categories.sql`);
        console.log(`   • Tools: ${sqlResult.sqlFiles.length} file(s)`);
        sqlResult.sqlFiles.forEach(file => {
            console.log(`     - ${file}`);
        });
        console.log('');
        console.log(`⏱️  Total execution time: ${duration} minutes`);
        console.log('');
        console.log('✅ Pipeline completed successfully!');
        console.log('');
        console.log('📂 Output files:');
        console.log('   • output/futurepedia-tools-raw.json');
        console.log('   • output/futurepedia-tools-parsed.json');
        console.log('   • output/futurepedia-category-mapping.json');
        console.log('   • output/futurepedia-new-categories.json');
        console.log('   • output/futurepedia-tools-with-logos.json');
        console.log('   • output/futurepedia-logos/ (logo files)');
        console.log('   • sql-output/insert-futurepedia-categories.sql');
        console.log('   • sql-output/insert-tools-futurepedia-part*.sql');
        console.log('');
        console.log('🚀 Next Steps:');
        console.log('   1. Review the generated SQL files in sql-output/');
        console.log('   2. Import categories first: insert-futurepedia-categories.sql');
        console.log('   3. Then import tools: insert-tools-futurepedia-part*.sql');
        console.log('   4. Verify the data in your database');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('╔════════════════════════════════════════════════════════╗');
        console.error('║   EXTRACTION FAILED                                    ║');
        console.error('╚════════════════════════════════════════════════════════╝');
        console.error('');
        console.error('❌ Error:', error.message);
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
        console.error('');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runFuturepediaExtraction();
}

module.exports = runFuturepediaExtraction;
