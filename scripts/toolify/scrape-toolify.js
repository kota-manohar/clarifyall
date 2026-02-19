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
    const toolSlugs = new Map(); // Map slug -> { slug, logo_url }
    
    // Step 1: Collect all tool slugs and logos from /most-used page
    console.log('📋 Step 1: Collecting tool slugs and logos from /most-used page...');
    const url = 'https://www.toolify.ai/new';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Function to collect tool slugs and logos from current page
    const collectSlugsAndLogos = async () => {
      return await page.evaluate(() => {
        const tools = [];
        const links = document.querySelectorAll('a[href*="/tool/"]');
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes('/tool/')) {
            const match = href.match(/\/tool\/([^\/\?]+)/);
            if (match && match[1]) {
              const slug = match[1];
              
              // Find logo image in this card
              const images = link.querySelectorAll('img');
              let logoUrl = '';
              
              for (const img of images) {
                // Try multiple sources for the image URL
                const src = img.currentSrc || img.src || img.getAttribute('src') || '';
                const dataSrc = img.getAttribute('data-src') || '';
                const dataLazySrc = img.getAttribute('data-lazy-src') || '';
                const dataOriginal = img.getAttribute('data-original') || '';
                const dataUrl = img.getAttribute('data-url') || '';
                
                // Also check background-image style
                const style = img.getAttribute('style') || '';
                const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
                const bgUrl = bgMatch ? bgMatch[1] : '';
                
                const allSrcs = [src, dataSrc, dataLazySrc, dataOriginal, dataUrl, bgUrl].filter(s => s);
                
                for (const s of allSrcs) {
                  // Check if it's a logo from cdn-images.toolify.ai
                  if (s && 
                      s.includes('cdn-images.toolify.ai') && 
                      s.includes('website-logos') &&
                      !s.includes('placeholder') &&
                      !s.includes('default') &&
                      !s.includes('toolify-logo') &&
                      !s.includes('logo.png') &&
                      !s.includes('skeleton') &&
                      !s.includes('card_default') &&
                      s.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                    // Accept the logo URL even if image is not fully loaded yet
                    // (lazy-loaded images might not be complete)
                    logoUrl = s;
                    break;
                  }
                }
                if (logoUrl) break;
              }
              
              // If still not found, try to find image in nested elements
              if (!logoUrl) {
                const nestedImages = link.querySelectorAll('img, [style*="background-image"]');
                for (const img of nestedImages) {
                  let src = '';
                  if (img.tagName === 'IMG') {
                    src = img.currentSrc || img.src || img.getAttribute('src') || '';
                    const dataSrc = img.getAttribute('data-src') || '';
                    const dataLazySrc = img.getAttribute('data-lazy-src') || '';
                    src = src || dataSrc || dataLazySrc;
                  } else {
                    // Check background-image style
                    const style = img.getAttribute('style') || '';
                    const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
                    if (bgMatch) {
                      src = bgMatch[1];
                    }
                  }
                  
                  if (src && 
                      src.includes('cdn-images.toolify.ai') && 
                      src.includes('website-logos') &&
                      !src.includes('placeholder') &&
                      !src.includes('default') &&
                      !src.includes('toolify-logo') &&
                      !src.includes('logo.png') &&
                      !src.includes('skeleton') &&
                      !src.includes('card_default') &&
                      src.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                    logoUrl = src;
                    break;
                  }
                }
              }
              
              tools.push({ slug, logo_url: logoUrl });
            }
          }
        });
        
        return tools;
      });
    };
    
    // Track logo URLs to prevent duplicates across all tools
    // NOTE: This removes logos if the same logo URL is used by multiple tools
    // This helps prevent duplicate/default logos, but may remove legitimate shared logos
    // Set REMOVE_DUPLICATE_LOGOS=false to disable this feature
    const REMOVE_DUPLICATE_LOGOS = process.env.REMOVE_DUPLICATE_LOGOS !== 'false';
    const seenLogoUrls = new Map(); // Map logoUrl -> slug (first tool that uses it)
    
    // Initial collection
    let newTools = await collectSlugsAndLogos();
    newTools.forEach(tool => {
      // Only add if slug not already seen
      if (!toolSlugs.has(tool.slug)) {
        // Check for duplicate logo URLs (only if enabled)
        if (tool.logo_url && REMOVE_DUPLICATE_LOGOS) {
          if (seenLogoUrls.has(tool.logo_url)) {
            // This logo is already used by another tool - mark as duplicate
            const originalSlug = seenLogoUrls.get(tool.logo_url);
            console.log(`  ⚠️  Duplicate logo detected: ${tool.slug} shares logo with ${originalSlug}`);
            tool.logo_url = ''; // Remove duplicate logo
          } else {
            // First time seeing this logo - mark it
            seenLogoUrls.set(tool.logo_url, tool.slug);
          }
        } else if (tool.logo_url && !REMOVE_DUPLICATE_LOGOS) {
          // Just track it for logging, but don't remove
          if (!seenLogoUrls.has(tool.logo_url)) {
            seenLogoUrls.set(tool.logo_url, tool.slug);
          }
        }
        toolSlugs.set(tool.slug, tool);
      }
    });
    console.log(`✅ Found ${newTools.length} tools (Total: ${toolSlugs.size})`);
    
    // Scroll and collect more tools
    let scrollAttempts = 0;
    const maxScrollAttempts = 200;
    let noNewToolsCount = 0;
    
    while (toolSlugs.size < (MAX_TOOLS || Infinity) && scrollAttempts < maxScrollAttempts) {
      scrollAttempts++;
      
      const previousHeight = await page.evaluate(() => document.body.scrollHeight);
      const previousCount = toolSlugs.size;
      
      // Scroll down gradually to trigger lazy loading
      await page.evaluate(() => {
        const scrollHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        // Scroll to bottom
        window.scrollTo(0, scrollHeight);
        // Also scroll back up a bit and down again to trigger lazy loading
        window.scrollTo(0, scrollHeight - viewportHeight);
        window.scrollTo(0, scrollHeight);
      });
      
      // Wait for new content
      await page.waitForTimeout(2000);
      
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
      
      // Wait longer for images to load (logos are lazy-loaded)
      // Give more time for lazy-loaded images to appear in DOM and load
      await page.waitForTimeout(3000); // Initial wait for DOM to update
      
      // Scroll to trigger lazy loading of images in viewport
      // Scroll to different positions to trigger lazy loading
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      
      // Scroll to different positions with delays
      await page.evaluate((pos) => window.scrollTo(0, pos), scrollHeight - viewportHeight * 2);
      await page.waitForTimeout(500);
      await page.evaluate((pos) => window.scrollTo(0, pos), scrollHeight - viewportHeight);
      await page.waitForTimeout(500);
      await page.evaluate((pos) => window.scrollTo(0, pos), scrollHeight);
      await page.waitForTimeout(2000);
      
      // Try to wait for images to appear in DOM (even if not loaded)
      try {
        await page.waitForFunction(
          () => {
            // Check if there are any logo images in the DOM (even if not loaded)
            const images = document.querySelectorAll('img');
            let logoImageCount = 0;
            images.forEach(img => {
              const src = img.currentSrc || img.src || img.getAttribute('src') || 
                         img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
              if (src && src.includes('cdn-images.toolify.ai') && src.includes('website-logos')) {
                logoImageCount++;
              }
            });
            return logoImageCount > 0;
          },
          { timeout: 15000 }
        );
      } catch (e) {
        // Continue even if images don't appear
      }
      
      // Wait for images to actually load (check multiple times with longer waits)
      for (let imgWaitAttempt = 0; imgWaitAttempt < 5; imgWaitAttempt++) {
        await page.waitForTimeout(4000); // Wait 4 seconds between checks
        
        // Check if images are loading/loaded
        const imagesLoading = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          let loadingCount = 0;
          let loadedCount = 0;
          let logoUrlCount = 0;
          
          images.forEach(img => {
            const src = img.currentSrc || img.src || img.getAttribute('src') || 
                       img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || 
                       img.getAttribute('data-original') || '';
            if (src && src.includes('cdn-images.toolify.ai') && src.includes('website-logos') &&
                !src.includes('placeholder') && !src.includes('default') && !src.includes('card_default')) {
              logoUrlCount++;
              if (img.complete && img.naturalHeight > 0) {
                loadedCount++;
              } else {
                loadingCount++;
              }
            }
          });
          
          return { loadingCount, loadedCount, logoUrlCount, total: images.length };
        });
        
        // Log progress
        if (imagesLoading.logoUrlCount > 0) {
          console.log(`  📸 Found ${imagesLoading.logoUrlCount} logo images (${imagesLoading.loadedCount} loaded, ${imagesLoading.loadingCount} loading)`);
        }
        
        // If we have logo URLs in DOM, we can proceed (even if not fully loaded)
        if (imagesLoading.logoUrlCount > 0) {
          // Wait a bit more for images to load
          await page.waitForTimeout(3000);
          break;
        }
      }
      
      // Final wait to ensure all images have time to load
      await page.waitForTimeout(3000);
      
      // Collect new tools
      newTools = await collectSlugsAndLogos();
      const beforeCount = toolSlugs.size;
      
      newTools.forEach(tool => {
        // Only add if slug not already seen
        if (!toolSlugs.has(tool.slug)) {
          // Check for duplicate logo URLs (only if enabled)
          if (tool.logo_url && REMOVE_DUPLICATE_LOGOS) {
            if (seenLogoUrls.has(tool.logo_url)) {
              // This logo is already used by another tool - mark as duplicate
              const originalSlug = seenLogoUrls.get(tool.logo_url);
              console.log(`  ⚠️  Duplicate logo detected: ${tool.slug} shares logo with ${originalSlug}`);
              tool.logo_url = ''; // Remove duplicate logo
            } else {
              // First time seeing this logo - mark it
              seenLogoUrls.set(tool.logo_url, tool.slug);
            }
          } else if (tool.logo_url && !REMOVE_DUPLICATE_LOGOS) {
            // Just track it for logging, but don't remove
            if (!seenLogoUrls.has(tool.logo_url)) {
              seenLogoUrls.set(tool.logo_url, tool.slug);
            }
          }
          toolSlugs.set(tool.slug, tool);
        }
      });
      
      const newCount = toolSlugs.size - beforeCount;
      
      if (newCount > 0) {
        noNewToolsCount = 0;
        console.log(`✅ Scroll ${scrollAttempts}: Found ${newCount} new tools (Total: ${toolSlugs.size} / ${MAX_TOOLS || 'unlimited'})`);
        
        if (MAX_TOOLS && toolSlugs.size >= MAX_TOOLS) {
          console.log(`✅ Reached tool limit of ${MAX_TOOLS}, stopping...`);
          break;
        }
      } else {
        noNewToolsCount++;
        if (noNewToolsCount >= 5) {
          console.log(`⚠️  No new tools found after ${noNewToolsCount} scrolls, stopping...`);
          break;
        }
      }
    }
    
    console.log(`\n📊 Collected ${toolSlugs.size} unique tools (${seenLogoUrls.size} unique logos)\n`);
    
    // Step 2: Visit each tool's detail page to get complete data
    console.log('📋 Step 2: Visiting tool detail pages to extract data...');
    const toolsArray = Array.from(toolSlugs.values()).slice(0, MAX_TOOLS || toolSlugs.size);
    console.log(`📄 Will visit ${toolsArray.length} tool pages...\n`);
    
    for (let i = 0; i < toolsArray.length; i++) {
      const toolInfo = toolsArray[i];
      const slug = toolInfo.slug;
      const logoUrlFromListing = toolInfo.logo_url || '';
      
      try {
        console.log(`[${i + 1}/${toolsArray.length}] Visiting tool: ${slug}`);
        
        const toolUrl = `https://www.toolify.ai/tool/${slug}`;
        await page.goto(toolUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(3000); // Wait for page to load
        
        // Wait for images to load - wait longer for actual images
        try {
          await page.waitForSelector('img', { timeout: 10000 });
          // Wait for actual image to load (not placeholder) - check multiple times
          for (let waitAttempt = 0; waitAttempt < 5; waitAttempt++) {
            await page.waitForTimeout(2000);
            const hasRealImage = await page.evaluate(() => {
              // Try to find any logo image
              const images = document.querySelectorAll('img');
              for (const img of images) {
                const src = img.currentSrc || img.src || img.getAttribute('src') || 
                           img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
                if (src && 
                    src.includes('cdn-images.toolify.ai') && 
                    src.includes('website-logos') &&
                    !src.includes('placeholder') &&
                    !src.includes('default') &&
                    !src.includes('toolify-logo') &&
                    !src.includes('logo.png') &&
                    !src.includes('skeleton') &&
                    src.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                  return true;
                }
              }
              return false;
            });
            if (hasRealImage) break;
          }
        } catch (e) {
          // Continue even if image selector not found
        }
        
        const toolData = await page.evaluate((toolSlug) => {
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
          
          // Extract short description (first paragraph or meta description)
          const descSelectors = [
            'meta[name="description"]',
            '[class*="tool-description"]',
            '[class*="description"]',
            '[class*="desc"]',
            'p'
          ];
          for (const sel of descSelectors) {
            const descEl = document.querySelector(sel);
            if (descEl) {
              let desc = '';
              if (sel.startsWith('meta')) {
                desc = descEl.getAttribute('content') || '';
              } else {
                desc = descEl.textContent.trim();
              }
              if (desc && desc.length > 10) {
                tool.description = desc.substring(0, 500); // Keep short description as before
                break;
              }
            }
          }
          
          // Extract full description from multiple sections: tool-detail-information, Core Features, Use Cases, FAQ
          const fullDescParts = [];
          
          // 1. Extract from tool-detail-information section
          const toolDetailInfoEl = document.querySelector('[class*="tool-detail-information"]');
          if (toolDetailInfoEl) {
            const paragraphs = toolDetailInfoEl.querySelectorAll('p');
            if (paragraphs.length > 0) {
              const text = Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(p => p.length > 20)
                .join('\n\n');
              if (text && text.length > 50) {
                fullDescParts.push(text);
              }
            } else {
              const text = toolDetailInfoEl.textContent.trim();
              if (text && text.length > 100) {
                fullDescParts.push(text);
              }
            }
          }
          
          // 2. Extract Core Features section
          const coreFeaturesSelectors = [
            'h2:contains("Core Features"), h3:contains("Core Features"), h4:contains("Core Features")',
            '[class*="core-features"]',
            '[class*="coreFeatures"]',
            '[class*="features"]',
            '[id*="core-features"]',
            '[id*="features"]'
          ];
          
          let coreFeaturesText = '';
          // Try to find heading with "Core Features" and get content after it
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          for (const heading of headings) {
            const headingText = heading.textContent.trim().toLowerCase();
            if (headingText.includes('core features') || headingText.includes('features')) {
              // Get next sibling or parent's next sibling content
              let nextEl = heading.nextElementSibling;
              let attempts = 0;
              while (nextEl && attempts < 5) {
                const text = nextEl.textContent.trim();
                if (text.length > 50) {
                  coreFeaturesText += text + '\n\n';
                }
                nextEl = nextEl.nextElementSibling;
                attempts++;
              }
              // Also try parent container
              const parent = heading.parentElement;
              if (parent) {
                const parentText = parent.textContent.trim();
                if (parentText.length > 100) {
                  coreFeaturesText = parentText;
                }
              }
              break;
            }
          }
          
          // Also try class-based selectors
          if (!coreFeaturesText) {
            for (const sel of coreFeaturesSelectors) {
              if (sel.includes('contains')) continue; // Skip CSS :contains (not supported)
              const el = document.querySelector(sel);
              if (el) {
                const text = el.textContent.trim();
                if (text.length > 50) {
                  coreFeaturesText = text;
                  break;
                }
              }
            }
          }
          
          if (coreFeaturesText) {
            fullDescParts.push('## Core Features\n\n' + coreFeaturesText);
          }
          
          // 3. Extract Use Cases section
          let useCasesText = '';
          for (const heading of headings) {
            const headingText = heading.textContent.trim().toLowerCase();
            if (headingText.includes('use cases') || headingText.includes('use case')) {
              let nextEl = heading.nextElementSibling;
              let attempts = 0;
              while (nextEl && attempts < 5) {
                const text = nextEl.textContent.trim();
                if (text.length > 50) {
                  useCasesText += text + '\n\n';
                }
                nextEl = nextEl.nextElementSibling;
                attempts++;
              }
              const parent = heading.parentElement;
              if (parent) {
                const parentText = parent.textContent.trim();
                if (parentText.length > 100) {
                  useCasesText = parentText;
                }
              }
              break;
            }
          }
          
          // Also try class-based selectors
          if (!useCasesText) {
            const useCasesSelectors = [
              '[class*="use-cases"]',
              '[class*="useCases"]',
              '[class*="use-case"]',
              '[id*="use-cases"]',
              '[id*="useCases"]'
            ];
            for (const sel of useCasesSelectors) {
              const el = document.querySelector(sel);
              if (el) {
                const text = el.textContent.trim();
                if (text.length > 50) {
                  useCasesText = text;
                  break;
                }
              }
            }
          }
          
          if (useCasesText) {
            fullDescParts.push('## Use Cases\n\n' + useCasesText);
          }
          
          // 4. Extract FAQ section
          let faqText = '';
          for (const heading of headings) {
            const headingText = heading.textContent.trim().toLowerCase();
            if (headingText.includes('faq') || headingText.includes('frequently asked') || headingText.includes('questions')) {
              let nextEl = heading.nextElementSibling;
              let attempts = 0;
              while (nextEl && attempts < 10) {
                const text = nextEl.textContent.trim();
                if (text.length > 30) {
                  faqText += text + '\n\n';
                }
                nextEl = nextEl.nextElementSibling;
                attempts++;
              }
              const parent = heading.parentElement;
              if (parent) {
                const parentText = parent.textContent.trim();
                if (parentText.length > 100) {
                  faqText = parentText;
                }
              }
              break;
            }
          }
          
          // Also try class-based selectors
          if (!faqText) {
            const faqSelectors = [
              '[class*="faq"]',
              '[class*="FAQ"]',
              '[id*="faq"]',
              '[id*="FAQ"]',
              '[class*="questions"]'
            ];
            for (const sel of faqSelectors) {
              const el = document.querySelector(sel);
              if (el) {
                const text = el.textContent.trim();
                if (text.length > 50) {
                  faqText = text;
                  break;
                }
              }
            }
          }
          
          if (faqText) {
            fullDescParts.push('## FAQ\n\n' + faqText);
          }
          
          // Combine all parts
          if (fullDescParts.length > 0) {
            tool.full_description = fullDescParts.join('\n\n').substring(0, 10000); // Increased limit to 10000 chars
          } else {
            // Fallback: try general selectors
            const fullDescSelectors = [
              '[class*="tool-detail"]',
              '[class*="tool-content"]',
              '[class*="tool-body"]',
              '[class*="description-full"]',
              '[class*="full-description"]',
              'article',
              '[class*="content"]',
              'main',
              '[role="main"]'
            ];
            
            for (const sel of fullDescSelectors) {
              const fullDescEl = document.querySelector(sel);
              if (fullDescEl) {
                const paragraphs = fullDescEl.querySelectorAll('p');
                if (paragraphs.length > 0) {
                  const text = Array.from(paragraphs)
                    .map(p => p.textContent.trim())
                    .filter(p => p.length > 20)
                    .join('\n\n');
                  if (text && text.length > 100) {
                    tool.full_description = text.substring(0, 10000);
                    break;
                  }
                }
              }
            }
          }
          
          // If full description still not found, use description as fallback
          if (!tool.full_description && tool.description) {
            tool.full_description = tool.description;
          }
          
          // Extract website URL - look for external link
          const externalLink = document.querySelector('a[href^="http"]:not([href*="toolify.ai"])[rel="dofollow"]') ||
                               document.querySelector('a[href^="https"]:not([href*="toolify.ai"])') ||
                               document.querySelector('a[href^="http"]:not([href*="toolify.ai"])');
          if (externalLink) {
            tool.website_url = externalLink.getAttribute('href');
          }
          
          // Extract logo - find actual loaded image (not placeholder)
          // Try to find the main tool logo (usually in header or main content area)
          const logoContainers = [
            'header img',
            '[class*="tool-header"] img',
            '[class*="tool-logo"] img',
            '[class*="logo"] img',
            '[class*="tool-pic"] img',
            '[class*="tool-image"] img',
            'img[src*="cdn-images.toolify.ai"][src*="website-logos"]'
          ];
          
          let logoFound = false;
          for (const containerSel of logoContainers) {
            const imgEls = document.querySelectorAll(containerSel);
            for (const imgEl of imgEls) {
              // Check multiple sources for the image URL
              const allSrcs = [
                imgEl.currentSrc,
                imgEl.src,
                imgEl.getAttribute('src'),
                imgEl.getAttribute('data-src'),
                imgEl.getAttribute('data-lazy-src'),
                imgEl.getAttribute('data-original'),
                imgEl.getAttribute('data-url')
              ].filter(s => s);
              
              // Also check background-image style
              const style = imgEl.getAttribute('style') || '';
              const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
              if (bgMatch) {
                allSrcs.push(bgMatch[1]);
              }
              
              for (const src of allSrcs) {
                if (src && 
                    src.includes('cdn-images.toolify.ai') && 
                    src.includes('website-logos') &&
                    !src.includes('placeholder') &&
                    !src.includes('default') &&
                    !src.includes('toolify-logo') &&
                    !src.includes('logo.png') &&
                    !src.includes('skeleton') &&
                    src.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                  // Accept the logo URL even if image is not fully loaded yet
                  tool.logo_url = src;
                  logoFound = true;
                  break;
                }
              }
              if (logoFound) break;
            }
            if (logoFound) break;
          }
          
          // If still not found, try all images on page
          if (!logoFound) {
            const allImages = document.querySelectorAll('img');
            for (const imgEl of allImages) {
              const allSrcs = [
                imgEl.currentSrc,
                imgEl.src,
                imgEl.getAttribute('src'),
                imgEl.getAttribute('data-src'),
                imgEl.getAttribute('data-lazy-src'),
                imgEl.getAttribute('data-original'),
                imgEl.getAttribute('data-url')
              ].filter(s => s);
              
              for (const src of allSrcs) {
                if (src && 
                    src.includes('cdn-images.toolify.ai') &&
                    src.includes('website-logos') &&
                    !src.includes('placeholder') &&
                    !src.includes('default') &&
                    !src.includes('toolify-logo') &&
                    !src.includes('logo.png') &&
                    !src.includes('skeleton') &&
                    src.match(/website-logos\/\d{8}\/\d+_\d+_\d+\.(webp|png|jpg|jpeg)/)) {
                  // Accept even if not fully loaded
                  tool.logo_url = src;
                  logoFound = true;
                  break;
                }
              }
              if (logoFound) break;
            }
          }
          
          // If still not found, try background-image styles
          if (!logoFound) {
            const elementsWithBg = document.querySelectorAll('[style*="background-image"]');
            for (const el of elementsWithBg) {
              const style = el.getAttribute('style') || '';
              const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
              if (bgMatch) {
                const src = bgMatch[1];
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
                  logoFound = true;
                  break;
                }
              }
            }
          }
          
          // Extract category - try multiple selectors and locations
          const catSelectors = [
            'a[href*="/category/"]',
            'a[href*="/c/"]',
            '[class*="category"] a',
            '[class*="category-tag"]',
            '[class*="tool-category"]',
            '.category',
            '[class*="tag"]',
            '.tag',
            '[class*="category"]',
            'nav a[href*="category"]'
          ];
          
          let categoryFound = false;
          for (const sel of catSelectors) {
            const catEls = document.querySelectorAll(sel);
            for (const catEl of catEls) {
              let cat = '';
              // If it's a link, get text or href
              if (catEl.tagName === 'A') {
                cat = catEl.textContent.trim() || catEl.getAttribute('href')?.split('/').pop() || '';
              } else {
                cat = catEl.textContent.trim();
              }
              
              // Clean up category name
              if (cat) {
                cat = cat.replace(/^\/category\//, '')
                         .replace(/^\/c\//, '')
                         .replace(/[^\w\s-]/g, '')
                         .trim();
                
                // Skip if it's too short or looks like a URL
                if (cat.length > 2 && cat.length < 50 && !cat.includes('http')) {
                  tool.category = cat;
                  categoryFound = true;
                  break;
                }
              }
            }
            if (categoryFound) break;
          }
          
          // If category still not found, try breadcrumbs or meta tags
          if (!categoryFound) {
            const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a, nav[aria-label*="breadcrumb"] a');
            for (const bc of breadcrumbs) {
              const text = bc.textContent.trim();
              const href = bc.getAttribute('href') || '';
              if (href.includes('category') || href.includes('/c/')) {
                const cat = text || href.split('/').pop();
                if (cat && cat.length > 2 && cat.length < 50) {
                  tool.category = cat;
                  break;
                }
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
        }, slug);
        
        // Only add if we have required data
        if (toolData.name && toolData.name.length > 2) {
          // Use logo from listing page if available (more reliable)
          // Only use detail page logo if listing page didn't have one
          if (logoUrlFromListing) {
            toolData.logo_url = logoUrlFromListing;
          } else if (toolData.logo_url) {
            // Check if this logo URL was already seen (from listing page) - only if enabled
            if (REMOVE_DUPLICATE_LOGOS && seenLogoUrls.has(toolData.logo_url)) {
              const originalSlug = seenLogoUrls.get(toolData.logo_url);
              console.log(`  ⚠️  Duplicate logo detected for ${toolData.name}, shares logo with ${originalSlug}`);
              toolData.logo_url = ''; // Remove duplicate logo
            } else {
              if (!seenLogoUrls.has(toolData.logo_url)) {
                seenLogoUrls.set(toolData.logo_url, slug);
              }
            }
          }
          
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

