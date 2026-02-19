const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'futurepedia-tools-parsed.json');

async function updateLogoUrls() {
    console.log('🔄 Updating logo URLs from SVG to PNG...\n');

    const tools = fs.readJsonSync(PARSED_DATA_FILE);
    let updated = 0;

    for (const tool of tools) {
        if (tool.logo_url && tool.logo_url.endsWith('.svg')) {
            tool.logo_url = tool.logo_url.replace('.svg', '.png');
            updated++;
            console.log(`  ✅ Updated ${tool.name}: ${path.basename(tool.logo_url)}`);
        }
    }

    fs.writeJsonSync(PARSED_DATA_FILE, tools, { spaces: 2 });

    console.log(`\n✅ Updated ${updated} logo URLs to PNG format`);
}

updateLogoUrls().catch(console.error);
