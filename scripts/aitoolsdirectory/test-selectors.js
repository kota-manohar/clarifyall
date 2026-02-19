const puppeteer = require('puppeteer');

async function testSelectors() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Loading FutureTools.io...');
    await page.goto('https://www.futuretools.io/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Scroll a bit
    await page.evaluate('window.scrollTo(0, 1000)');
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
        const data = {};

        // Try different selectors
        data.toolItemLinkBlockNew = document.querySelectorAll('a.tool-item-link-block---new').length;
        data.toolItemLinkBlockHome = document.querySelectorAll('a.tool-item-link-block---home').length;
        data.anyToolItemLink = document.querySelectorAll('a[class*="tool-item"]').length;
        data.linksWithTools = document.querySelectorAll('a[href*="/tools/"]').length;

        // Get first few class names
        data.sampleClasses = [];
        const allLinks = document.querySelectorAll('a');
        for (let i = 0; i < Math.min(20, allLinks.length); i++) {
            if (allLinks[i].className) {
                data.sampleClasses.push(allLinks[i].className);
            }
        }

        // Try to find tool cards another way
        const allDivs = document.querySelectorAll('div[class*="tool"], div[class*="card"]');
        data.toolDivs = allDivs.length;

        return data;
    });

    console.log('Results:', JSON.stringify(results, null, 2));

    await browser.close();
}

testSelectors();
