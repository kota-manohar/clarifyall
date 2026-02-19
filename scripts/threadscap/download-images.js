const https = require('https');
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

const LOGOS_DIR = path.join(__dirname, '..', 'logos');
const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'threads-prompts-raw.json');

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
 * Generate image filename from prompt title and category
 */
function generateImageFilename(categoryName, promptTitle, originalUrl) {
  // Clean category name for filename
  const cleanCategory = categoryName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  // Clean prompt title for filename
  const cleanTitle = promptTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  // Get extension from original URL or default to .png
  let ext = getFileExtension(originalUrl);
  if (!ext || ext === '.png') {
    // Try to get extension from URL path
    try {
      const urlPath = new URL(originalUrl).pathname;
      const urlExt = path.extname(urlPath).toLowerCase();
      if (urlExt && ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(urlExt)) {
        ext = urlExt;
      }
    } catch (e) {
      // Invalid URL, use default
    }
  }
  
  return `${cleanCategory}-${cleanTitle}${ext}`;
}

/**
 * Download image from URL
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Download all images from prompts
 */
async function downloadImages() {
  console.log('📥 Downloading images from Threads prompts...\n');
  
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
  
  let totalPrompts = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  
  // Collect all prompts with images
  const promptsWithImages = [];
  categories.forEach(category => {
    if (category.prompts && category.prompts.length > 0) {
      category.prompts.forEach(prompt => {
        if (prompt.example_image_url) {
          promptsWithImages.push({
            ...prompt,
            categoryName: category.name
          });
        }
      });
    }
  });
  
  totalPrompts = promptsWithImages.length;
  console.log(`📊 Found ${totalPrompts} prompts with images\n`);
  
  // Download images
  for (let i = 0; i < promptsWithImages.length; i++) {
    const prompt = promptsWithImages[i];
    const imageUrl = prompt.example_image_url;
    
    // Skip if already local URL
    if (imageUrl.includes('clarifyall.com/logos/')) {
      console.log(`[${i + 1}/${totalPrompts}] ⏭️  Skipped: Already local - "${prompt.title}"`);
      skipped++;
      continue;
    }
    
    // Skip if empty URL
    if (!imageUrl || imageUrl.trim() === '') {
      console.log(`[${i + 1}/${totalPrompts}] ⏭️  Skipped: Empty URL - "${prompt.title}"`);
      skipped++;
      continue;
    }
    
    try {
      const filename = generateImageFilename(prompt.categoryName, prompt.title, imageUrl);
      const filepath = path.join(LOGOS_DIR, filename);
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`[${i + 1}/${totalPrompts}] ⏭️  Skipped: File exists - "${prompt.title}"`);
        skipped++;
        
        // Update URL to local
        prompt.example_image_url = `https://clarifyall.com/logos/${filename}`;
        continue;
      }
      
      console.log(`[${i + 1}/${totalPrompts}] 📥 Downloading: "${prompt.title}"`);
      console.log(`   URL: ${imageUrl.substring(0, 80)}...`);
      
      await downloadImage(imageUrl, filepath);
      
      // Update URL to local
      prompt.example_image_url = `https://clarifyall.com/logos/${filename}`;
      
      console.log(`   ✅ Saved: ${filename}\n`);
      downloaded++;
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }
  
  // Save updated data
  fs.writeFileSync(RAW_DATA_FILE, JSON.stringify(data, null, 2));
  
  console.log('\n✅ Image download complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total prompts: ${totalPrompts}`);
  console.log(`   - Downloaded: ${downloaded}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Failed: ${failed}`);
}

// Run the download
downloadImages()
  .then(() => {
    console.log('\n✅ Download completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Download failed:', error);
    process.exit(1);
  });

