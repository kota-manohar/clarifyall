const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'toolify-tools-raw.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'toolify-categories.json');

// Configuration: Limit number of tools to scrape (set to null for all tools)
const MAX_TOOLS = process.env.MAX_TOOLS && process.env.MAX_TOOLS !== 'null' 
  ? parseInt(process.env.MAX_TOOLS) 
  : (process.env.MAX_TOOLS === 'null' ? null : 1000);
const MAX_PAGES = process.env.MAX_PAGES ? parseInt(process.env.MAX_PAGES) : 50;

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Extract all tools from Toolify.ai using a different approach:
 * 1. Collect all tool slugs from listing page
 * 2. Visit each tool's detail page to get complete data
 */
async function scrapeToolify() {
  console.log('🚀 Starting Toolify.ai scraping (new approach)...');
  if (MAX_TOOLS) {
    console.log(`📊 Tool limit: ${MAX_TOOLS} tools (set MAX_TOOLS=null for all 27k+ tools)`);
  } else {
    console.log(`📊 Scraping ALL tools (no limit)`);
  }
  console.log(`📄 Page limit: ${MAX_PAGES} pages\n`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allTools = [];
    const categories = new Set();
    const toolSlugs = new Set();
    
    // Step 1: Collect all tool slugs from /new page
    console.log('📋 Step 1: Collecting tool slugs from /new page...');
    const url = 'https://www.toolify.ai/new';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Function to collect tool slugs from current page
    const collectSlugs = async () => {
      return await page.evaluate(() => {
        const slugs = new Set();
        const links = document.querySelectorAll('a[href*="/tool/"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes('/tool/')) {
            const match = href.match(/\/tool\/([^\/\?]+)/);
            if (match && match[1]) {
              slugs.add(match[1]);
            }
          }
        });
        return Array.from(slugs);
      });
    };
    
    // Initial collection
    let newSlugs = await collectSlugs();
    newSlugs.forEach(slug => toolSlugs.add(slug));
    console.log(`✅ Found ${newSlugs.length} tool slugs (Total: ${toolSlugs.size})`);
    
    // Scroll and collect more slugs
    let scrollAttempts = 0;
    const maxScrollAttempts = 200;
    let noNewSlugsCount = 0;
    
    while (toolSlugs.size < (MAX_TOOLS || Infinity) && scrollAttempts < maxScrollAttempts) {
      scrollAttempts++;
      
      const previousHeight = await page.evaluate(() => document.body.scrollHeight);
      const previousSlugCount = toolSlugs.size;
      
      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for new content
      await page.waitForTimeout(3000);
      
      // Check if new content loaded
      try {
        await page.waitForFunction(
          (prevHeight) => document.body.scrollHeight > prevHeight,
          { timeout: 5000 },
          previousHeight
        );
      } catch (e) {
        // No new content
      }
      
      // Wait for images to load
      await page.waitForTimeout(5000);
      
      // Collect new slugs
      newSlugs = await collectSlugs();
      const beforeCount = toolSlugs.size;
      newSlugs.forEach(slug => toolSlugs.add(slug));
      const newCount = toolSlugs.size - beforeCount;
      
      if (newCount > 0) {
        noNewSlugsCount = 0;
        console.log(`✅ Scroll ${scrollAttempts}: Found ${newCount} new slugs (Total: ${toolSlugs.size} / ${MAX_TOOLS || 'unlimited'})`);
        
        if (MAX_TOOLS && toolSlugs.size >= MAX_TOOLS) {
          console.log(`✅ Reached tool limit of ${MAX_TOOLS}, stopping...`);
          break;
        }
      } else {
        noNewSlugsCount++;
        if (noNewSlugsCount >= 5) {
          console.log(`⚠️  No new slugs found after ${noNewSlugsCount} scrolls, stopping...`);
          break;
        }
      }
    }
    
    console.log(`\n📊 Collected ${toolSlugs.size} unique tool slugs\n`);
    
    // Step 2: Visit each tool's detail page to get complete data
    console.log('📋 Step 2: Visiting tool detail pages to extract data...');
    const slugsArray = Array.from(toolSlugs).slice(0, MAX_TOOLS || toolSlugs.size);
    console.log(`📄 Will visit ${slugsArray.length} tool pages...\n`);
    
    for (let i = 0; i < slugsArray.length; i++) {
      const slug = slugsArray[i];
      
      try {
        console.log(`[${i + 1}/${slugsArray.length}] Visiting tool: ${slug}`);
        
        const toolUrl = `https://www.toolify.ai/tool/${slug}`;
        await page.goto(toolUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(3000); // Wait for page to load
        
        // Wait for images to load
        try {
          await page.waitForSelector('img[src*="cdn-images.toolify.ai"]', { timeout: 5000 });
          await page.waitForTimeout(5000); // Wait for actual image to load (not placeholder)
        } catch (e) {
          // Continue even if image selector not found
        }
        
        const toolData = await page.evaluate(() => {
          const tool = {
            name: '',
            description: '',
            full_description: '',
            website_url: '',
            logo_url: '',
            category: '',
            pricing_model: 'FREE',
            platforms: [],
            feature_tags: []
          };
          
          // Extract name
          const nameSelectors = ['h1', '[class*="tool-name"]', '[class*="title"]', 'h2'];
          for (const sel of nameSelectors) {
            const nameEl = document.querySelector(sel);
            if (nameEl) {
              const name = nameEl.textContent.trim();
              if (name && name.length > 2) {
                tool.name = name;
                break;
              }
            }
          }
          
          // Extract description
          const descSelectors = ['[class*="description"]', '[class*="desc"]', 'p'];
          for (const sel of descSelectors) {
            const descEl = document.querySelector(sel);
            if (descEl) {
              const desc = descEl.textContent.trim();
              if (desc && desc.length > 10) {
                tool.description = desc;
                tool.full_description = desc;
                break;
              }
            }
          }
          
          // Extract website URL - look for external link
          const externalLink = document.querySelector('a[href^="http"]:not([href*="toolify.ai"])[rel="dofollow"]') ||
                               document.querySelector('a[href^="https"]:not([href*="toolify.ai"])') ||
                               document.querySelector('a[href^="http"]:not([href*="toolify.ai"])');
          if (externalLink) {
            tool.website_url = externalLink.getAttribute('href');
          }
          
          // Extract logo - find actual loaded image (not placeholder)
          const imgSelectors = [
            'img[src*="cdn-images.toolify.ai"][src*="website-logos"]',
            'img.el-image__inner[src*="cdn-images.toolify.ai"]',
            'img[src*="website-logos"]'
          ];
          
          for (const sel of imgSelectors) {
            const imgEl = document.querySelector(sel);
            if (imgEl) {
              // Check if image is actually loaded
              const isComplete = imgEl.complete && imgEl.naturalHeight > 0;
              const src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src');
              
              if (src && 
                  src.includes('cdn-images.toolify.ai') && 
                  src.includes('website-logos') &&
                  !src.includes('placeholder') &&
                  !src.includes('default') &&
                  !src.includes('toolify-logo') &&
                  !src.includes('logo.png') &&
                  !src.includes('skeleton') &&
                  src.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                tool.logo_url = src;
                break;
              }
            }
          }
          
          // Extract category
          const catSelectors = ['[class*="category"]', '.category', '[class*="tag"]', '.tag'];
          for (const sel of catSelectors) {
            const catEl = document.querySelector(sel);
            if (catEl) {
              const cat = catEl.textContent.trim();
              if (cat) {
                tool.category = cat;
                break;
              }
            }
          }
          
          // Extract pricing
          const pricingSelectors = ['[class*="pricing"]', '[class*="price"]', '.free', '.paid'];
          for (const sel of pricingSelectors) {
            const pricingEl = document.querySelector(sel);
            if (pricingEl) {
              const pricingText = pricingEl.textContent.toLowerCase();
              if (pricingText.includes('freemium')) {
                tool.pricing_model = 'FREEMIUM';
                break;
              } else if (pricingText.includes('trial')) {
                tool.pricing_model = 'FREE_TRIAL';
                break;
              } else if (pricingText.includes('paid') || pricingText.includes('$')) {
                tool.pricing_model = 'PAID';
                break;
              } else if (pricingText.includes('open') && pricingText.includes('source')) {
                tool.pricing_model = 'OPEN_SOURCE';
                break;
              }
            }
          }
          
          return tool;
        });
        
        // Only add if we have required data
        if (toolData.name && toolData.name.length > 2) {
          if (toolData.category) {
            categories.add(toolData.category);
          }
          allTools.push(toolData);
          console.log(`  ✅ Extracted: ${toolData.name}${toolData.logo_url ? ' (with logo)' : ' (no logo)'}`);
        } else {
          console.log(`  ⚠️  Skipped: Missing required data`);
        }
        
        // Small delay between requests
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`  ❌ Error extracting tool ${slug}:`, error.message);
      }
    }
    
    // Save raw data
    console.log(`\n💾 Saving ${allTools.length} tools to ${RAW_DATA_FILE}...`);
    await fs.writeJson(RAW_DATA_FILE, allTools, { spaces: 2 });
    
    // Save categories
    const categoryArray = Array.from(categories).map(name => ({
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: `Tools in ${name} category`,
      icon: '🤖'
    }));
    
    console.log(`💾 Saving ${categoryArray.length} categories to ${CATEGORIES_FILE}...`);
    await fs.writeJson(CATEGORIES_FILE, categoryArray, { spaces: 2 });
    
    console.log(`\n✅ Scraping complete!`);
    console.log(`   - Total tools extracted: ${allTools.length}${MAX_TOOLS ? ` (limited to ${MAX_TOOLS})` : ''}`);
    console.log(`   - Total categories found: ${categoryArray.length}`);
    if (MAX_TOOLS) {
      console.log(`   - Note: Scraping was limited to ${MAX_TOOLS} tools. Set MAX_TOOLS=null or remove it to scrape all tools.`);
    }
    
    return {
      tools: allTools,
      categories: categoryArray
    };
    
  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  scrapeToolify()
    .then(() => {
      console.log('✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = scrapeToolify;

