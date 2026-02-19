const https = require('https');
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

const LOGOS_DIR = path.join(__dirname, '..', 'logos');
const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'filmora-prompts-raw.json');

// Ensure logos directory exists
fs.ensureDirSync(LOGOS_DIR);

/**
 * Get file extension from URL or content type
 */
function getFileExtension(url, contentType) {
  if (!url) return '.png';
  
  try {
    const urlPath = new URL(url).pathname;
    const urlExt = path.extname(urlPath).toLowerCase();
    if (urlExt && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(urlExt)) {
      return urlExt;
    }
  } catch (e) {
    const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i);
    if (match) {
      return '.' + match[1].toLowerCase();
    }
  }
  
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
  
  return '.png';
}

/**
 * Generate image filename from prompt title and category
 */
function generateImageFilename(categoryName, promptTitle, originalUrl) {
  const cleanCategory = categoryName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  const cleanTitle = promptTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  let ext = getFileExtension(originalUrl);
  if (!ext || ext === '.png') {
    try {
      const urlPath = new URL(originalUrl).pathname;
      const urlExt = path.extname(urlPath).toLowerCase();
      if (urlExt && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(urlExt)) {
        ext = urlExt;
      } else {
        ext = '.png';
      }
    } catch (e) {
      ext = '.png';
    }
  }
  
  const filename = `${cleanCategory}-${cleanTitle}${ext}`;
  return filename;
}

/**
 * Download image from URL
 */
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            const fullRedirectUrl = redirectUrl.startsWith('http') 
              ? redirectUrl 
              : new URL(redirectUrl, url).href;
            return downloadImage(fullRedirectUrl, filePath).then(resolve).catch(reject);
          }
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error('URL does not point to an image'));
          return;
        }
        
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {});
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
 * Download all example images for prompts
 */
async function downloadImages() {
  console.log('📥 Downloading prompt example images...\n');
  
  if (!fs.existsSync(RAW_DATA_FILE)) {
    throw new Error(`Raw data file not found: ${RAW_DATA_FILE}. Please run scrape-filmora-prompts.js first.`);
  }
  
  const data = fs.readJsonSync(RAW_DATA_FILE);
  const { categories } = data;
  
  if (!categories || categories.length === 0) {
    throw new Error('No categories found in scraped data.');
  }
  
  let totalPrompts = 0;
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;
  let skippedEmpty = 0;
  let skippedLocal = 0;
  let skippedExists = 0;
  
  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex];
    const prompts = category.prompts || [];
    
    console.log(`\n📁 Category: ${category.name} (${prompts.length} prompts)`);
    
    for (let promptIndex = 0; promptIndex < prompts.length; promptIndex++) {
      const prompt = prompts[promptIndex];
      totalPrompts++;
      
      if (!prompt.example_image_url || !prompt.example_image_url.trim()) {
        skipped++;
        skippedEmpty++;
        console.log(`  ⏭️  [${promptIndex + 1}/${prompts.length}] Skipped "${prompt.title}": No image URL`);
        continue;
      }
      
      if (prompt.example_image_url.startsWith('https://clarifyall.com/logos/')) {
        const existingFilename = prompt.example_image_url.replace('https://clarifyall.com/logos/', '');
        const imagePath = path.join(LOGOS_DIR, existingFilename);
        
        if (fs.existsSync(imagePath)) {
          skipped++;
          skippedLocal++;
          console.log(`  ✓ [${promptIndex + 1}/${prompts.length}] Already has local URL: ${existingFilename}`);
          continue;
        } else {
          console.log(`  ⚠️  [${promptIndex + 1}/${prompts.length}] Local URL but file missing: ${existingFilename}`);
          skipped++;
          skippedLocal++;
          continue;
        }
      }
      
      try {
        const imageFilename = generateImageFilename(category.name, prompt.title, prompt.example_image_url);
        const imagePath = path.join(LOGOS_DIR, imageFilename);
        
        if (fs.existsSync(imagePath)) {
          console.log(`  ⏭️  [${promptIndex + 1}/${prompts.length}] Image already exists: ${imageFilename}`);
          prompt.example_image_url = `https://clarifyall.com/logos/${imageFilename}`;
          skipped++;
          skippedExists++;
          continue;
        }
        
        console.log(`  📥 [${promptIndex + 1}/${prompts.length}] Downloading: "${prompt.title}"...`);
        await downloadImage(prompt.example_image_url, imagePath);
        
        if (!fs.existsSync(imagePath)) {
          throw new Error('File was not created');
        }
        
        const stats = fs.statSync(imagePath);
        if (stats.size === 0) {
          fs.unlinkSync(imagePath);
          throw new Error('Downloaded file is empty');
        }
        
        prompt.example_image_url = `https://clarifyall.com/logos/${imageFilename}`;
        
        downloaded++;
        console.log(`  ✅ Downloaded: ${imageFilename} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        failed++;
        console.log(`  ❌ Failed to download image for "${prompt.title}": ${error.message}`);
      }
    }
  }
  
  fs.writeJsonSync(RAW_DATA_FILE, data, { spaces: 2 });
  console.log(`\n💾 Updated raw data with local image paths`);
  
  console.log(`\n✅ Image download complete!`);
  console.log(`   - Total prompts: ${totalPrompts}`);
  console.log(`   - Downloaded: ${downloaded}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`     • Empty image URL: ${skippedEmpty}`);
  console.log(`     • Already local URL: ${skippedLocal}`);
  console.log(`     • File already exists: ${skippedExists}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Images saved to: ${LOGOS_DIR}`);
  
  if (skippedEmpty > 0) {
    console.log(`\n⚠️  Warning: ${skippedEmpty} prompts have no image URL.`);
    console.log(`   These prompts may need to be re-scraped to get their image URLs.`);
  }
  
  return {
    downloaded,
    failed,
    skipped,
    total: totalPrompts,
    data
  };
}

if (require.main === module) {
  downloadImages()
    .then(() => {
      console.log('\n✅ All images downloaded successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error downloading images:', error);
      process.exit(1);
    });
}

module.exports = downloadImages;

