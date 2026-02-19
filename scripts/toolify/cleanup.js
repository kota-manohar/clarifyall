const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SQL_OUTPUT_DIR = path.join(__dirname, 'sql-output');
const LOGOS_DIR = path.join(__dirname, '..', 'logos');

/**
 * Clean up generated files before fresh scraping
 */
function cleanup() {
  console.log('🧹 Cleaning up generated files...\n');
  
  // Remove output files
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(file => {
      const filePath = path.join(OUTPUT_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.removeSync(filePath);
        console.log(`  ✅ Removed: ${file}`);
      }
    });
  }
  
  // Remove SQL output files
  if (fs.existsSync(SQL_OUTPUT_DIR)) {
    const files = fs.readdirSync(SQL_OUTPUT_DIR);
    files.forEach(file => {
      const filePath = path.join(SQL_OUTPUT_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.removeSync(filePath);
        console.log(`  ✅ Removed: ${file}`);
      }
    });
  }
  
  // Remove downloaded logos
  if (fs.existsSync(LOGOS_DIR)) {
    const files = fs.readdirSync(LOGOS_DIR);
    files.forEach(file => {
      const filePath = path.join(LOGOS_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.removeSync(filePath);
        console.log(`  ✅ Removed logo: ${file}`);
      }
    });
  }
  
  console.log('\n✅ Cleanup complete! Ready for fresh scraping.');
}

// Run if called directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;

