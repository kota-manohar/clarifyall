const puppeteer = require('puppeteer');

async function testSelectors() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Loading Futurepedia.io...');
    await page.goto('https://www.futurepedia.io/ai-tools/personal-assistant', { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Scroll a bit
    await page.evaluate('window.scrollTo(0, 1000)');
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
        const data = {};

        // Try different selectors
        data.toolLinks = document.querySelectorAll('a[href*="/tool/"]').length;
        data.hoverTextUnderline = document.querySelectorAll('a.hover\\:text-underline').length;
        data.utmLinks = document.querySelectorAll('a[href*="utm_source=futurepedia"]').length;

        // Get sample tool data
        const firstToolLink = document.querySelector('a[href*="/tool/"]');
        if (firstToolLink) {
            data.sampleTool = {
                href: firstToolLink.getAttribute('href'),
                hasP: !!firstToolLink.querySelector('p'),
                hasImg: !!firstToolLink.querySelector('img'),
                pText: firstToolLink.querySelector('p')?.innerText,
                imgSrc: firstToolLink.querySelector('img')?.src
            };

            // Check parent for other elements
            let parent = firstToolLink.parentElement;
            if (parent) {
                data.sampleTool.parentHasCategories = parent.querySelectorAll('a.hover\\:text-underline[href*="/ai-tools/"]').length;
                data.sampleTool.parentHasVisit = parent.querySelectorAll('a[href*="utm_source=futurepedia"]').length;
            }
        }

        return data;
    });

    console.log('Results:', JSON.stringify(results, null, 2));

    await browser.close();
}

testSelectors();
