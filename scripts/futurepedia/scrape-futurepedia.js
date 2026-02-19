const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'futurepedia-tools-raw.json');

fs.ensureDirSync(OUTPUT_DIR);

async function scrapeFuturepedia() {
    function log(msg) {
        console.log(msg);
        try { fs.appendFileSync(path.join(OUTPUT_DIR, 'futurepedia_debug_log.txt'), msg + '\n'); } catch (e) { }
    }

    log('🚀 Starting Futurepedia.io scraping...');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        await page.setViewport({ width: 1920, height: 1080 });

        const url = 'https://www.futurepedia.io/ai-tools/no-code?page=3';

        log(`📄 Loading page: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForTimeout(5000);

        console.log('📜 Scrolling to load items...');
        let previousHeight = 0;
        let scrollAttempts = 0;
        const MAX_SCROLLS = 30;

        while (scrollAttempts < MAX_SCROLLS) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(3000);

            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) {
                await page.waitForTimeout(3000);
                const checkHeight = await page.evaluate('document.body.scrollHeight');
                if (checkHeight === previousHeight) break;
            }
            scrollAttempts++;
            if (scrollAttempts % 5 === 0) console.log(`   Scroll ${scrollAttempts}...`);
        }

        console.log('⛏️ Extracting tool data...');
        let tools = await page.evaluate(() => {
            const items = [];
            const seenUrls = new Set();

            const toolLinks = document.querySelectorAll('a[href*="/tool/"]');
            const toolGroups = new Map();

            toolLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || !href.includes('/tool/')) return;
                const fullUrl = href.startsWith('http') ? href : `https://www.futurepedia.io${href}`;
                if (!toolGroups.has(fullUrl)) {
                    toolGroups.set(fullUrl, []);
                }
                toolGroups.get(fullUrl).push(link);
            });

            toolGroups.forEach((links, detailUrl) => {
                if (seenUrls.has(detailUrl)) return;
                seenUrls.add(detailUrl);

                const tool = {
                    detail_url: detailUrl,
                    name: '',
                    logo_url: '',
                    description: '',
                    website_url: '',
                    category: '',
                    feature_tags: [],
                    pricing_model: ''
                };

                links.forEach(link => {
                    if (!tool.name) {
                        const nameEl = link.querySelector('p');
                        if (nameEl) {
                            const name = nameEl.innerText.trim();
                            if (name && name.length > 0 && name.length < 100) {
                                tool.name = name;
                            }
                        }
                    }
                    if (!tool.logo_url) {
                        const imgEl = link.querySelector('img');
                        if (imgEl) {
                            const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('srcset')?.split(' ')[0] || '';
                            if (src && src.startsWith('http')) {
                                tool.logo_url = src;
                            }
                        }
                    }
                });

                if (tool.name && tool.detail_url) {
                    items.push(tool);
                }
            });

            return items;
        });

        log(`\n📊 Found ${tools.length} tools on page.`);

        console.log('\n🕵️ Visiting detail pages for complete data...');
        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            console.log(`[${i + 1}/${tools.length}] Visiting ${tool.name}...`);

            try {
                await page.goto(tool.detail_url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(2000);

                const detailData = await page.evaluate(() => {
                    const data = {};

                    // Extract logo from header with srcset
                    const logoImg = document.querySelector('img[alt*="Logo"]');
                    if (logoImg) {
                        const srcset = logoImg.getAttribute('srcset');
                        const src = logoImg.getAttribute('src');
                        if (srcset) {
                            const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
                            data.logo_url = urls[urls.length - 1] || src;
                        } else if (src) {
                            data.logo_url = src;
                        }
                    }

                    // Get short description
                    const shortDescP = document.querySelector('p.my-2.text-\\[1\\.4rem\\]');
                    if (shortDescP) {
                        data.description = shortDescP.innerText.trim();
                    }

                    // Get full description from "What is [Tool]?" section
                    const richTextBlock = document.querySelector('.rich-text-block');
                    if (richTextBlock) {
                        const headings = richTextBlock.querySelectorAll('h2, h3');
                        for (const heading of headings) {
                            if (heading.innerText.toLowerCase().includes('what is')) {
                                const nextP = heading.nextElementSibling;
                                if (nextP && nextP.tagName === 'P') {
                                    data.full_description = nextP.innerText.trim();
                                    break;
                                }
                            }
                        }
                    }

                    // Get website URL from Visit Site button
                    const visitButtons = document.querySelectorAll('a');
                    for (const button of visitButtons) {
                        if (button.innerText.includes('Visit Site') || button.innerText.includes('Visit')) {
                            const href = button.getAttribute('href');
                            if (href && href.startsWith('http') && !href.includes('futurepedia.io')) {
                                data.website_url = href;
                                break;
                            }
                        }
                    }

                    // Get categories from "AI Categories:" section - find the specific paragraph
                    const categoryParagraphs = document.querySelectorAll('p');
                    for (const p of categoryParagraphs) {
                        const text = p.innerText;
                        if (text.includes('AI Categories:')) {
                            // Found the paragraph with AI Categories
                            const categoryLinks = p.querySelectorAll('a[href*="/ai-tools/"]');
                            const tags = [];
                            categoryLinks.forEach(link => {
                                const categoryText = link.innerText.trim();
                                if (categoryText && categoryText.length < 50 && !tags.includes(categoryText)) {
                                    tags.push(categoryText);
                                }
                            });
                            data.feature_tags = tags;
                            break;
                        }
                    }

                    // Get pricing from "Pricing Model:" section
                    const bodyText = document.body.innerText;
                    const pricingMatch = bodyText.match(/Pricing Model:\s*([^\n]+)/);
                    if (pricingMatch) {
                        const pricing = pricingMatch[1].toLowerCase();
                        if (pricing.includes('freemium')) {
                            data.pricing_model = 'FREEMIUM';
                        } else if (pricing.includes('free trial')) {
                            data.pricing_model = 'FREE_TRIAL';
                        } else if (pricing.includes('paid') || pricing.includes('$')) {
                            data.pricing_model = 'PAID';
                        } else if (pricing.includes('free')) {
                            data.pricing_model = 'FREE';
                        }
                    }

                    return data;
                });

                // Merge detail data
                if (detailData.logo_url) {
                    tool.logo_url = detailData.logo_url;
                }
                if (detailData.description) {
                    tool.description = detailData.description;
                }
                if (detailData.full_description) {
                    tool.full_description = detailData.full_description;
                }
                if (detailData.website_url) {
                    tool.website_url = detailData.website_url;
                    console.log(`   🔗 Found URL: ${detailData.website_url}`);
                } else {
                    console.log('   ⚠️  No website URL found');
                }
                if (detailData.pricing_model) {
                    tool.pricing_model = detailData.pricing_model;
                }
                if (detailData.feature_tags && detailData.feature_tags.length > 0) {
                    tool.feature_tags = detailData.feature_tags;
                    tool.category = detailData.feature_tags[0];
                    console.log(`   📂 Categories: ${detailData.feature_tags.join(', ')}`);
                }

                await page.waitForTimeout(500);

            } catch (error) {
                console.log(`   ❌ Error visiting detail page: ${error.message}`);
            }
        }

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
    scrapeFuturepedia();
}

module.exports = scrapeFuturepedia;
