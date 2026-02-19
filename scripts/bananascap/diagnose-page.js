const puppeteer = require('puppeteer');

/**
 * Diagnostic script to analyze the page structure
 */
async function diagnosePage() {
  console.log('🔍 Diagnosing page structure...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://www.bananaprompts.xyz/explore';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('✅ Page loaded, analyzing structure...\n');
    
    // Get comprehensive page structure
    const pageInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        allLinks: [],
        allImages: [],
        allCards: [],
        potentialPromptElements: [],
        pageHTML: document.body.innerHTML.substring(0, 5000) // First 5000 chars
      };
      
      // Find all links
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.href;
        if (href && (href.includes('/prompt/') || href.includes('/p/') || href.includes('/explore/') || href.includes('prompt'))) {
          info.allLinks.push({
            href: href,
            text: link.textContent.trim().substring(0, 50),
            className: link.className,
            id: link.id,
            parentTag: link.parentElement ? link.parentElement.tagName : '',
            parentClass: link.parentElement ? link.parentElement.className : ''
          });
        }
      });
      
      // Find all images
      const images = document.querySelectorAll('img');
      images.forEach((img, idx) => {
        if (idx < 20) { // Limit to first 20
          info.allImages.push({
            src: img.src || img.getAttribute('src') || '',
            alt: img.alt || '',
            className: img.className,
            parentTag: img.parentElement ? img.parentElement.tagName : '',
            parentClass: img.parentElement ? img.parentElement.className : ''
          });
        }
      });
      
      // Find potential card containers
      const cardSelectors = [
        '[class*="card" i]',
        '[class*="prompt" i]',
        'article',
        '[role="article"]',
        '[class*="grid" i] > *',
        '[class*="item" i]',
        '[class*="tile" i]'
      ];
      
      cardSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            info.allCards.push({
              selector: selector,
              count: elements.length,
              firstElement: {
                tagName: elements[0].tagName,
                className: elements[0].className,
                id: elements[0].id,
                innerHTML: elements[0].innerHTML.substring(0, 200)
              }
            });
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      });
      
      // Find elements with "premium" in them
      const premiumElements = document.querySelectorAll('*');
      const premiumInfo = [];
      premiumElements.forEach(el => {
        const text = (el.textContent || '').toLowerCase();
        const className = (typeof el.className === 'string' ? el.className : (el.className?.baseVal || '')).toLowerCase();
        if (text.includes('premium') || className.includes('premium')) {
          premiumInfo.push({
            tagName: el.tagName,
            className: typeof el.className === 'string' ? el.className : String(el.className),
            text: (el.textContent || '').trim().substring(0, 50)
          });
        }
      });
      info.premiumElements = premiumInfo.slice(0, 10);
      
      // Get all divs with classes (to understand structure)
      const divs = document.querySelectorAll('div[class]');
      const uniqueClasses = new Set();
      divs.forEach(div => {
        if (div.className) {
          div.className.split(' ').forEach(cls => {
            if (cls && cls.length > 0) {
              uniqueClasses.add(cls);
            }
          });
        }
      });
      info.uniqueDivClasses = Array.from(uniqueClasses).slice(0, 50);
      
      return info;
    });
    
    console.log('📊 Page Analysis Results:\n');
    console.log(`Title: ${pageInfo.title}`);
    console.log(`URL: ${pageInfo.url}`);
    console.log(`\n🔗 Found ${pageInfo.allLinks.length} potential prompt links:`);
    pageInfo.allLinks.forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.href}`);
      console.log(`     Text: "${link.text}"`);
      console.log(`     Class: ${link.className}`);
      console.log(`     Parent: <${link.parentTag}> class="${link.parentClass}"`);
      console.log('');
    });
    
    console.log(`\n🖼️  Found ${pageInfo.allImages.length} images (showing first 20):`);
    pageInfo.allImages.slice(0, 10).forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.src.substring(0, 80)}`);
      console.log(`     Alt: "${img.alt}"`);
      console.log(`     Class: ${img.className}`);
    });
    
    console.log(`\n📦 Card containers found:`);
    pageInfo.allCards.forEach(card => {
      console.log(`  Selector: ${card.selector} - Found ${card.count} elements`);
      if (card.firstElement) {
        console.log(`    First element: <${card.firstElement.tagName}> class="${card.firstElement.className}"`);
      }
    });
    
    console.log(`\n💎 Premium elements found: ${pageInfo.premiumElements.length}`);
    pageInfo.premiumElements.forEach((el, idx) => {
      console.log(`  ${idx + 1}. <${el.tagName}> class="${el.className}"`);
      console.log(`     Text: "${el.text}"`);
    });
    
    console.log(`\n📋 Unique div classes (first 30):`);
    pageInfo.uniqueDivClasses.slice(0, 30).forEach(cls => {
      console.log(`  - ${cls}`);
    });
    
    // Save full HTML for inspection
    const fs = require('fs-extra');
    const path = require('path');
    const outputDir = path.join(__dirname, 'output');
    fs.ensureDirSync(outputDir);
    
    const fullHTML = await page.content();
    fs.writeFileSync(path.join(outputDir, 'page-source.html'), fullHTML, 'utf8');
    console.log(`\n💾 Saved full page HTML to: output/page-source.html`);
    
    fs.writeFileSync(path.join(outputDir, 'page-analysis.json'), JSON.stringify(pageInfo, null, 2), 'utf8');
    console.log(`💾 Saved page analysis to: output/page-analysis.json`);
    
    // Wait a bit so user can see the browser
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run
diagnosePage()
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });

