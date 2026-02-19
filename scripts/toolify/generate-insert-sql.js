const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'toolify-tools-parsed.json');
const CATEGORY_MAPPING_FILE = path.join(OUTPUT_DIR, 'category-mapping.json');
const NEW_CATEGORIES_FILE = path.join(OUTPUT_DIR, 'new-categories.json');
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'extraction-summary.json');

// Ensure SQL output directory exists
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
 * Generate slug from tool name
 */
function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 200); // Limit to 200 chars
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
 * Generate SQL INSERT scripts
 */
function generateInsertSQL() {
  console.log('📝 Generating SQL INSERT scripts...');
  
  if (!fs.existsSync(PARSED_DATA_FILE)) {
    throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}`);
  }
  
  const parsedTools = fs.readJsonSync(PARSED_DATA_FILE);
  const categoryMapping = fs.existsSync(CATEGORY_MAPPING_FILE)
    ? fs.readJsonSync(CATEGORY_MAPPING_FILE)
    : [];
  const newCategories = fs.existsSync(NEW_CATEGORIES_FILE)
    ? fs.readJsonSync(NEW_CATEGORIES_FILE)
    : [];
  
  // Create category mapping lookup
  const categoryMap = new Map();
  categoryMapping.forEach(mapping => {
    categoryMap.set(mapping.toolify_name, mapping);
  });
  
  // Generate category INSERT statements
  console.log('📂 Generating category INSERT statements...');
  const categorySql = [];
  categorySql.push('-- ============================================');
  categorySql.push('-- INSERT CATEGORIES FROM TOOLIFY.AI');
  categorySql.push('-- ============================================');
  categorySql.push('');
  categorySql.push('-- New categories to insert');
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
  const categorySqlFile = path.join(SQL_OUTPUT_DIR, 'insert-categories.sql');
  fs.writeFileSync(categorySqlFile, categorySql.join('\n'), 'utf8');
  console.log(`💾 Saved category SQL to ${categorySqlFile}`);
  
  // Generate tool INSERT statements
  console.log('🛠️  Generating tool INSERT statements...');
  
  // Group tools by category for better organization
  const toolsByCategory = new Map();
  parsedTools.forEach(tool => {
    const category = tool.category || 'Uncategorized';
    if (!toolsByCategory.has(category)) {
      toolsByCategory.set(category, []);
    }
    toolsByCategory.get(category).push(tool);
  });
  
  // Track slugs to ensure uniqueness
  const existingSlugs = new Set();
  
  // Filter out tools without website_url (required field)
  const validTools = [];
  toolsByCategory.forEach((tools, categoryName) => {
    tools.forEach(tool => {
      // Skip tools without website_url (required field)
      const websiteUrl = tool.website_url;
      if (!websiteUrl || websiteUrl === 'NULL' || (typeof websiteUrl === 'string' && websiteUrl.trim() === '')) {
        console.log(`⚠️  Skipping tool "${tool.name}" - missing website_url`);
        return;
      }
      validTools.push({ tool, categoryName });
    });
  });
  
  console.log(`📊 Filtered ${parsedTools.length - validTools.length} tools without website_url`);
  console.log(`✅ ${validTools.length} valid tools to insert`);
  
  // Split into multiple files (1000 tools per file)
  const toolsPerFile = 1000;
  let fileIndex = 1;
  let currentFileTools = [];
  let totalInserted = 0;
  
  const toolSqlFiles = [];
  
  // Track category mapping stats
  const categoryMappingStats = {
    found: 0,
    notFound: 0,
    newCategories: 0,
    existingCategories: 0
  };
  
  validTools.forEach(({ tool, categoryName }) => {
    // Generate unique slug
    const baseSlug = generateSlug(tool.name);
    if (!baseSlug) {
      console.log(`⚠️  Skipping tool "${tool.name}" - cannot generate slug`);
      return;
    }
    const slug = makeSlugUnique(baseSlug, existingSlugs);
    
    // Get category ID from mapping
    // Try exact match first
    let mapping = categoryMap.get(categoryName);
    
    // If not found, try case-insensitive match
    if (!mapping && categoryName) {
      for (const [key, value] of categoryMap.entries()) {
        if (key.toLowerCase().trim() === categoryName.toLowerCase().trim()) {
          mapping = value;
          break;
        }
      }
    }
    
    let categoryId = 'NULL';
    
    if (mapping) {
      if (mapping.db_category_id) {
        // Existing category - use the ID directly
        categoryId = mapping.db_category_id;
      } else if (mapping.toolify_slug) {
        // New category - will need to be resolved after category INSERT
        categoryId = `(SELECT id FROM categories WHERE slug = ${escapeSql(mapping.toolify_slug)} LIMIT 1)`;
      } else {
        // Fallback: try to find by name
        const slug = categoryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        categoryId = `(SELECT id FROM categories WHERE slug = ${escapeSql(slug)} LIMIT 1)`;
      }
    } else if (categoryName) {
      // No mapping found - try to find category by name or slug
      const slug = categoryName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
      categoryId = `(SELECT id FROM categories WHERE name = ${escapeSql(categoryName)} OR slug = ${escapeSql(slug)} LIMIT 1)`;
    }
    
    // Track mapping stats
    if (mapping) {
      if (mapping.db_category_id) {
        categoryMappingStats.existingCategories++;
      } else {
        categoryMappingStats.newCategories++;
      }
    } else if (categoryName) {
      // Category name exists but no mapping found
      categoryMappingStats.notFound++;
    }
    
    // Build tool INSERT values
    const platformsJson = arrayToJsonSql(tool.platforms);
    const tagsJson = arrayToJsonSql(tool.feature_tags);
    
    // Use description for short_description (keep as before, no limit)
    const shortDescription = tool.description || tool.full_description || 'AI tool from Toolify.ai';
    
    // Set default submitter_email
    const submitterEmail = 'manohar@clarifyall.com';
    
    const toolValue = {
      name: escapeSql(tool.name),
      slug: escapeSql(slug),
      description: escapeSql(tool.description),
      short_description: escapeSql(shortDescription),
      full_description: escapeSql(tool.full_description),
      website_url: escapeSql(tool.website_url),
      logo_url: escapeSql(tool.logo_url),
      category_id: categoryId,
      pricing_model: escapeSql(tool.pricing_model),
      platforms: platformsJson,
      feature_tags: tagsJson,
      submitter_email: escapeSql(submitterEmail),
      view_count: 0,
      save_count: 0,
      status: "'APPROVED'"
    };
    
    currentFileTools.push(toolValue);
    
    // Write to file if we've reached the limit
    if (currentFileTools.length >= toolsPerFile) {
      writeToolSqlFile(fileIndex, currentFileTools);
      toolSqlFiles.push(`insert-tools-part${fileIndex}.sql`);
      fileIndex++;
      currentFileTools = [];
    }
  });
  
  // Write remaining tools
  if (currentFileTools.length > 0) {
    writeToolSqlFile(fileIndex, currentFileTools);
    toolSqlFiles.push(`insert-tools-part${fileIndex}.sql`);
  }
  
  function writeToolSqlFile(index, tools) {
    const sql = [];
    sql.push('-- ============================================');
    sql.push(`-- INSERT TOOLS FROM TOOLIFY.AI - PART ${index}`);
    sql.push(`-- Total tools in this file: ${tools.length}`);
    sql.push('-- ============================================');
    sql.push('');
    sql.push('INSERT IGNORE INTO tools (name, slug, description, short_description, full_description, website_url, logo_url, category_id, pricing_model, platforms, feature_tags, submitter_email, view_count, save_count, status) VALUES');
    
    const values = tools.map(tool => {
      return `(${tool.name}, ${tool.slug}, ${tool.description}, ${tool.short_description}, ${tool.full_description}, ${tool.website_url}, ${tool.logo_url}, ${tool.category_id}, ${tool.pricing_model}, ${tool.platforms}, ${tool.feature_tags}, ${tool.submitter_email}, ${tool.view_count}, ${tool.save_count}, ${tool.status})`;
    });
    
    sql.push(values.join(',\n') + ';');
    
    const filename = path.join(SQL_OUTPUT_DIR, `insert-tools-part${index}.sql`);
    fs.writeFileSync(filename, sql.join('\n'), 'utf8');
    totalInserted += tools.length;
    console.log(`💾 Saved ${tools.length} tools to ${filename}`);
  }
  
  // Generate summary
  const summary = {
    extraction_date: new Date().toISOString(),
    total_tools: parsedTools.length,
    valid_tools: validTools.length,
    skipped_tools: parsedTools.length - validTools.length,
    total_categories: newCategories.length + categoryMapping.filter(m => !m.is_new).length,
    new_categories: newCategories.length,
    existing_categories: categoryMapping.filter(m => !m.is_new).length,
    tools_by_category: Object.fromEntries(
      Array.from(toolsByCategory.entries()).map(([cat, tools]) => [cat, tools.length])
    ),
    pricing_distribution: {
      FREE: validTools.filter(({ tool }) => tool.pricing_model === 'FREE').length,
      FREEMIUM: validTools.filter(({ tool }) => tool.pricing_model === 'FREEMIUM').length,
      FREE_TRIAL: validTools.filter(({ tool }) => tool.pricing_model === 'FREE_TRIAL').length,
      OPEN_SOURCE: validTools.filter(({ tool }) => tool.pricing_model === 'OPEN_SOURCE').length,
      PAID: validTools.filter(({ tool }) => tool.pricing_model === 'PAID').length
    },
    sql_files: {
      categories: 'insert-categories.sql',
      tools: toolSqlFiles
    }
  };
  
  fs.writeJsonSync(SUMMARY_FILE, summary, { spaces: 2 });
  console.log(`💾 Saved extraction summary to ${SUMMARY_FILE}`);
  
  console.log('\n✅ SQL generation complete!');
  console.log(`   - Total tools parsed: ${parsedTools.length}`);
  console.log(`   - Valid tools (with website_url): ${validTools.length}`);
  console.log(`   - Skipped tools (no website_url): ${parsedTools.length - validTools.length}`);
  console.log(`   - New categories: ${newCategories.length}`);
  console.log(`   - Category mapping stats:`);
  console.log(`     * Mapped to existing categories: ${categoryMappingStats.existingCategories}`);
  console.log(`     * Mapped to new categories: ${categoryMappingStats.newCategories}`);
  console.log(`     * Categories not found in mapping: ${categoryMappingStats.notFound}`);
  console.log(`   - SQL files created: ${toolSqlFiles.length + 1}`);
  console.log(`   - Output directory: ${SQL_OUTPUT_DIR}`);
  
  return summary;
}

// Run if called directly
if (require.main === module) {
  try {
    generateInsertSQL();
    console.log('✅ SQL generation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ SQL generation failed:', error);
    process.exit(1);
  }
}

module.exports = generateInsertSQL;

