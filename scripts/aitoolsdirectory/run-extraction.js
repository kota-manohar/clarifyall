const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const SCRIPTS_DIR = __dirname;
const LOG_FILE = path.join(SCRIPTS_DIR, 'output', 'extraction.log');

// Ensure output directory exists
fs.ensureDirSync(path.join(SCRIPTS_DIR, 'output'));

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function runScript(scriptName) {
    log(`🚀 Running ${scriptName}...`);
    try {
        const scriptPath = path.join(SCRIPTS_DIR, scriptName);
        execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: SCRIPTS_DIR });
        log(`✅ ${scriptName} completed successfully.`);
    } catch (error) {
        log(`❌ ${scriptName} failed: ${error.message}`);
        process.exit(1);
    }
}

async function main() {
    log('================================================');
    log('🤖 STARTING AITOOLSDIRECTORY.COM EXTRACTION PIPELINE');
    log('================================================');

    // 1. Scrape data
    runScript('scrape-aitoolsdirectory.js');

    // 2. Parse and normalize data
    runScript('parse-data.js');

    // 3. Map categories
    runScript('map-categories.js');

    // 4. Download logos (This updates the parsed data with local paths)
    runScript('download-logos.js');

    // 5. Generate SQL (Uses the updated parsed data)
    runScript('generate-insert-sql.js');

    log('================================================');
    log('✅ PIPELINE COMPLETED SUCCESSFULLY');
    log('================================================');
    log(`📄 Check output in ${path.join(SCRIPTS_DIR, 'output')}`);
    log(`💾 SQL files in ${path.join(SCRIPTS_DIR, 'sql-output')}`);
}

main().catch(error => {
    log(`❌ Pipeline failed: ${error.message}`);
    process.exit(1);
});
