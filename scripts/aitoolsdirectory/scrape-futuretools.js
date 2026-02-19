const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'futuretools-tools-raw.json');

fs.ensureDirSync(OUTPUT_DIR);

async function scrapeFutureTools() {
    function log(msg) {
        console.log(msg);
        try { fs.appendFileSync(path.join(OUTPUT_DIR, 'futuretools_debug_log.txt'), msg + '\n'); } catch (e) { }
    }

    log('🚀 Starting FutureTools.io scraping...');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        await page.setViewport({ width: 1920, height: 1080 });

        // --- Step 1: Scrape List ---
        const url = 'https://www.futuretools.io/';

        log(`📄 Loading list: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll to load items (FutureTools uses infinite scroll)
        console.log('📜 Scrolling to load items...');
        let previousHeight = 0;
        let scrollAttempts = 0;
        const MAX_SCROLLS = 50; // Increase for more tools

        while (scrollAttempts < MAX_SCROLLS) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(3000); // Wait for content to load

            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) {
                // Double check after additional wait
                await page.waitForTimeout(3000);
                const checkHeight = await page.evaluate('document.body.scrollHeight');
                if (checkHeight === previousHeight) break;
            }
            scrollAttempts++;
            if (scrollAttempts % 5 === 0) console.log(`   Scroll ${scrollAttempts}...`);
        }

        console.log('⛏️ Extracting list data...');
        let tools = await page.evaluate(() => {
            const items = [];

            // FutureTools uses specific card structure
            // Each tool is in an <a> with class 'tool-item-link-block---new' or 'tool-item-link-block---home'
            const cards = document.querySelectorAll('a.tool-item-link-block---new, a.tool-item-link-block---home');

            const seenUrls = new Set();

            cards.forEach(card => {
                const tool = {};

                // Get detail URL from the main card link
                const href = card.getAttribute('href');
                if (!href) return;

                tool.detail_url = href.startsWith('http') ? href : `https://www.futuretools.io${href}`;

                // Skip duplicates
                if (seenUrls.has(tool.detail_url)) return;
                seenUrls.add(tool.detail_url);

                // Extract tool name from nested link with class 'tool-item-link---new'
                const nameEl = card.querySelector('a.tool-item-link---new');
                tool.name = nameEl ? nameEl.innerText.trim() : '';

                // Extract logo/image
                const imgEl = card.querySelector('img');
                if (imgEl) {
                    tool.logo_url = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('srcset')?.split(' ')[0] || '';
                }

                // Extract website URL from the external link button
                const externalLinkEl = card.querySelector('a.tool-item-new-window---new');
                if (externalLinkEl) {
                    const externalHref = externalLinkEl.getAttribute('href');
                    if (externalHref && externalHref.startsWith('http')) {
                        tool.website_url = externalHref;
                    }
                }

                // Extract description - it's usually in a div or p after the external link
                const descEl = card.querySelector('p, div[class*="description"]');
                if (descEl) {
                    tool.description = descEl.innerText.trim();
                } else {
                    // Fallback: get text content from card, excluding the name
                    const allText = card.innerText.trim();
                    const lines = allText.split('\n').filter(line => line.trim().length > 0);
                    // Description is usually the second or third line
                    if (lines.length > 1) {
                        tool.description = lines.slice(1).join(' ').trim();
                    }
                }

                // Extract category/tags from links with class 'link-block-7'
                const tags = [];
                const tagEls = card.querySelectorAll('a.link-block-7');
                tagEls.forEach(t => {
                    const text = t.innerText.trim();
                    if (text && text.length < 50) tags.push(text);
                });

                // Also check for any other tag-like elements
                const otherTagEls = card.querySelectorAll('[class*="tag"], [class*="badge"], [class*="category"]');
                otherTagEls.forEach(t => {
                    const text = t.innerText.trim();
                    if (text && text.length < 50 && !tags.includes(text)) {
                        tags.push(text);
                    }
                });

                tool.category = tags.length > 0 ? tags[0] : '';
                tool.feature_tags = tags;

                // Extract pricing if visible
                const priceEl = card.querySelector('[class*="price"], [class*="pricing"]');
                if (priceEl) {
                    tool.pricing_model = priceEl.innerText.trim();
                }

                if (tool.name && tool.detail_url) {
                    items.push(tool);
                }
            });

            return items;
        });

        log(`\n📊 Found ${tools.length} tools in list.`);

        // --- Step 2: Visit Detail Pages (Optional - we already have website URLs from the list) ---
        // Since we're getting website URLs from the list page, we can skip visiting detail pages
        // to save time. If you need more data, uncomment the section below.

        /*
        console.log('🕵️ Visiting detail pages to get full details...');
    
        const limit = null; // Set to a number for testing, null for all
        const toolsToVisit = limit ? tools.slice(0, limit) : tools;
    
        log(`   Processing ${toolsToVisit.length} tools (Limit: ${limit || 'None'})...`);
    
        for (let i = 0; i < toolsToVisit.length; i++) {
          const tool = toolsToVisit[i];
          log(`[${i + 1}/${toolsToVisit.length}] Visiting ${tool.name}...`);
    
          try {
            log(`   Visiting ${tool.detail_url}`);
            await page.goto(tool.detail_url, { waitUntil: 'networkidle2', timeout: 60000 });
            await page.waitForTimeout(2000);
    
            const result = await page.evaluate(() => {
              const data = {};
              
              // Get full description
              const descSelectors = [
                'meta[name="description"]',
                'meta[property="og:description"]',
                '[class*="description"]',
                'p'
              ];
              
              for (const selector of descSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                  if (el.tagName === 'META') {
                    data.full_description = el.getAttribute('content');
                  } else {
                    data.full_description = el.innerText.trim();
                  }
                  if (data.full_description && data.full_description.length > 50) break;
                }
              }
              
              return data;
            });
    
            if (result.full_description) {
              tool.full_description = result.full_description;
            }
    
          } catch (e) {
            console.log(`   ❌ Error visiting ${tool.detail_url}: ${e.message}`);
          }
          
          await page.waitForTimeout(500);
        }
        */

        console.log(`\n💾 Saving complete data to ${RAW_DATA_FILE}...`);
        await fs.writeJson(RAW_DATA_FILE, tools, { spaces: 2 });
        console.log('✅ Scraping complete!');
        console.log(`   Total tools scraped: ${tools.length}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

if (require.main === module) {
    scrapeFutureTools();
}

module.exports = scrapeFutureTools;
