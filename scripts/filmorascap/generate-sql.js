const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'filmora-prompts-raw.json');
const SQL_CATEGORIES_FILE = path.join(SQL_OUTPUT_DIR, 'insert-prompt-categories.sql');
const SQL_PROMPTS_FILE = path.join(SQL_OUTPUT_DIR, 'insert-prompts.sql');

// Ensure output directories exist
fs.ensureDirSync(SQL_OUTPUT_DIR);

/**
 * Generate SQL INSERT statements for prompt_categories and prompts tables
 */
function generateSQL() {
  console.log('📝 Generating SQL INSERT statements...\n');
  
  if (!fs.existsSync(RAW_DATA_FILE)) {
    console.error(`❌ Error: ${RAW_DATA_FILE} not found. Please run scrape-filmora-prompts.js first.`);
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
  categoriesSQL += `-- Insert Prompt Categories from Filmora\n`;
  categoriesSQL += `-- Generated: ${new Date().toISOString()}\n`;
  categoriesSQL += `-- ============================================\n\n`;
  categoriesSQL += `INSERT INTO prompt_categories (name, description, icon, order_index) VALUES\n`;
  
  const categoryValues = categories.map((cat, index) => {
    const name = cat.name.replace(/'/g, "''");
    const description = (cat.description || '').replace(/'/g, "''");
    const icon = cat.icon || '👶';
    const orderIndex = cat.order_index || index;
    
    return `('${name}', '${description}', '${icon}', ${orderIndex})`;
  });
  
  categoriesSQL += categoryValues.join(',\n');
  categoriesSQL += ';\n\n';
  
  fs.writeFileSync(SQL_CATEGORIES_FILE, categoriesSQL, 'utf8');
  console.log(`✅ Generated: ${SQL_CATEGORIES_FILE}`);
  console.log(`   - ${categories.length} categories\n`);
  
  // Generate SQL for prompts
  let promptsSQL = `-- ============================================\n`;
  promptsSQL += `-- Insert Prompts from Filmora\n`;
  promptsSQL += `-- Generated: ${new Date().toISOString()}\n`;
  promptsSQL += `-- ============================================\n\n`;
  promptsSQL += `-- Note: category_id will need to be updated after categories are inserted\n`;
  promptsSQL += `-- You can use: UPDATE prompts SET category_id = (SELECT id FROM prompt_categories WHERE name = 'CategoryName') WHERE category_id IS NULL;\n\n`;
  
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
      const title = (prompt.title || `Prompt ${promptIndex + 1}`).replace(/'/g, "''");
      const description = (prompt.description || '').replace(/'/g, "''");
      const promptText = (prompt.prompt_text || '').replace(/'/g, "''");
      const exampleImageUrl = (prompt.example_image_url || '').replace(/'/g, "''");
      
      const tags = extractTags(promptText);
      const tagsJSON = JSON.stringify(tags).replace(/'/g, "''");
      
      const categoryName = category.name.replace(/'/g, "''");
      
      promptValues.push(`(
  '${title}',
  ${description ? `'${description}'` : 'NULL'},
  '${promptText}',
  'IMAGE',
  (SELECT id FROM prompt_categories WHERE name = '${categoryName}' LIMIT 1),
  'BEGINNER',
  '${tagsJSON}',
  ${exampleImageUrl ? `'${exampleImageUrl}'` : 'NULL'},
  'APPROVED'
)`);
      
      totalPrompts++;
    });
  });
  
  promptsSQL += promptValues.join(',\n');
  promptsSQL += ';\n\n';
  
  fs.writeFileSync(SQL_PROMPTS_FILE, promptsSQL, 'utf8');
  console.log(`✅ Generated: ${SQL_PROMPTS_FILE}`);
  console.log(`   - ${totalPrompts} prompts\n`);
  
  console.log('✅ SQL generation completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Total Prompts: ${totalPrompts}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the SQL files in: ${SQL_OUTPUT_DIR}`);
  console.log(`   2. Run the SQL files in your database:`);
  console.log(`      - First: ${path.basename(SQL_CATEGORIES_FILE)}`);
  console.log(`      - Then: ${path.basename(SQL_PROMPTS_FILE)}`);
}

/**
 * Extract tags from prompt text
 */
function extractTags(promptText) {
  const tags = [];
  const text = promptText.toLowerCase();
  
  const styleKeywords = [
    'cinematic', 'golden hour', 'natural', 'warm', 'lifestyle',
    'soft pastel', 'dreamy', 'minimal', 'tropical', 'calm',
    'confident', 'adventure', 'raw', 'sporty', 'vibrant', 'free',
    'romantic', 'silhouette', 'emotional', 'candid', 'fun', 'dynamic',
    'vlog', 'bright', 'glamorous', 'elegant', 'fashion', 'editorial',
    'dramatic', 'studio', 'vintage', 'retro', 'urban', 'elite',
    'high-fashion', 'vogue', '8k', '4k', 'ultra-realistic', 'photorealistic',
    'shallow depth of field', 'bokeh', 'rim light', 'spotlight', 'backlight',
    'baby', 'newborn', 'infant', 'toddler', 'milestone', 'birthday',
    'portrait', 'family', 'cute', 'adorable', 'sweet'
  ];
  
  styleKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  const styleMatch = promptText.match(/Style Keywords?:\s*([^\n]+)/i);
  if (styleMatch) {
    const keywords = styleMatch[1].split(/[|,]/).map(k => k.trim()).filter(k => k.length > 0);
    tags.push(...keywords);
  }
  
  return [...new Set(tags)].slice(0, 10);
}

if (require.main === module) {
  try {
    generateSQL();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating SQL:', error);
    process.exit(1);
  }
}

module.exports = generateSQL;

