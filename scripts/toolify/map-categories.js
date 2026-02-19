const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2/promise');

const OUTPUT_DIR = path.join(__dirname, 'output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'toolify-tools-parsed.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'toolify-categories.json');
const CATEGORY_MAPPING_FILE = path.join(OUTPUT_DIR, 'category-mapping.json');
const NEW_CATEGORIES_FILE = path.join(OUTPUT_DIR, 'new-categories.json');

// Database configuration (update with your credentials)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u530425252_kyc'
};

/**
 * Create slug from category name
 */
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Map Toolify categories to database categories
 */
async function mapCategories() {
  console.log('🗺️  Mapping categories...');
  
  if (!fs.existsSync(PARSED_DATA_FILE)) {
    throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}. Please run parse-toolify-data.js first.`);
  }
  
  const parsedTools = fs.readJsonSync(PARSED_DATA_FILE);
  const toolifyCategories = fs.existsSync(CATEGORIES_FILE) 
    ? fs.readJsonSync(CATEGORIES_FILE) 
    : [];
  
  // Extract all unique categories from tools
  const categoriesFromTools = new Map();
  parsedTools.forEach(tool => {
    if (tool.category && tool.category.trim()) {
      const catName = tool.category.trim();
      if (!categoriesFromTools.has(catName)) {
        categoriesFromTools.set(catName, {
          name: catName,
          slug: createSlug(catName),
          description: `Tools in ${catName} category from Toolify.ai`,
          icon: '🤖',
          tool_count: 0
        });
      }
      categoriesFromTools.get(catName).tool_count++;
    }
  });
  
  // Merge with categories from categories file
  toolifyCategories.forEach(cat => {
    if (!categoriesFromTools.has(cat.name)) {
      categoriesFromTools.set(cat.name, {
        name: cat.name,
        slug: cat.slug || createSlug(cat.name),
        description: cat.description || `Tools in ${cat.name} category`,
        icon: cat.icon || '🤖',
        tool_count: 0
      });
    }
  });
  
  const allCategories = Array.from(categoriesFromTools.values());
  console.log(`📊 Found ${allCategories.length} unique categories from Toolify.ai`);
  
  // Connect to database to check existing categories
  let connection;
  let existingCategories = [];
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Fetch existing categories
    const [rows] = await connection.execute('SELECT id, name, slug FROM categories');
    existingCategories = rows;
    console.log(`📋 Found ${existingCategories.length} existing categories in database`);
    
  } catch (error) {
    console.warn('⚠️  Could not connect to database. Will create all categories as new.');
    console.warn(`   Error: ${error.message}`);
  }
  
  // Create category mapping
  const categoryMapping = new Map();
  const newCategories = [];
  
  allCategories.forEach(toolifyCat => {
    // Try to find matching category in database
    const existing = existingCategories.find(dbCat => {
      const dbNameLower = dbCat.name.toLowerCase().trim();
      const dbSlugLower = dbCat.slug.toLowerCase().trim();
      const toolifyNameLower = toolifyCat.name.toLowerCase().trim();
      const toolifySlugLower = toolifyCat.slug.toLowerCase().trim();
      
      return dbNameLower === toolifyNameLower ||
             dbSlugLower === toolifySlugLower ||
             dbNameLower.includes(toolifyNameLower) ||
             toolifyNameLower.includes(dbNameLower);
    });
    
    if (existing) {
      // Map to existing category
      categoryMapping.set(toolifyCat.name, {
        toolify_name: toolifyCat.name,
        toolify_slug: toolifyCat.slug,
        db_category_id: existing.id,
        db_name: existing.name,
        db_slug: existing.slug,
        is_new: false
      });
    } else {
      // New category to create
      newCategories.push(toolifyCat);
      categoryMapping.set(toolifyCat.name, {
        toolify_name: toolifyCat.name,
        toolify_slug: toolifyCat.slug,
        db_category_id: null, // Will be set after INSERT
        is_new: true
      });
    }
  });
  
  console.log(`✅ Category mapping complete:`);
  console.log(`   - Existing categories: ${allCategories.length - newCategories.length}`);
  console.log(`   - New categories to create: ${newCategories.length}`);
  
  // Save mapping
  const mappingArray = Array.from(categoryMapping.values());
  fs.writeJsonSync(CATEGORY_MAPPING_FILE, mappingArray, { spaces: 2 });
  console.log(`💾 Saved category mapping to ${CATEGORY_MAPPING_FILE}`);
  
  // Save new categories
  fs.writeJsonSync(NEW_CATEGORIES_FILE, newCategories, { spaces: 2 });
  console.log(`💾 Saved new categories to ${NEW_CATEGORIES_FILE}`);
  
  if (connection) {
    await connection.end();
  }
  
  return {
    mapping: mappingArray,
    newCategories: newCategories
  };
}

// Run if called directly
if (require.main === module) {
  mapCategories()
    .then(() => {
      console.log('✅ Category mapping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Category mapping failed:', error);
      process.exit(1);
    });
}

module.exports = mapCategories;

