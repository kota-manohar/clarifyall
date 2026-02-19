const https = require('https');
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

const LOGOS_DIR = path.join(__dirname, '..', 'logos');
const OUTPUT_DIR = path.join(__dirname, 'output');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'toolify-tools-parsed.json');

// Ensure logos directory exists
fs.ensureDirSync(LOGOS_DIR);

/**
 * Get file extension from URL or content type
 */
function getFileExtension(url, contentType) {
  if (!url) return '.png';
  
  try {
    // Try to get extension from URL
    const urlPath = new URL(url).pathname;
    const urlExt = path.extname(urlPath).toLowerCase();
    if (urlExt && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(urlExt)) {
      return urlExt;
    }
  } catch (e) {
    // Invalid URL, try to extract from string
    const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i);
    if (match) {
      return '.' + match[1].toLowerCase();
    }
  }
  
  // Try to get extension from content type
  if (contentType) {
    const contentTypeMap = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    };
    return contentTypeMap[contentType] || '.png';
  }
  
  return '.png'; // Default extension
}

/**
 * Generate logo filename from tool name
 */
function generateLogoFilename(toolName, originalUrl) {
  // Clean tool name for filename
  const cleanName = toolName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  // Get extension from original URL or default to .png
  let ext = getFileExtension(originalUrl);
  if (!ext || ext === '.png') {
    // Try to get extension from URL path
    try {
      const urlPath = new URL(originalUrl).pathname;
      const urlExt = path.extname(urlPath).toLowerCase();
      if (urlExt && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(urlExt)) {
        ext = urlExt;
      } else {
        ext = '.png'; // Default
      }
    } catch (e) {
      ext = '.png'; // Default
    }
  }
  
  return `${cleanName}${ext}`;
}

/**
 * Download image from URL
 */
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return downloadImage(redirectUrl, filePath).then(resolve).catch(reject);
          }
        }
        
        // Check if response is successful
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        // Check if it's an image
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error('URL does not point to an image'));
          return;
        }
        
        // Create write stream
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete file on error
          reject(err);
        });
      });
      
      request.on('error', (err) => {
        reject(err);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download all logos for tools
 */
async function downloadLogos() {
  console.log('📥 Downloading logos...\n');
  
  if (!fs.existsSync(PARSED_DATA_FILE)) {
    throw new Error(`Parsed data file not found: ${PARSED_DATA_FILE}. Please run parse-toolify-data.js first.`);
  }
  
  const tools = fs.readJsonSync(PARSED_DATA_FILE);
  console.log(`📊 Processing ${tools.length} tools...\n`);
  
  let downloaded = 0;
  let failed = 0;
  const logoMapping = new Map();
  
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    
    // Only process tools with complete data
    if (!tool.logo_url || !tool.website_url || !tool.name) {
      continue; // Skip tools without required data
    }
    
      // Skip if logo_url is already a full URL
      if (tool.logo_url.startsWith('https://clarifyall.com/logos/')) {
        const existingFilename = tool.logo_url.replace('https://clarifyall.com/logos/', '');
        logoMapping.set(tool.name, existingFilename);
        continue;
      }
      
      // Handle old format /logos/ paths
      if (tool.logo_url.startsWith('/logos/')) {
        const existingFilename = tool.logo_url.replace('/logos/', '');
        tool.logo_url = `https://clarifyall.com/logos/${existingFilename}`;
        logoMapping.set(tool.name, existingFilename);
        continue;
      }
    
    try {
      // Generate logo filename from tool name
      const logoFilename = generateLogoFilename(tool.name, tool.logo_url);
      const logoPath = path.join(LOGOS_DIR, logoFilename);
      
      // Skip if already downloaded
      if (fs.existsSync(logoPath)) {
        console.log(`  ⏭️  Logo already exists: ${logoFilename}`);
        // Update tool with full logo URL
        tool.logo_url = `https://clarifyall.com/logos/${logoFilename}`;
        logoMapping.set(tool.name, logoFilename);
        continue;
      }
      
      // Download logo
      console.log(`  📥 [${i + 1}/${tools.length}] Downloading logo for "${tool.name}"...`);
      await downloadImage(tool.logo_url, logoPath);
      
      // Verify file was downloaded and has content
      if (!fs.existsSync(logoPath)) {
        throw new Error('File was not created');
      }
      
      const stats = fs.statSync(logoPath);
      if (stats.size === 0) {
        fs.unlinkSync(logoPath);
        throw new Error('Downloaded file is empty');
      }
      
      // Update tool with full logo URL
      tool.logo_url = `https://clarifyall.com/logos/${logoFilename}`;
      logoMapping.set(tool.name, logoFilename);
      
      downloaded++;
      console.log(`  ✅ Downloaded: ${logoFilename} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      failed++;
      console.log(`  ❌ Failed to download logo for "${tool.name}": ${error.message}`);
      // Remove tool from list if logo download fails (incomplete data)
      tool.logo_url = null;
    }
  }
  
  // Filter out tools where logo download failed (only keep tools with successfully downloaded logos)
  // Also convert any remaining /logos/ paths to full URLs
  const toolsWithLogos = tools
    .filter(tool => tool.logo_url && (
      tool.logo_url.startsWith('https://clarifyall.com/logos/') || 
      tool.logo_url.startsWith('/logos/')
    ))
    .map(tool => {
      // Convert /logos/ paths to full URLs if needed
      if (tool.logo_url.startsWith('/logos/')) {
        const filename = tool.logo_url.replace('/logos/', '');
        tool.logo_url = `https://clarifyall.com/logos/${filename}`;
      }
      return tool;
    });
  
  // Save updated tools data (only tools with successfully downloaded logos)
  fs.writeJsonSync(PARSED_DATA_FILE, toolsWithLogos, { spaces: 2 });
  console.log(`\n💾 Updated parsed data with local logo paths`);
  console.log(`   - Tools with logos: ${toolsWithLogos.length}`);
  console.log(`   - Tools without logos (removed): ${tools.length - toolsWithLogos.length}`);
  
  // Save logo mapping
  const mappingFile = path.join(OUTPUT_DIR, 'logo-mapping.json');
  const mappingArray = Array.from(logoMapping.entries()).map(([name, filename]) => ({
    tool_name: name,
    logo_filename: filename
  }));
  fs.writeJsonSync(mappingFile, mappingArray, { spaces: 2 });
  
  console.log(`\n✅ Logo download complete!`);
  console.log(`   - Downloaded: ${downloaded}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Tools with logos: ${toolsWithLogos.length}`);
  console.log(`   - Logos saved to: ${LOGOS_DIR}`);
  
  return {
    downloaded,
    failed,
    total: tools.length,
    toolsWithLogos: toolsWithLogos.length,
    tools: toolsWithLogos
  };
}

// Run if called directly
if (require.main === module) {
  downloadLogos()
    .then(() => {
      console.log('✅ Logo download completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Logo download failed:', error);
      process.exit(1);
    });
}

module.exports = downloadLogos;

