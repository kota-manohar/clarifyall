const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'aitoolsdirectory-tools-raw.json');

fs.ensureDirSync(OUTPUT_DIR);

async function resolveUrl(url) {
  if (!url || !url.includes('aitoolsdirectory.com')) return url;
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 400
    });
    return response.request.res.responseUrl || url;
  } catch (error) {
    console.log(`   ⚠️ Failed to resolve URL ${url}: ${error.message}`);
    return url;
  }
}

async function scrapeAiToolsDirectory() {
  function log(msg) {
    console.log(msg);
    try { fs.appendFileSync(path.join(OUTPUT_DIR, 'debug_log.txt'), msg + '\n'); } catch (e) { }
  }
  log('🚀 Starting AI Tools Directory scraping...');

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
    const url = 'https://aitoolsdirectory.com/';

    log(`📄 Loading list: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll to load items
    console.log('📜 Scrolling to load items...');
    let previousHeight = 0;
    let scrollAttempts = 0;
    const MAX_SCROLLS = 30;

    while (scrollAttempts < MAX_SCROLLS) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000);

      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) {
        await page.waitForTimeout(2000);
        const checkHeight = await page.evaluate('document.body.scrollHeight');
        if (checkHeight === previousHeight) break;
      }
      scrollAttempts++;
      if (scrollAttempts % 5 === 0) console.log(`   Scroll ${scrollAttempts}...`);
    }

    console.log('⛏️ Extracting list data...');
    let tools = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('.sv-tile, .sv-card, div[class*="tile"], a[class*="tile"]');

      cards.forEach(card => {
        const tool = {};

        const nameEl = card.querySelector('h3, .sv-tile__title, [class*="title"]');
        tool.name = nameEl ? nameEl.innerText.trim() : '';

        // Robust image extraction
        const imgEl = card.querySelector('img');
        if (imgEl) {
          tool.logo_url = imgEl.src || imgEl.getAttribute('data-src') || '';
          // If src is a placeholder or empty, try srcset
          if ((!tool.logo_url || tool.logo_url.includes('placeholder')) && imgEl.srcset) {
            tool.logo_url = imgEl.srcset.split(' ')[0];
          }
        }

        // Fallback: check background image
        if (!tool.logo_url) {
          const divWithBg = card.querySelector('[style*="background-image"]');
          if (divWithBg) {
            const style = divWithBg.getAttribute('style');
            const match = style.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) tool.logo_url = match[1];
          }
        }

        const linkEl = card.tagName === 'A' ? card : card.querySelector('a');
        tool.detail_url = linkEl ? linkEl.href : '';

        const descEl = card.querySelector('.sv-tile__description, [class*="description"], p');
        tool.description = descEl ? descEl.innerText.trim() : '';

        const tags = [];
        const tagEls = card.querySelectorAll('.sv-tag, .chip, [class*="tag"], [class*="badge"]');
        tagEls.forEach(t => tags.push(t.innerText.trim()));
        tool.category = tags.length > 0 ? tags[0] : '';
        tool.feature_tags = tags;

        const priceEl = card.querySelector('[class*="price"]');
        if (priceEl) tool.pricing_model = priceEl.innerText.trim();

        if (!tool.logo_url) {
          console.log(`   ⚠️ No logo found for ${tool.name}. HTML:`, card.outerHTML.substring(0, 500));
        }

        if (tool.name && tool.detail_url) {
          items.push(tool);
        }
      });
      return items;
    });

    log(`\n📊 Found ${tools.length} tools in list.`);

    // --- Step 2: Visit Detail Pages ---
    console.log('🕵️ Visiting detail pages to get website URLs...');

    // Limit for testing (set to null for full run)
    const limit = 5;
    const toolsToVisit = tools.filter(t => t.name.includes('Liminary'));
    // const toolsToVisit = limit ? tools.slice(0, limit) : tools;

    log(`   Processing ${toolsToVisit.length} tools (Limit: ${limit || 'None'})...`);

    for (let i = 0; i < toolsToVisit.length; i++) {
      const tool = toolsToVisit[i];
      log(`[${i + 1}/${toolsToVisit.length}] Visiting ${tool.name}...`);

      try {
        log(`   Visiting ${tool.detail_url}`);
        await page.goto(tool.detail_url, { waitUntil: 'networkidle2', timeout: 60000 });
        log('   After goto');
        await page.waitForTimeout(2000); // Wait for render

        log('   Testing evaluate...');
        const evalResult = await page.evaluate(() => 'Evaluate returned this string!');
        log(`   Evaluate result: ${evalResult}`);

        log('   Before evaluate');
        const result = await page.evaluate(() => {
          const debug = [];
          debug.push(`Current URL: ${document.location.href}`);

          // Look for redirect link (link.aitoolsdirectory.com)
          const redirectLink = document.querySelector('a[href*="link.aitoolsdirectory.com"]');
          if (redirectLink) return { websiteUrl: redirectLink.href, debug };

          // Look for "Visit Website" or similar button
          const buttons = Array.from(document.querySelectorAll('a, button'));

          debug.push(`Found ${buttons.length} buttons/links`);
          // Log first 10 buttons for debugging
          buttons.slice(0, 10).forEach(b => {
            debug.push(` - Text: "${b.innerText}", Href: "${b.href}", Class: "${b.className}"`);
          });

          // Prioritize buttons with "Visit" or "Website" text
          const visitBtn = buttons.find(b => {
            const text = b.innerText.toLowerCase();
            const href = b.href.toLowerCase();
            return (text.includes('visit') || text.includes('website') || text.includes('open') || text.includes('try')) &&
              b.href && b.href.startsWith('http') &&
              !href.includes('aitoolsdirectory.com') &&
              !href.includes('x.com') &&
              !href.includes('twitter.com') &&
              !href.includes('facebook.com') &&
              !href.includes('linkedin.com') &&
              !href.includes('instagram.com') &&
              !href.includes('discord.com') &&
              !href.includes('youtube.com');
          });

          if (visitBtn) return { websiteUrl: visitBtn.href, debug };

          // Fallback: any external link that is not social media
          const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]'))
            .filter(a => {
              const href = a.href.toLowerCase();
              return !href.includes('aitoolsdirectory.com') &&
                !href.includes('facebook') &&
                !href.includes('twitter') &&
                !href.includes('x.com') &&
                !href.includes('linkedin') &&
                !href.includes('instagram') &&
                !href.includes('discord') &&
                !href.includes('youtube') &&
                !href.includes('tiktok') &&
                !href.includes('reddit');
            });

          if (externalLinks.length > 0) return { websiteUrl: externalLinks[0].href, debug };

          return { websiteUrl: null, debug };
        });

        if (result.debug) {
          log('   PAGE DEBUG:');
          result.debug.forEach(d => log(`      ${d}`));
        }

        const websiteUrl = result.websiteUrl;

        if (websiteUrl) {
          // Resolve redirect if needed
          const finalUrl = await resolveUrl(websiteUrl);
          tool.website_url = finalUrl;
          console.log(`   🔗 Found URL: ${finalUrl} (Original: ${websiteUrl})`);
        } else {
          console.log('   ⚠️ No website URL found.');
        }

      } catch (e) {
        console.log(`   ❌ Error visiting ${tool.detail_url}: ${e.message}`);
      }
    }

    console.log(`\n💾 Saving complete data to ${RAW_DATA_FILE}...`);
    await fs.writeJson(RAW_DATA_FILE, tools, { spaces: 2 });
    console.log('✅ Scraping complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

if (require.main === module) {
  scrapeAiToolsDirectory();
}
