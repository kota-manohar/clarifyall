const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'futurepedia-tools-parsed.json');
const CATEGORY_MAPPING_FILE = path.join(OUTPUT_DIR, 'futurepedia-category-mapping.json');

fs.ensureDirSync(SQL_OUTPUT_DIR);

/**
 * Escape SQL string
 */
function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

/**
 * Convert array to JSON string for SQL
 */
function arrayToJsonSql(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
        return 'NULL';
    }
    return escapeSql(JSON.stringify(arr));
}

/**
 * Convert buffer to HEX string for SQL BLOB
 */
function bufferToHex(base64String) {
    if (!base64String) return 'NULL';
    try {
        const buffer = Buffer.from(base64String, 'base64');
        return "0x" + buffer.toString('hex');
    } catch (e) {
        return 'NULL';
    }
}

/**
 * Generate slug from tool name
 */
function generateSlug(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 200);
}

/**
 * Make slug unique by appending number if needed
 */
function makeSlugUnique(slug, existingSlugs, index = 0) {
    const uniqueSlug = index === 0 ? slug : `${slug}-${index}`;
    if (!existingSlugs.has(uniqueSlug)) {
        existingSlugs.add(uniqueSlug);
        return uniqueSlug;
    }
    return makeSlugUnique(slug, existingSlugs, index + 1);
}

/**
 * Generate SQL INSERT scripts for futurepedia
 */
function generatefuturepediaSQL() {
    console.log('📝 Generating SQL INSERT scripts for futurepedia...');

    if (!fs.existsSync(PARSED_DATA_FILE)) {
        throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}. Please run parse-futurepedia-data.js first.`);
    }

    const tools = fs.readJsonSync(PARSED_DATA_FILE);
    const categoryMapping = fs.existsSync(CATEGORY_MAPPING_FILE)
        ? fs.readJsonSync(CATEGORY_MAPPING_FILE)
        : [];

    console.log(`📊 Processing ${tools.length} tools...`);

    // Create category mapping lookup
    const categoryMap = new Map();
    categoryMapping.forEach(mapping => {
        categoryMap.set(mapping.futurepedia_name, mapping);
    });

    // Track slugs to ensure uniqueness
    const existingSlugs = new Set();

    // Filter valid tools
    const validTools = tools.filter(tool => {
        const websiteUrl = tool.website_url;
        if (!websiteUrl || websiteUrl === 'NULL' || (typeof websiteUrl === 'string' && websiteUrl.trim() === '')) {
            console.log(`⚠️  Skipping tool "${tool.name}" - missing website_url`);
            return false;
        }
        return true;
    });

    console.log(`✅ ${validTools.length} valid tools to insert`);

    // Split into multiple files (500 tools per file)
    const toolsPerFile = 500;
    let fileIndex = 1;
    let currentFileTools = [];

    const toolSqlFiles = [];

    validTools.forEach(tool => {
        // Generate unique slug
        const baseSlug = generateSlug(tool.name);
        if (!baseSlug) {
            console.log(`⚠️  Skipping tool "${tool.name}\" - cannot generate slug`);
            return;
        }
        const slug = makeSlugUnique(baseSlug, existingSlugs);

        // Get category ID from mapping
        let categoryId = 'NULL';
        const categoryName = tool.category;

        if (categoryName) {
            const mapping = categoryMap.get(categoryName);
            if (mapping && mapping.slug) {
                categoryId = `(SELECT id FROM categories WHERE slug = ${escapeSql(mapping.slug)} LIMIT 1)`;
            } else {
                // Fallback: try to find by name
                const categorySlug = generateSlug(categoryName);
                categoryId = `(SELECT id FROM categories WHERE slug = ${escapeSql(categorySlug)} LIMIT 1)`;
            }
        }

        // Prepare descriptions
        let shortDescription = tool.description || tool.full_description || 'AI tool from futurepedia.io';
        if (shortDescription.length > 500) {
            shortDescription = shortDescription.substring(0, 497) + '...';
        }

        const fullDescription = tool.full_description || tool.description || 'AI tool from futurepedia.io';

        // Map pricing model
        let pricingModel = tool.pricing_model || 'FREE';
        if (!['FREE', 'FREEMIUM', 'FREE_TRIAL', 'PAID'].includes(pricingModel)) {
            pricingModel = 'FREE';
        }

        // Prepare JSON fields
        const platformsJson = arrayToJsonSql(tool.platforms);
        const tagsJson = arrayToJsonSql(tool.feature_tags);

        // Logo URL only (no binary data for Futurepedia)
        const logoUrl = tool.logo_url ? escapeSql(tool.logo_url) : 'NULL';

        // Generate SEO meta fields
        const metaTitle = escapeSql(`${tool.name} - AI Tool | ClarifyAll`);
        const metaDescription = escapeSql(shortDescription);
        const ogTitle = escapeSql(tool.name);
        const ogDescription = escapeSql(shortDescription);
        const twitterTitle = escapeSql(tool.name);
        const twitterDescription = escapeSql(shortDescription);

        // Set default submitter email
        const submitterEmail = 'manohar@clarifyall.com';

        const toolValue = {
            name: escapeSql(tool.name),
            slug: escapeSql(slug),
            description: escapeSql(tool.description),
            website_url: escapeSql(tool.website_url),
            short_description: escapeSql(shortDescription),
            full_description: escapeSql(fullDescription),
            meta_title: metaTitle,
            meta_description: metaDescription,
            meta_keywords: 'NULL',
            og_title: ogTitle,
            og_description: ogDescription,
            og_image: logoUrl,
            twitter_title: twitterTitle,
            twitter_description: twitterDescription,
            canonical_url: 'NULL',
            structured_data: 'NULL',
            logo_url: logoUrl,
            category_id: categoryId,
            pricing_model: escapeSql(pricingModel),
            status: "'APPROVED'",
            submitter_email: escapeSql(submitterEmail),
            view_count: 0,
            save_count: 0,
            screenshots: 'NULL',
            video_url: 'NULL',
            social_links: 'NULL',
            features: 'NULL',
            pricing_details: 'NULL',
            platforms: platformsJson,
            feature_tags: tagsJson,
            rating: '0.00',
            review_count: 0,
            userId: 'NULL',
            logo_binary: 'NULL',
            logo_mime_type: 'NULL'
        };

        currentFileTools.push(toolValue);

        // Write to file if we've reached the limit
        if (currentFileTools.length >= toolsPerFile) {
            writeToolSqlFile(fileIndex, currentFileTools);
            toolSqlFiles.push(`insert-tools-futurepedia-part${fileIndex}.sql`);
            fileIndex++;
            currentFileTools = [];
        }
    });

    // Write remaining tools
    if (currentFileTools.length > 0) {
        writeToolSqlFile(fileIndex, currentFileTools);
        toolSqlFiles.push(`insert-tools-futurepedia-part${fileIndex}.sql`);
    }

    function writeToolSqlFile(index, tools) {
        const sql = [];
        sql.push('-- ============================================');
        sql.push(`-- INSERT TOOLS FROM futurepedia.IO - PART ${index}`);
        sql.push(`-- Total tools in this file: ${tools.length}`);
        sql.push('-- ============================================');
        sql.push('');
        sql.push('INSERT IGNORE INTO tools (');
        sql.push('  name, slug, description, website_url, short_description, full_description,');
        sql.push('  meta_title, meta_description, meta_keywords, og_title, og_description, og_image,');
        sql.push('  twitter_title, twitter_description, canonical_url, structured_data,');
        sql.push('  logo_url, category_id, pricing_model, status, submitter_email,');
        sql.push('  view_count, save_count, screenshots, video_url, social_links,');
        sql.push('  features, pricing_details, platforms, feature_tags,');
        sql.push('  rating, review_count, userId, logo_binary, logo_mime_type');
        sql.push(') VALUES');

        const values = tools.map(tool => {
            return `(
  ${tool.name}, ${tool.slug}, ${tool.description}, ${tool.website_url}, ${tool.short_description}, ${tool.full_description},
  ${tool.meta_title}, ${tool.meta_description}, ${tool.meta_keywords}, ${tool.og_title}, ${tool.og_description}, ${tool.og_image},
  ${tool.twitter_title}, ${tool.twitter_description}, ${tool.canonical_url}, ${tool.structured_data},
  ${tool.logo_url}, ${tool.category_id}, ${tool.pricing_model}, ${tool.status}, ${tool.submitter_email},
  ${tool.view_count}, ${tool.save_count}, ${tool.screenshots}, ${tool.video_url}, ${tool.social_links},
  ${tool.features}, ${tool.pricing_details}, ${tool.platforms}, ${tool.feature_tags},
  ${tool.rating}, ${tool.review_count}, ${tool.userId}, ${tool.logo_binary}, ${tool.logo_mime_type}
)`;
        });

        sql.push(values.join(',\n') + ';');

        const filename = path.join(SQL_OUTPUT_DIR, `insert-tools-futurepedia-part${index}.sql`);
        fs.writeFileSync(filename, sql.join('\n'), 'utf8');
        console.log(`💾 Saved ${tools.length} tools to ${filename}`);
    }

    console.log('\n✅ SQL generation complete!');
    console.log(`   - Total tools: ${tools.length}`);
    console.log(`   - Valid tools: ${validTools.length}`);
    console.log(`   - SQL files created: ${toolSqlFiles.length}`);
    console.log(`   - Output directory: ${SQL_OUTPUT_DIR}`);

    return { totalTools: tools.length, validTools: validTools.length, sqlFiles: toolSqlFiles };
}

// Run if called directly
if (require.main === module) {
    try {
        generatefuturepediaSQL();
        console.log('✅ SQL generation completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ SQL generation failed:', error);
        process.exit(1);
    }
}

module.exports = generatefuturepediaSQL;
