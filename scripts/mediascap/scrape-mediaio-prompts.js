const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'mediaio-prompts-raw.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'mediaio-categories.json');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'mediaio-prompts-parsed.json');

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Scrape Gemini AI Photo Prompts from Media.io
 * URL: https://www.media.io/image-effects/gemini-ai-photo-prompt-copy.html
 */
async function scrapeMediaIOPrompts() {
  console.log('🚀 Starting Media.io Gemini AI Photo Prompts scraping...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://www.media.io/image-effects/gemini-ai-photo-prompt-copy.html';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('✅ Page loaded, extracting data...\n');
    
    // Extract categories and prompts
    const data = await page.evaluate(() => {
      const categories = [];
      const categoryMap = new Map();
      
      // Find all category blocks using the data-category attribute
      const categoryBlocks = document.querySelectorAll('div.category-block[data-category]');
      
      categoryBlocks.forEach((block, catIndex) => {
        // Get category name from h3 heading
        const categoryHeading = block.querySelector('h3');
        if (!categoryHeading) return;
        
        // Extract category name from heading text
        let categoryName = '';
        const strongTag = categoryHeading.querySelector('strong');
        if (strongTag) {
          categoryName = strongTag.textContent.trim();
        } else {
          // Fallback: extract from heading text
          const headingText = categoryHeading.textContent.trim();
          categoryName = headingText
            .replace(/^.*?Gemini AI Photo Prompt\s*[-–]\s*/i, '')
            .replace(/🌴|🎂|🌹|👨|👩|👨‍👩|👨‍👨|👩‍👩|🎉|🎊|💇|🪔/g, '')
            .trim();
        }
        
        // Get category description from the small text
        const categoryDesc = block.querySelector('.col-12 .small')?.textContent.trim() || '';
        
        // Clean up category name - remove emojis and normalize
        categoryName = categoryName
          .replace(/🌴|🎂|🌹|👨|👩|👨‍👩|👨‍👨|👩‍👩|🎉|🎊|💇|🪔/g, '')
          .replace(/Gemini AI Photo Prompt\s*[-–]\s*/i, '')
          .trim();
        
        if (!categoryName || categoryName.length < 2) return;
        
        // Find all prompt items in this category block
        const promptItems = block.querySelectorAll('.col-md-6, .col-xl-4');
        const categoryPrompts = [];
        
        promptItems.forEach((item, itemIndex) => {
          // Get prompt title from h4
          const promptTitleEl = item.querySelector('h4');
          if (!promptTitleEl) return;
          
          const promptTitle = promptTitleEl.textContent.trim()
            .replace(/^\d+\.\s*/, '')
            .trim();
          
          // Get prompt text from p.prompt-body
          const promptBodyEl = item.querySelector('p.prompt-body');
          if (!promptBodyEl) return;
          
          let promptText = promptBodyEl.textContent.trim();
          
          // Extract style keywords if present
          let styleKeywords = '';
          const styleMatch = promptText.match(/Style Keywords?:\s*([^\n]+)/i);
          if (styleMatch) {
            styleKeywords = styleMatch[1].trim();
            // Remove style keywords from prompt text
            promptText = promptText.replace(/\s*<br>\s*<strong>Style Keywords?:\s*[^<]+<\/strong>/i, '').trim();
            promptText = promptText.replace(/\s*Style Keywords?:\s*[^\n]+/i, '').trim();
          }
          
          // Get example image - try multiple selectors
          let imgEl = item.querySelector('img.preview-img');
          if (!imgEl) {
            // Try other image selectors
            imgEl = item.querySelector('img[src*="media.io"]');
          }
          if (!imgEl) {
            // Try any img tag in the item
            imgEl = item.querySelector('img');
          }
          if (!imgEl) {
            // Try parent element for images
            const parent = item.parentElement;
            if (parent) {
              imgEl = parent.querySelector('img.preview-img') || parent.querySelector('img[src*="media.io"]') || parent.querySelector('img');
            }
          }
          
          // Get image URL - try multiple attributes
          let exampleImageUrl = '';
          if (imgEl) {
            exampleImageUrl = imgEl.src || imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || '';
            // Clean up URL - remove query parameters if needed
            if (exampleImageUrl && exampleImageUrl.includes('?')) {
              exampleImageUrl = exampleImageUrl.split('?')[0];
            }
          }
          
          // Get description (the small text under category heading, or use style keywords)
          const description = styleKeywords || categoryDesc || '';
          
          if (promptTitle && promptText) {
            categoryPrompts.push({
              title: promptTitle,
              description: description,
              prompt_text: promptText,
              example_image_url: exampleImageUrl,
              order_index: itemIndex
            });
          }
        });
        
        if (categoryName && categoryPrompts.length > 0) {
          // Check if category already exists
          if (categoryMap.has(categoryName)) {
            categoryMap.get(categoryName).prompts.push(...categoryPrompts);
          } else {
            const category = {
              name: categoryName,
              description: categoryDesc || `Gemini AI photo prompts for ${categoryName.toLowerCase()}`,
              icon: '📸',
              order_index: catIndex,
              prompts: categoryPrompts
            };
            categoryMap.set(categoryName, category);
            categories.push(category);
          }
        }
      });
      
      return { 
        categories: Array.from(categoryMap.values()), 
        totalPrompts: categories.reduce((sum, cat) => sum + cat.prompts.length, 0) 
      };
    });
    
    console.log(`✅ Extracted ${data.categories.length} categories with ${data.totalPrompts} prompts\n`);
    
    // Save raw data
    await fs.writeJSON(RAW_DATA_FILE, data, { spaces: 2 });
    console.log(`💾 Saved raw data to: ${RAW_DATA_FILE}`);
    
    // Extract categories separately
    const categories = data.categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order_index: cat.order_index
    }));
    
    await fs.writeJSON(CATEGORIES_FILE, categories, { spaces: 2 });
    console.log(`💾 Saved categories to: ${CATEGORIES_FILE}`);
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${data.categories.length}`);
    console.log(`   - Total Prompts: ${data.totalPrompts}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error scraping Media.io:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  scrapeMediaIOPrompts()
    .then(() => {
      console.log('✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = scrapeMediaIOPrompts;

