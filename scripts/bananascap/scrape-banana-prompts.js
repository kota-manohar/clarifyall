const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'banana-prompts-raw.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'banana-categories.json');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'banana-prompts-parsed.json');

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Scrape Image Prompts from BananaPrompts.xyz
 * URL: https://www.bananaprompts.xyz/explore
 */
async function scrapeBananaPrompts() {
  console.log('🚀 Starting BananaPrompts.xyz scraping...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://www.bananaprompts.xyz/explore';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('✅ Page loaded, checking for pagination/infinite scroll...\n');
    
    // Handle infinite scroll or "load more" buttons
    let previousCardCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (scrollAttempts < maxScrollAttempts) {
      // Try to find and click "Load More" or "Show More" button
      const loadMoreClicked = await page.evaluate(() => {
        // Try class-based selectors first
        const classSelectors = [
          '[class*="load-more" i]',
          '[class*="show-more" i]',
          '[data-load-more]',
          'button[class*="more" i]'
        ];
        
        for (const selector of classSelectors) {
          try {
            const button = document.querySelector(selector);
            if (button && button.offsetParent !== null) {
              button.click();
              return true;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        // Try text-based search
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
        for (const button of buttons) {
          const text = button.textContent.toLowerCase().trim();
          if ((text.includes('load more') || text.includes('show more') || text.includes('more')) 
              && button.offsetParent !== null) {
            button.click();
            return true;
          }
        }
        
        return false;
      });
      
      if (loadMoreClicked) {
        console.log(`  📄 Clicked "Load More" button...`);
        await page.waitForTimeout(3000);
        scrollAttempts++;
        continue;
      }
      
      // Try scrolling to bottom to trigger infinite scroll
      const currentCardCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href*="/prompts/"]').length;
      });
      
      if (currentCardCount === previousCardCount && scrollAttempts > 0) {
        // No new cards loaded, stop scrolling
        break;
      }
      
      if (currentCardCount > previousCardCount) {
        console.log(`  📜 Scrolled - found ${currentCardCount} cards (was ${previousCardCount})`);
        previousCardCount = currentCardCount;
      }
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(2000);
      scrollAttempts++;
    }
    
    console.log('✅ Finished loading all cards, extracting prompt cards...\n');
    
    // First, get all prompt cards from the page
    // Try multiple strategies to find cards
    const cardData = await page.evaluate(() => {
      const cards = [];
      const seenUrls = new Set();
      
      // Strategy 1: Find links to prompt pages (use /prompts/ plural)
      const promptLinks = document.querySelectorAll('a[href*="/prompts/"]');
      
      promptLinks.forEach((link, index) => {
        const url = link.href;
        if (seenUrls.has(url)) return;
        seenUrls.add(url);
        
        // Find the card container (parent element)
        let card = link;
        let cardContainer = link.closest('div, article, section, li');
        if (cardContainer) {
          card = cardContainer;
        }
        
        // Try to find if it's marked as premium
        // Check for premium badge/indicator within the card
        const cardText = card.textContent.toLowerCase();
        const premiumButton = Array.from(card.querySelectorAll('button')).find(btn => 
          btn.textContent.toLowerCase().includes('premium')
        );
        const isPremium = premiumButton !== undefined ||
                         card.querySelector('[class*="premium" i]') ||
                         card.querySelector('[data-premium="true"]') ||
                         card.getAttribute('data-premium') === 'true';
        
        // Get preview image if available - images are in img tags with alt text
        const img = card.querySelector('img');
        let imageUrl = '';
        if (img) {
          imageUrl = img.src || img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
        }
        
        // Get title from image alt text or link text
        let title = '';
        if (img && img.alt) {
          title = img.alt.trim();
        } else {
          const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="title" i], [class*="name" i]');
          title = titleEl ? titleEl.textContent.trim() : '';
          // Also try to get from link aria-label or text
          if (!title && link) {
            const linkText = link.getAttribute('aria-label') || link.textContent;
            if (linkText) {
              title = linkText.replace(/^View details for\s*/i, '').trim();
            }
          }
        }
        
        cards.push({
          index,
          url: url,
          isPremium,
          previewImage: imageUrl,
          previewTitle: title
        });
      });
      
      // Strategy 2: If no cards found, try finding by common card patterns
      if (cards.length === 0) {
        const cardElements = document.querySelectorAll('[class*="card" i], [class*="prompt" i], article, [role="article"]');
        
        cardElements.forEach((card, index) => {
        // Find link within card
        const link = card.querySelector('a[href*="/prompts/"]');
        if (!link) return;
        
        const url = link.href;
        if (seenUrls.has(url)) return;
        if (!url.includes('/prompts/')) return;
          
          seenUrls.add(url);
          
          // Check for premium
          const premiumButton = Array.from(card.querySelectorAll('button')).find(btn => 
            btn.textContent.toLowerCase().includes('premium')
          );
          const isPremium = premiumButton !== undefined ||
                           card.querySelector('[class*="premium" i]') ||
                           card.querySelector('[data-premium="true"]') ||
                           card.getAttribute('data-premium') === 'true';
          
          // Get preview image
          const img = card.querySelector('img');
          let imageUrl = '';
          if (img) {
            imageUrl = img.src || img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          }
          
          // Get title from image alt or link
          let title = '';
          if (img && img.alt) {
            title = img.alt.trim();
          } else {
            const titleEl = card.querySelector('h1, h2, h3, h4, [class*="title" i]');
            title = titleEl ? titleEl.textContent.trim() : '';
            if (!title && link) {
              const linkText = link.getAttribute('aria-label') || link.textContent;
              if (linkText) {
                title = linkText.replace(/^View details for\s*/i, '').trim();
              }
            }
          }
          
          cards.push({
            index,
            url: url,
            isPremium,
            previewImage: imageUrl,
            previewTitle: title
          });
        });
      }
      
      return cards;
    });
    
    console.log(`📋 Found ${cardData.length} prompt cards`);
    console.log(`   - Premium cards: ${cardData.filter(c => c.isPremium).length}`);
    console.log(`   - Non-premium cards: ${cardData.filter(c => !c.isPremium).length}\n`);
    
    // Filter out premium cards
    const nonPremiumCards = cardData.filter(card => !card.isPremium);
    console.log(`📝 Processing ${nonPremiumCards.length} non-premium cards...\n`);
    
    const prompts = [];
    const categoryMap = new Map();
    
    // Process each non-premium card
    for (let i = 0; i < nonPremiumCards.length; i++) {
      const card = nonPremiumCards[i];
      console.log(`[${i + 1}/${nonPremiumCards.length}] Processing: ${card.url}`);
      
      try {
        // Navigate to the prompt detail page
        await page.goto(card.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Extract prompt details from the detail page
        const promptData = await page.evaluate(() => {
          // Try to find the prompt title - multiple strategies
          let title = '';
          const titleSelectors = [
            'h1',
            'h2',
            '[class*="title" i]',
            '[class*="name" i]',
            '[data-title]',
            'header h1, header h2'
          ];
          
          for (const selector of titleSelectors) {
            const titleEl = document.querySelector(selector);
            if (titleEl) {
              title = titleEl.textContent.trim();
              if (title) break;
            }
          }
          
          // Try to find the prompt text - multiple strategies
          let promptText = '';
          const promptSelectors = [
            '[class*="prompt" i]',
            '[class*="text" i]',
            'pre',
            'code',
            'textarea',
            '[contenteditable="true"]',
            '[data-prompt]',
            '[id*="prompt" i]'
          ];
          
          for (const selector of promptSelectors) {
            const promptTextEl = document.querySelector(selector);
            if (promptTextEl) {
              promptText = promptTextEl.textContent.trim() || promptTextEl.value || promptTextEl.innerText || '';
              // Remove title if it's duplicated in prompt text
              if (title && promptText.startsWith(title)) {
                promptText = promptText.substring(title.length).trim();
              }
              if (promptText && promptText.length > 10) break;
            }
          }
          
          // Try to find description
          let description = '';
          const descSelectors = [
            '[class*="description" i]',
            '[class*="desc" i]',
            '[data-description]',
            'p:not([class*="prompt"])'
          ];
          
          for (const selector of descSelectors) {
            const descEl = document.querySelector(selector);
            if (descEl) {
              description = descEl.textContent.trim();
              if (description && description.length > 10 && description !== title) break;
            }
          }
          
          // Try to find category/tags
          let category = '';
          const categorySelectors = [
            '[class*="category" i]',
            '[data-category]',
            'nav [class*="category" i]',
            'header [class*="category" i]'
          ];
          
          for (const selector of categorySelectors) {
            const categoryEl = document.querySelector(selector);
            if (categoryEl) {
              category = categoryEl.textContent.trim();
              if (category) break;
            }
          }
          
          // Try to find example image - multiple strategies
          let exampleImageUrl = '';
          const imgSelectors = [
            'img[class*="example" i]',
            'img[class*="preview" i]',
            'img[class*="image" i]',
            'img[class*="result" i]',
            'img:not([src*="logo" i]):not([src*="icon" i]):not([src*="avatar" i])',
            'main img',
            'article img',
            '[class*="image-container" i] img'
          ];
          
          for (const selector of imgSelectors) {
            const imgEl = document.querySelector(selector);
            if (imgEl) {
              exampleImageUrl = imgEl.src || imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || '';
              // Skip very small images (likely icons)
              if (exampleImageUrl && imgEl.naturalWidth > 100) break;
            }
          }
          
          // Try to find tags
          const tagElements = document.querySelectorAll('[class*="tag" i], [class*="badge" i], [class*="chip" i], [data-tag]');
          const tags = Array.from(tagElements)
            .map(el => el.textContent.trim())
            .filter(t => t.length > 0 && t.length < 50)
            .slice(0, 10); // Limit to 10 tags
          
          return {
            title,
            prompt_text: promptText,
            description,
            category,
            example_image_url: exampleImageUrl,
            tags
          };
        });
        
        // If we got valid data, add it
        if (promptData.title || promptData.prompt_text) {
          // Determine category - default to "Gemini Prompts"
          const categoryName = 'Gemini Prompts';
          
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              name: categoryName,
              description: `Gemini AI image prompts from BananaPrompts.xyz`,
              icon: '✨',
              order_index: 0,
              prompts: []
            });
          }
          
          // Use detail page image, fallback to preview image from card
          const imageUrl = promptData.example_image_url || card.previewImage || '';
          
          const prompt = {
            title: promptData.title || card.previewTitle || `Prompt ${i + 1}`,
            description: promptData.description || '',
            prompt_text: promptData.prompt_text || '',
            example_image_url: imageUrl,
            tags: promptData.tags || [],
            order_index: categoryMap.get(categoryName).prompts.length
          };
          
          categoryMap.get(categoryName).prompts.push(prompt);
          prompts.push({ ...prompt, category: categoryName });
          
          const imageStatus = imageUrl ? '📷' : '❌ no image';
          console.log(`  ✅ Extracted: "${prompt.title}" ${imageStatus}`);
        } else {
          console.log(`  ⚠️  No valid data extracted - skipping`);
        }
        
        // Small delay between requests
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`  ❌ Error processing card: ${error.message}`);
        // Continue with next card even if this one fails
      }
      
      // Go back to explore page for next iteration (or stay if we're navigating directly)
      // Actually, we're navigating directly to each card URL, so no need to go back
    }
    
    // Convert category map to array
    const categories = Array.from(categoryMap.values());
    
    const data = {
      categories,
      totalPrompts: prompts.length,
      scrapedAt: new Date().toISOString()
    };
    
    console.log(`\n✅ Extracted ${categories.length} categories with ${prompts.length} prompts\n`);
    
    // Save raw data
    await fs.writeJSON(RAW_DATA_FILE, data, { spaces: 2 });
    console.log(`💾 Saved raw data to: ${RAW_DATA_FILE}`);
    
    // Extract categories separately
    const categoriesOnly = categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order_index: cat.order_index
    }));
    
    await fs.writeJSON(CATEGORIES_FILE, categoriesOnly, { spaces: 2 });
    console.log(`💾 Saved categories to: ${CATEGORIES_FILE}`);
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Total Prompts: ${prompts.length}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error scraping BananaPrompts:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  scrapeBananaPrompts()
    .then(() => {
      console.log('✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = scrapeBananaPrompts;

