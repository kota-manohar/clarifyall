const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'futurepedia-tools-parsed.json');
const CATEGORY_MAPPING_FILE = path.join(OUTPUT_DIR, 'futurepedia-category-mapping.json');
const NEW_CATEGORIES_FILE = path.join(OUTPUT_DIR, 'futurepedia-new-categories.json');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');

fs.ensureDirSync(SQL_OUTPUT_DIR);

/**
 * Generate slug from category name
 */
function generateSlug(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, 255); // Limit to 255 chars
}

/**
 * Escape SQL string
 */
function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

/**
 * Map futurepedia categories to database categories
 */
function mapfuturepediaCategories() {
    console.log('🗂️  Mapping futurepedia categories...');

    if (!fs.existsSync(PARSED_DATA_FILE)) {
        throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}. Please run parse-futurepedia-data.js first.`);
    }

    const parsedTools = fs.readJsonSync(PARSED_DATA_FILE);
    console.log(`📊 Processing ${parsedTools.length} tools...`);

    // Extract unique categories
    const categorySet = new Set();
    parsedTools.forEach(tool => {
        if (tool.category && tool.category.trim()) {
            categorySet.add(tool.category.trim());
        }
    });

    const categories = Array.from(categorySet).sort();
    console.log(`📂 Found ${categories.length} unique categories`);

    // Create category mapping
    // Note: In a real scenario, you might want to map these to existing categories in your database
    // For now, we'll create new categories for all futurepedia categories
    const categoryMapping = [];
    const newCategories = [];

    categories.forEach(categoryName => {
        const slug = generateSlug(categoryName);

        // Create a description based on the category name
        const description = `AI tools for ${categoryName.toLowerCase()}`;

        const categoryData = {
            futurepedia_name: categoryName,
            name: categoryName,
            slug: slug,
            description: description,
            is_new: true // Mark as new since we don't have existing DB to check against
        };

        categoryMapping.push(categoryData);
        newCategories.push({
            name: categoryName,
            slug: slug,
            description: description
        });
    });

    // Save category mapping
    fs.writeJsonSync(CATEGORY_MAPPING_FILE, categoryMapping, { spaces: 2 });
    console.log(`💾 Saved category mapping to ${CATEGORY_MAPPING_FILE}`);

    // Save new categories
    fs.writeJsonSync(NEW_CATEGORIES_FILE, newCategories, { spaces: 2 });
    console.log(`💾 Saved new categories to ${NEW_CATEGORIES_FILE}`);

    // Generate SQL for categories
    console.log('📝 Generating category SQL...');
    const categorySql = [];
    categorySql.push('-- ============================================');
    categorySql.push('-- INSERT CATEGORIES FROM futurepedia.IO');
    categorySql.push(`-- Total categories: ${newCategories.length}`);
    categorySql.push('-- ============================================');
    categorySql.push('');
    categorySql.push('-- Insert new categories');
    categorySql.push('INSERT IGNORE INTO categories (name, slug, description) VALUES');

    const categoryValues = newCategories.map(cat => {
        return `(${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description)})`;
    });

    if (categoryValues.length > 0) {
        categorySql.push(categoryValues.join(',\n') + ';');
    } else {
        categorySql.push('-- No new categories to insert');
    }

    // Save category SQL
    const categorySqlFile = path.join(SQL_OUTPUT_DIR, 'insert-futurepedia-categories.sql');
    fs.writeFileSync(categorySqlFile, categorySql.join('\n'), 'utf8');
    console.log(`💾 Saved category SQL to ${categorySqlFile}`);

    console.log('\n✅ Category mapping complete!');
    console.log(`   - Total categories: ${categories.length}`);
    console.log(`   - New categories: ${newCategories.length}`);

    return { categoryMapping, newCategories };
}

// Run if called directly
if (require.main === module) {
    try {
        mapfuturepediaCategories();
        console.log('✅ Category mapping completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Category mapping failed:', error);
        process.exit(1);
    }
}

module.exports = mapfuturepediaCategories;
