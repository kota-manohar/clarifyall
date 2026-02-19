const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'threads-prompts-raw.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'threads-categories.json');

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Scrape Gemini AI Prompts from Threads Profile
 * URL: https://www.threads.com/@fit_saahil
 */
async function scrapeThreadsPrompts() {
  console.log('🚀 Starting Threads Gemini AI Prompts scraping...\n');
  console.log('📄 Profile: @fit_saahil\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://www.threads.com/@fit_saahil';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('✅ Page loaded, waiting for content...\n');
    
    // Wait for posts to load
    try {
      await page.waitForSelector('article, [role="article"], div[data-testid*="post"], div[class*="post"], div[class*="thread"]', { timeout: 10000 });
      console.log('✅ Posts container found\n');
    } catch (e) {
      console.log('⚠️  Posts container not found, continuing anyway...\n');
    }
    
    await page.waitForTimeout(3000);
    
    console.log('📜 Scrolling to load all posts...\n');
    
    // Scroll to load all posts (Threads uses infinite scroll)
    let previousPostCount = 0;
    let currentPostCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;
    let noNewPostsCount = 0;
    
    do {
      previousPostCount = currentPostCount;
      
      // Get current post count
      currentPostCount = await page.evaluate(() => {
        // Threads posts are typically in article tags or divs with specific classes
        const posts = document.querySelectorAll('article, [role="article"], div[data-testid*="post"], div[class*="post"], div[class*="thread"], div[dir="auto"]');
        return posts.length;
      });
      
      // Scroll down gradually
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      
      await page.waitForTimeout(2000);
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(2000);
      
      scrollAttempts++;
      
      if (currentPostCount > previousPostCount) {
        console.log(`📜 Scroll ${scrollAttempts}: Found ${currentPostCount} posts...`);
        noNewPostsCount = 0;
      } else {
        noNewPostsCount++;
      }
      
      // Stop if no new posts found after 5 consecutive scrolls
      if (noNewPostsCount >= 5) {
        console.log(`⚠️  No new posts found after ${noNewPostsCount} scrolls, stopping...`);
        break;
      }
    } while (scrollAttempts < maxScrollAttempts);
    
    console.log(`\n✅ Loaded ${currentPostCount} posts\n`);
    
    // Extract prompts from posts
    const data = await page.evaluate(() => {
      const prompts = [];
      const categoryMap = new Map();
      
      // Find all posts - Threads uses various selectors
      const postSelectors = [
        'article',
        '[role="article"]',
        'div[data-testid*="post"]',
        'div[class*="post"]',
        'div[class*="thread"]',
        'div[dir="auto"]'
      ];
      
      let posts = [];
      for (const selector of postSelectors) {
        posts = document.querySelectorAll(selector);
        if (posts.length > 0) {
          console.log(`Found ${posts.length} posts using selector: ${selector}`);
          break;
        }
      }
      
      // If no posts found, try to find any text containers
      if (posts.length === 0) {
        posts = document.querySelectorAll('div, span, p');
        console.log(`Fallback: Found ${posts.length} text elements`);
      }
      
      posts.forEach((post, index) => {
        try {
          // Get post text content
          const postText = post.textContent || post.innerText || '';
          
          // Skip if text is too short or doesn't contain relevant keywords
          if (postText.length < 30) return;
          
          // Check if this post contains a Gemini prompt
          // Look for keywords like "Gemini", "prompt", "AI", etc.
          const isGeminiPrompt = /gemini|ai\s+prompt|prompt\s+for|generate|create.*image|photo.*prompt|midjourney|dall-e|stable\s+diffusion/i.test(postText);
          
          if (!isGeminiPrompt) return;
          
          // Extract prompt text - look for the longest text block that looks like a prompt
          let promptText = '';
          let title = '';
          
          // Try to find text in nested elements
          const textElements = post.querySelectorAll('p, span, div[dir="auto"], div[class*="text"], div[class*="content"]');
          
          if (textElements.length > 0) {
            // Find the longest text element that looks like a prompt
            let longestText = '';
            for (const el of textElements) {
              const text = el.textContent.trim() || el.innerText.trim();
              if (text.length > longestText.length && text.length > 50 && text.length < 2000) {
                // Check if it looks like a prompt
                if (/create|generate|make|design|photograph|portrait|image|photo|style|lighting|background|color|mood|photorealistic|cinematic/i.test(text)) {
                  longestText = text;
                }
              }
            }
            promptText = longestText || postText.substring(0, 2000).trim();
          } else {
            // Use the entire post text
            promptText = postText.substring(0, 2000).trim();
          }
          
          // Extract title from first line or heading
          const heading = post.querySelector('h1, h2, h3, h4, [class*="heading"], [class*="title"]');
          if (heading) {
            title = heading.textContent.trim() || heading.innerText.trim();
          } else {
            // Use first line of text as title (first 100 chars)
            const firstLine = promptText.split('\n')[0] || promptText.split('.')[0] || promptText.substring(0, 100);
            title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
            title = title.trim();
          }
          
          // Extract image if present
          let imageUrl = '';
          const imgSelectors = [
            'img[src*="scontent"]',
            'img[src*="cdn"]',
            'img[src*="fbcdn"]',
            'img[alt]',
            'img'
          ];
          
          for (const selector of imgSelectors) {
            const img = post.querySelector(selector);
            if (img) {
              imageUrl = img.src || img.getAttribute('src') || img.getAttribute('data-src') || '';
              if (imageUrl) {
                // Clean up image URL - remove query parameters
                if (imageUrl.includes('?')) {
                  imageUrl = imageUrl.split('?')[0];
                }
                break;
              }
            }
          }
          
          // Extract tags/hashtags
          const tags = [];
          const hashtags = postText.match(/#[\w]+/g);
          if (hashtags) {
            tags.push(...hashtags.map(tag => tag.replace('#', '').toLowerCase()));
          }
          
          // Determine category from content or tags
          let category = 'Gemini Prompts';
          if (tags.length > 0) {
            // Use first relevant tag as category
            const relevantTags = tags.filter(t => 
              !['gemini', 'ai', 'prompt', 'prompts', 'threads', 'thread'].includes(t.toLowerCase())
            );
            if (relevantTags.length > 0) {
              category = relevantTags[0].charAt(0).toUpperCase() + relevantTags[0].slice(1);
            }
          }
          
          // Check if prompt text is valid (at least 30 characters)
          if (promptText && promptText.length > 30) {
            if (!categoryMap.has(category)) {
              categoryMap.set(category, []);
            }
            
            categoryMap.get(category).push({
              title: title || `Gemini Prompt ${index + 1}`,
              description: '',
              prompt_text: promptText,
              example_image_url: imageUrl,
              order_index: categoryMap.get(category).length,
              tags: tags.slice(0, 10) // Limit to 10 tags
            });
          }
        } catch (error) {
          console.error(`Error extracting post ${index}:`, error.message);
        }
      });
      
      // Convert category map to array
      const categories = Array.from(categoryMap.entries()).map(([name, prompts], index) => ({
        name: name,
        description: `Gemini AI prompts from ${name}`,
        icon: '🎨',
        order_index: index,
        prompts: prompts
      }));
      
      return {
        categories: categories,
        totalPrompts: Array.from(categoryMap.values()).reduce((sum, prompts) => sum + prompts.length, 0)
      };
    });
    
    console.log(`✅ Extracted ${data.totalPrompts} prompts in ${data.categories.length} categories\n`);
    
    // Save raw data
    fs.writeFileSync(RAW_DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Saved raw data to: ${RAW_DATA_FILE}`);
    
    // Save categories separately
    const categoriesData = data.categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order_index: cat.order_index
    }));
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesData, null, 2));
    console.log(`💾 Saved categories to: ${CATEGORIES_FILE}`);
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${data.categories.length}`);
    console.log(`   - Total Prompts: ${data.totalPrompts}`);
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
if (require.main === module) {
  scrapeThreadsPrompts()
    .then(() => {
      console.log('\n✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = scrapeThreadsPrompts;

