const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const OUTPUT_DIR = path.join(__dirname, 'output');
const LOGOS_DIR = path.join(OUTPUT_DIR, 'futuretools-logos');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'futuretools-tools-parsed.json');
const LOGOS_DATA_FILE = path.join(OUTPUT_DIR, 'futuretools-tools-with-logos.json');

fs.ensureDirSync(LOGOS_DIR);

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
 * Detect MIME type from buffer
 */
function detectMimeType(buffer) {
    // Check magic numbers
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return 'image/gif';
    }
    if (buffer[0] === 0x3C && buffer[1] === 0x73 && buffer[2] === 0x76 && buffer[3] === 0x67) {
        return 'image/svg+xml';
    }
    // Check for SVG text
    const str = buffer.toString('utf8', 0, Math.min(100, buffer.length));
    if (str.includes('<svg')) {
        return 'image/svg+xml';
    }
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
        return 'image/bmp';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        return 'image/webp';
    }

    return 'image/png'; // Default fallback
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };
    return extensions[mimeType] || 'png';
}

/**
 * Download logo from URL
 */
async function downloadLogo(url, slug) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });

        const buffer = Buffer.from(response.data);
        const mimeType = detectMimeType(buffer);
        const extension = getExtension(mimeType);
        const filename = `${slug}.${extension}`;
        const filepath = path.join(LOGOS_DIR, filename);

        // Save to file
        await fs.writeFile(filepath, buffer);

        return {
            success: true,
            filepath,
            filename,
            mimeType,
            size: buffer.length,
            buffer: buffer
        };
    } catch (error) {
        console.error(`   ❌ Failed to download ${url}: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Download logos for all tools
 */
async function downloadFutureToolsLogos() {
    console.log('🖼️  Downloading FutureTools logos...');

    if (!fs.existsSync(PARSED_DATA_FILE)) {
        throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}. Please run parse-futuretools-data.js first.`);
    }

    const tools = fs.readJsonSync(PARSED_DATA_FILE);
    console.log(`📊 Processing ${tools.length} tools...`);

    const stats = {
        total: tools.length,
        success: 0,
        failed: 0,
        skipped: 0
    };

    const toolsWithLogos = [];

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        console.log(`[${i + 1}/${tools.length}] Processing ${tool.name}...`);

        if (!tool.logo_url) {
            console.log('   ⚠️ No logo URL, skipping...');
            stats.skipped++;
            toolsWithLogos.push(tool);
            continue;
        }

        const slug = generateSlug(tool.name);
        const result = await downloadLogo(tool.logo_url, slug);

        if (result.success) {
            console.log(`   ✅ Downloaded: ${result.filename} (${result.mimeType}, ${(result.size / 1024).toFixed(2)} KB)`);

            // Add logo data to tool
            tool.logo_local_path = result.filepath;
            tool.logo_filename = result.filename;
            tool.logo_mime_type = result.mimeType;
            tool.logo_binary = result.buffer; // Store buffer for SQL generation

            stats.success++;
        } else {
            console.log(`   ❌ Failed to download logo`);
            stats.failed++;
        }

        toolsWithLogos.push(tool);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Save tools with logo data
    // Note: We need to convert buffers to base64 for JSON storage
    const toolsForJson = toolsWithLogos.map(tool => {
        if (tool.logo_binary) {
            return {
                ...tool,
                logo_binary_base64: tool.logo_binary.toString('base64'),
                logo_binary: undefined // Remove buffer from JSON
            };
        }
        return tool;
    });

    fs.writeJsonSync(LOGOS_DATA_FILE, toolsForJson, { spaces: 2 });
    console.log(`💾 Saved tools with logo data to ${LOGOS_DATA_FILE}`);

    console.log('\n✅ Logo download complete!');
    console.log(`   - Total tools: ${stats.total}`);
    console.log(`   - Successfully downloaded: ${stats.success}`);
    console.log(`   - Failed: ${stats.failed}`);
    console.log(`   - Skipped (no URL): ${stats.skipped}`);
    console.log(`   - Success rate: ${((stats.success / stats.total) * 100).toFixed(2)}%`);

    return { tools: toolsWithLogos, stats };
}

// Run if called directly
if (require.main === module) {
    downloadFutureToolsLogos()
        .then(() => {
            console.log('✅ Logo download completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Logo download failed:', error);
            process.exit(1);
        });
}

module.exports = downloadFutureToolsLogos;
