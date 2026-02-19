const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'threads-prompts-raw.json');
const SQL_CATEGORIES_FILE = path.join(SQL_OUTPUT_DIR, 'insert-prompt-categories.sql');
const SQL_PROMPTS_FILE = path.join(SQL_OUTPUT_DIR, 'insert-prompts.sql');

// Ensure output directories exist
fs.ensureDirSync(SQL_OUTPUT_DIR);

/**
 * Escape single quotes for SQL
 */
function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

/**
 * Generate SQL INSERT statements for prompt_categories and prompts tables
 */
function generateSQL() {
  console.log('📝 Generating SQL INSERT statements...\n');
  
  // Read scraped data
  if (!fs.existsSync(RAW_DATA_FILE)) {
    console.error(`❌ Error: ${RAW_DATA_FILE} not found. Please run scrape-threads-prompts.js first.`);
    process.exit(1);
  }
  
  const data = fs.readJSONSync(RAW_DATA_FILE);
  const { categories } = data;
  
  if (!categories || categories.length === 0) {
    console.error('❌ Error: No categories found in scraped data.');
    process.exit(1);
  }
  
  console.log(`📊 Processing ${categories.length} categories...\n`);
  
  // Generate SQL for prompt_categories
  let categoriesSQL = `-- ============================================\n`;
  categoriesSQL += `-- Insert Prompt Categories from Threads (@fit_saahil)\n`;
  categoriesSQL += `-- Generated: ${new Date().toISOString()}\n`;
  categoriesSQL += `-- ============================================\n\n`;
  categoriesSQL += `INSERT IGNORE INTO prompt_categories (name, description, icon, order_index) VALUES\n`;
  
  const categoryValues = categories.map((cat, index) => {
    const name = escapeSql(cat.name);
    const description = escapeSql(cat.description || '');
    const icon = cat.icon || '🎨';
    const orderIndex = cat.order_index || index;
    
    return `('${name}', '${description}', '${icon}', ${orderIndex})`;
  });
  
  categoriesSQL += categoryValues.join(',\n');
  categoriesSQL += ';\n\n';
  
  // Save categories SQL
  fs.writeFileSync(SQL_CATEGORIES_FILE, categoriesSQL, 'utf8');
  console.log(`✅ Generated: ${SQL_CATEGORIES_FILE}`);
  console.log(`   - ${categories.length} categories\n`);
  
  // Generate SQL for prompts
  let promptsSQL = `-- ============================================\n`;
  promptsSQL += `-- Insert Prompts from Threads (@fit_saahil)\n`;
  promptsSQL += `-- Generated: ${new Date().toISOString()}\n`;
  promptsSQL += `-- ============================================\n\n`;
  promptsSQL += `INSERT INTO prompts (\n`;
  promptsSQL += `  title, description, prompt_text, prompt_type, category_id,\n`;
  promptsSQL += `  difficulty, tags, example_image_url, status\n`;
  promptsSQL += `) VALUES\n`;
  
  const promptValues = [];
  let totalPrompts = 0;
  
  categories.forEach((category, catIndex) => {
    if (!category.prompts || category.prompts.length === 0) {
      return;
    }
    
    category.prompts.forEach((prompt, promptIndex) => {
      const title = escapeSql(prompt.title);
      const description = escapeSql(prompt.description || '');
      const promptText = escapeSql(prompt.prompt_text);
      const exampleImageUrl = escapeSql(prompt.example_image_url || '');
      
      // Convert tags array to JSON string
      let tagsJson = '[]';
      if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0) {
        tagsJson = JSON.stringify(prompt.tags);
        tagsJson = escapeSql(tagsJson);
        tagsJson = `'${tagsJson}'`;
      } else {
        tagsJson = 'NULL';
      }
      
      // Get category_id using subquery
      const categoryId = `(SELECT id FROM prompt_categories WHERE name = '${escapeSql(category.name)}' LIMIT 1)`;
      
      const values = `(
  '${title}',
  '${description}',
  '${promptText}',
  'IMAGE',
  ${categoryId},
  'BEGINNER',
  ${tagsJson},
  ${exampleImageUrl ? `'${exampleImageUrl}'` : 'NULL'},
  'APPROVED'
)`;
      
      promptValues.push(values);
      totalPrompts++;
    });
  });
  
  promptsSQL += promptValues.join(',\n');
  promptsSQL += ';\n\n';
  
  // Save prompts SQL
  fs.writeFileSync(SQL_PROMPTS_FILE, promptsSQL, 'utf8');
  console.log(`✅ Generated: ${SQL_PROMPTS_FILE}`);
  console.log(`   - ${totalPrompts} prompts\n`);
  
  console.log('✅ SQL generation completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Total Prompts: ${totalPrompts}`);
}

// Run the generator
generateSQL();

