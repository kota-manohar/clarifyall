const fs = require('fs-extra');
const path = require('path');

const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');

/**
 * Validate SQL files before import
 */
function validateSQL() {
  console.log('🔍 Validating SQL files...\n');
  
  if (!fs.existsSync(SQL_OUTPUT_DIR)) {
    console.error('❌ SQL output directory not found. Run generate-insert-sql.js first.');
    process.exit(1);
  }
  
  const sqlFiles = fs.readdirSync(SQL_OUTPUT_DIR).filter(f => f.endsWith('.sql'));
  
  if (sqlFiles.length === 0) {
    console.error('❌ No SQL files found in sql-output directory.');
    process.exit(1);
  }
  
  console.log(`Found ${sqlFiles.length} SQL files to validate:\n`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  sqlFiles.forEach(file => {
    const filePath = path.join(SQL_OUTPUT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 Validating ${file}...`);
    
    const errors = [];
    const warnings = [];
    
    // Check for basic SQL syntax
    if (!content.includes('INSERT')) {
      errors.push('No INSERT statements found');
    }
    
    // Check for unclosed parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for unclosed quotes
    const singleQuotes = (content.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      warnings.push('Possible unclosed quotes (may be false positive)');
    }
    
    // Check for NULL values in required fields
    if (file.includes('tools')) {
      const nullNameMatches = content.match(/\(NULL,/g);
      if (nullNameMatches) {
        errors.push(`Found ${nullNameMatches.length} tools with NULL name`);
      }
    }
    
    // Check file size
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > 50 * 1024 * 1024) { // 50MB
      warnings.push(`Large file size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Count INSERT statements
    const insertCount = (content.match(/INSERT IGNORE INTO/g) || []).length;
    console.log(`   - INSERT statements: ${insertCount}`);
    
    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      errors.forEach(err => console.log(`      - ${err}`));
      totalErrors += errors.length;
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${warnings.length}`);
      warnings.forEach(warn => console.log(`      - ${warn}`));
      totalWarnings += warnings.length;
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ File is valid`);
    }
    
    console.log('');
  });
  
  console.log('='.repeat(60));
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ All SQL files are valid!');
    console.log('   You can proceed with database import.');
  } else {
    console.log(`⚠️  Validation complete with ${totalErrors} errors and ${totalWarnings} warnings`);
    if (totalErrors > 0) {
      console.log('   Please fix errors before importing to database.');
      process.exit(1);
    }
  }
  console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  validateSQL();
}

module.exports = validateSQL;

