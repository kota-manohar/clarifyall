const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'filmora-prompts-raw.json');
const CATEGORIES_FILE = path.join(OUTPUT_DIR, 'filmora-categories.json');

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Scrape Gemini AI Baby Photo Prompts from Filmora
 * URL: https://filmora.wondershare.com/ai-prompt/gemini-ai-baby-photo-prompt.html
 * 
 * @param {number} maxPrompts - Maximum number of prompts to extract (0 = unlimited)
 */
async function scrapeFilmoraPrompts(maxPrompts = 0) {
  console.log('🚀 Starting Filmora Gemini AI Baby Photo Prompts scraping...\n');
  if (maxPrompts > 0) {
    console.log(`⚠️  Limiting extraction to ${maxPrompts} prompts\n`);
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://filmora.wondershare.com/ai-prompt/diwali-prompt-for-gemini.html';
    console.log(`📄 Loading: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('✅ Page loaded, extracting data...\n');
    
    // Wait for template items to load
    await page.waitForSelector('.template-item', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Scroll to load all items (lazy loading)
    console.log('📜 Scrolling to load all items...');
    let previousItemCount = 0;
    let currentItemCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;
    
    do {
      previousItemCount = currentItemCount;
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for new items to load
      await page.waitForTimeout(2000);
      
      // Count current items
      currentItemCount = await page.evaluate(() => {
        return document.querySelectorAll('.template-item').length;
      });
      
      console.log(`  Found ${currentItemCount} items (scroll attempt ${scrollAttempts + 1})`);
      scrollAttempts++;
      
      // If no new items loaded, try scrolling a bit more
      if (currentItemCount === previousItemCount && scrollAttempts < maxScrollAttempts) {
        // Scroll a bit more and wait
        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });
        await page.waitForTimeout(1000);
        currentItemCount = await page.evaluate(() => {
          return document.querySelectorAll('.template-item').length;
        });
      }
      
    } while (currentItemCount > previousItemCount && scrollAttempts < maxScrollAttempts);
    
    console.log(`✅ Loaded ${currentItemCount} total items\n`);
    
    // Extract categories and prompts
    const data = await page.evaluate(async () => {
      const categories = [];
      const categoryMap = new Map();
      
      // Find all template items
      const templateItems = document.querySelectorAll('.template-item');
      
      console.log(`Found ${templateItems.length} template items`);
      
      const allPrompts = [];
      
      // Extract data from each template item
      templateItems.forEach((item, index) => {
        // Get image
        const imgEl = item.querySelector('img.template-image');
        let exampleImageUrl = '';
        if (imgEl) {
          exampleImageUrl = imgEl.src || imgEl.getAttribute('src') || '';
          if (exampleImageUrl && exampleImageUrl.includes('?')) {
            exampleImageUrl = exampleImageUrl.split('?')[0];
          }
        }
        
        // Get title
        const titleEl = item.querySelector('.template-title');
        let promptTitle = '';
        if (titleEl) {
          promptTitle = titleEl.textContent.trim();
        }
        
        // Get category
        const categoryEl = item.querySelector('.template-category');
        let categoryName = '';
        if (categoryEl) {
          categoryName = categoryEl.textContent.trim();
        }
        
        // Default category if not found
        if (!categoryName || categoryName.length < 2) {
          categoryName = 'Baby Photo';
        }
        
        // Try to get prompt text from the item (might be in a data attribute or hidden)
        let promptText = '';
        
        // Check if there's a data attribute with prompt text
        const dataPrompt = item.getAttribute('data-prompt') || item.getAttribute('data-description');
        if (dataPrompt) {
          promptText = dataPrompt;
        }
        
        // Store item data for later modal extraction
        if (promptTitle && exampleImageUrl) {
          allPrompts.push({
            title: promptTitle,
            category: categoryName,
            imageUrl: exampleImageUrl,
            index: index,
            element: item
          });
        }
      });
      
      // Now we need to click each item to get the prompt text from the modal
      // But we'll do this in the Puppeteer context, not in evaluate
      return {
        prompts: allPrompts,
        totalItems: templateItems.length
      };
    });
    
    console.log(`Found ${data.prompts.length} template items with images\n`);
    
    // Limit prompts if maxPrompts is set
    const promptsToProcess = maxPrompts > 0 
      ? data.prompts.slice(0, maxPrompts)
      : data.prompts;
    
    if (maxPrompts > 0 && promptsToProcess.length < data.prompts.length) {
      console.log(`⚠️  Processing ${promptsToProcess.length} of ${data.prompts.length} prompts (limited by maxPrompts=${maxPrompts})\n`);
    }
    
    // Now click each item to get prompt text from modal
    const categoriesList = [];
    const categoryGroups = new Map();
    
    for (let i = 0; i < promptsToProcess.length; i++) {
      const promptData = promptsToProcess[i];
      
      try {
        console.log(`[${i + 1}/${promptsToProcess.length}] Extracting: "${promptData.title}"`);
        
        // Click on the image element inside the template item to open modal
        const clicked = await page.evaluate((index) => {
          const items = document.querySelectorAll('.template-item');
          if (items[index]) {
            // Try clicking on the image element first (this is what opens the modal)
            const img = items[index].querySelector('.template-image, .template-media img, img');
            if (img) {
              img.click();
              return true;
            }
            // Fallback to clicking the whole item
            items[index].click();
            return true;
          }
          return false;
        }, promptData.index);
        
        if (!clicked) {
          console.log(`  ⚠️  Could not find template item at index ${promptData.index}`);
          continue;
        }
        
        // Wait for modal to open - wait for the modal dialog to appear
        let modalOpened = false;
        try {
          // Wait for the modal dialog to appear
          await page.waitForSelector('.modal-dialog, .modal-body, .modal-content, .modal', { timeout: 10000 });
          modalOpened = true;
          console.log(`  ✓ Modal opened`);
          
          // Wait for iframe to appear (if present)
          try {
            await page.waitForSelector('iframe', { timeout: 5000, visible: true });
            console.log(`  ✓ Iframe found, waiting for it to load...`);
            
            // Wait for iframe to load its content
            await page.waitForTimeout(3000);
            
            // Wait for iframe content to be ready
            await page.evaluate(() => {
              const iframe = document.querySelector('iframe');
              if (iframe && iframe.contentDocument) {
                return iframe.contentDocument.readyState === 'complete';
              }
              return false;
            });
            
            // Additional wait for iframe content
            await page.waitForTimeout(2000);
          } catch (e) {
            console.log(`  ℹ️  No iframe found or iframe not ready yet`);
          }
          
          // Wait for modal content to load (outside iframe)
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log(`  ⚠️  Modal didn't open for "${promptData.title}"`);
        }
        
        // Wait for modal content to fully load - wait for .detail-row.description to appear
        if (modalOpened) {
          try {
            // Wait for the modal body to be fully loaded
            await page.waitForSelector('.modal-body', { timeout: 10000, visible: true });
            console.log(`  ✓ Modal body loaded`);
            
            // Wait for the detail-row.description section to appear
            await page.waitForSelector('.detail-row.description', { timeout: 10000, visible: true });
            console.log(`  ✓ Detail row description section found`);
            
            // Wait for the actual detail-description element
            await page.waitForSelector('.detail-row.description .detail-description', { timeout: 10000, visible: true });
            console.log(`  ✓ Detail description element found`);
            
            // Poll for content to be populated (wait up to 10 seconds)
            let hasContent = false;
            let attempts = 0;
            const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
            
            while (!hasContent && attempts < maxAttempts) {
              await page.waitForTimeout(500);
              hasContent = await page.evaluate(() => {
                const el = document.querySelector('.detail-row.description .detail-description');
                return el && el.textContent.trim().length > 50; // At least 50 characters
              });
              
              if (!hasContent) {
                attempts++;
                if (attempts % 5 === 0) {
                  console.log(`  ⏳ Waiting for content to populate... (attempt ${attempts}/${maxAttempts})`);
                }
              }
            }
            
            if (hasContent) {
              console.log(`  ✓ Content populated (${attempts} attempts)`);
            } else {
              console.log(`  ⚠️  Content not populated after ${maxAttempts} attempts`);
            }
            
            // Scroll the element into view to ensure it's visible
            await page.evaluate(() => {
              const el = document.querySelector('.detail-row.description .detail-description');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
            
            // Wait after scrolling
            await page.waitForTimeout(1000);
          } catch (e) {
            console.log(`  ⚠️  Waiting for .detail-row.description .detail-description failed, trying alternatives...`);
            try {
              // Try waiting for just .detail-description
              await page.waitForSelector('.detail-description', { timeout: 10000, visible: true });
              console.log(`  ✓ Found .detail-description element`);
              
              // Poll for content
              let hasContent = false;
              let attempts = 0;
              const maxAttempts = 20;
              
              while (!hasContent && attempts < maxAttempts) {
                await page.waitForTimeout(500);
                hasContent = await page.evaluate(() => {
                  const el = document.querySelector('.detail-description');
                  return el && el.textContent.trim().length > 50;
                });
                attempts++;
              }
              
              if (hasContent) {
                console.log(`  ✓ Content populated (${attempts} attempts)`);
              }
              
              // Scroll the element into view
              await page.evaluate(() => {
                const el = document.querySelector('.detail-description');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              });
              
              await page.waitForTimeout(1000);
            } catch (e2) {
              console.log(`  ⚠️  .detail-description not visible, waiting longer...`);
              await page.waitForTimeout(5000);
            }
          }
        }
        
        // Final wait to ensure all content is loaded
        await page.waitForTimeout(2000);
        
        // Extract prompt text from modal
        const modalData = await page.evaluate((defaultCategory) => {
          // Try multiple modal selectors
          let modal = document.querySelector('.modal-body');
          if (!modal) {
            modal = document.querySelector('.modal-content');
          }
          if (!modal) {
            modal = document.querySelector('.modal');
          }
          if (!modal) {
            console.log('Modal not found');
            return null;
          }
          
          // Check if there's an iframe and try to access its content
          const iframe = modal.querySelector('iframe');
          if (iframe && iframe.contentDocument) {
            try {
              const iframeBody = iframe.contentDocument.body;
              if (iframeBody) {
                // Try to find content in iframe
                const iframeDetailRow = iframeBody.querySelector('.detail-row.description');
                if (iframeDetailRow) {
                  const iframeDesc = iframeDetailRow.querySelector('.detail-description');
                  if (iframeDesc && iframeDesc.textContent.trim()) {
                    console.log('Found content in iframe');
                    modal = iframeBody;
                  }
                }
              }
            } catch (e) {
              console.log('Cannot access iframe content (cross-origin):', e.message);
            }
          }
          
          // Debug: Log modal structure
          const modalHTML = modal.innerHTML.substring(0, 500);
          console.log('Modal HTML preview:', modalHTML);
          
          // Get prompt text from .detail-row.description .detail-description - this is the main selector
          let promptText = '';
          
          // First try the specific path: .detail-row.description .detail-description
          const detailRow = modal.querySelector('.detail-row.description');
          console.log('Found .detail-row.description:', !!detailRow);
          
          if (detailRow) {
            const descEl = detailRow.querySelector('.detail-description');
            console.log('Found .detail-description inside .detail-row.description:', !!descEl);
            
            if (descEl) {
              // Try both textContent and innerText
              promptText = descEl.textContent.trim() || descEl.innerText.trim();
              console.log('Extracted text length:', promptText.length);
              console.log('First 100 chars:', promptText.substring(0, 100));
              
              // If still empty, try getting from innerHTML
              if (!promptText && descEl.innerHTML) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = descEl.innerHTML;
                promptText = tempDiv.textContent.trim() || tempDiv.innerText.trim();
                console.log('Extracted from innerHTML, length:', promptText.length);
              }
            } else {
              console.log('No .detail-description found inside .detail-row.description');
              // Try to find any div inside detail-row.description
              const allDivs = detailRow.querySelectorAll('div');
              console.log('Found', allDivs.length, 'divs inside .detail-row.description');
              for (const div of allDivs) {
                const text = div.textContent.trim();
                if (text.length > 100 && !text.includes('Copy this prompt')) {
                  promptText = text;
                  console.log('Found text in div, length:', promptText.length);
                  break;
                }
              }
            }
          }
          
          // If not found, try direct .detail-description
          if (!promptText) {
            const promptTextEl = modal.querySelector('.detail-description');
            console.log('Found .detail-description directly:', !!promptTextEl);
            if (promptTextEl) {
              promptText = promptTextEl.textContent.trim() || promptTextEl.innerText.trim();
              console.log('Extracted from direct .detail-description, length:', promptText.length);
            }
          }
          
          // If still not found, try any element with class detail-description
          if (!promptText) {
            console.log('.detail-description not found, trying alternatives...');
            const allDescEls = modal.querySelectorAll('[class*="detail-description"], [class*="description"]');
            console.log('Found', allDescEls.length, 'elements with description class');
            for (const el of allDescEls) {
              const text = el.textContent.trim() || el.innerText.trim();
              // Skip if it's a label or short text
              if (text.length > 100 && 
                  !text.includes('Copy this prompt') &&
                  !text.includes('Paste Your Prompts') &&
                  !text.includes('to generate')) {
                promptText = text;
                console.log('Found alternative description element, length:', promptText.length);
                break;
              }
            }
          }
          
          // Get category from modal (might be more accurate)
          let categoryName = '';
          const categoryEl = modal.querySelector('.detail-value span, .detail-row.category .detail-value span, [class*="category"]');
          if (categoryEl) {
            categoryName = categoryEl.textContent.trim();
          }
          
          // Get tags
          const tagsEls = modal.querySelectorAll('.tag-item, .tags-container .tag-item, [class*="tag-item"]');
          const tags = Array.from(tagsEls).map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 50);
          
          return {
            promptText: promptText,
            categoryName: categoryName || defaultCategory,
            tags: tags,
            modalFound: true,
            promptTextLength: promptText.length
          };
        }, promptData.category);
        
        // Close modal after extraction
        if (modalOpened) {
          await page.evaluate(() => {
            // Try multiple ways to close modal
            const closeBtn = document.querySelector('.modal-close, [data-dismiss="modal"], .modal-close-btn');
            if (closeBtn) {
              closeBtn.click();
            } else {
              // Try ESC key or click outside
              const modal = document.querySelector('.modal, .modal-content');
              if (modal) {
                const backdrop = modal.closest('.modal-backdrop') || modal.parentElement;
                if (backdrop && backdrop !== modal) {
                  backdrop.click();
                }
              }
            }
          });
          await page.waitForTimeout(500); // Wait for modal to close
        }
        
        if (modalData && modalData.promptText && modalData.promptText.length > 50) {
          const categoryName = modalData.categoryName || promptData.category || 'Baby Photo';
          
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, []);
          }
          
          categoryGroups.get(categoryName).push({
            title: promptData.title,
            description: modalData.tags.join(' | ') || '',
            prompt_text: modalData.promptText,
            example_image_url: promptData.imageUrl,
            order_index: categoryGroups.get(categoryName).length
          });
          
          console.log(`  ✅ Extracted prompt text (${modalData.promptText.length} chars)`);
        } else if (modalData && modalData.modalFound) {
          // Modal opened but no prompt text found - log for debugging
          console.log(`  ⚠️  Modal opened but prompt text not found (length: ${modalData.promptTextLength || 0})`);
          
          // Try to get the raw HTML to debug
          const modalHTML = await page.evaluate(() => {
            const modal = document.querySelector('.modal-body') || document.querySelector('.modal-content');
            if (modal) {
              return modal.innerHTML.substring(0, 1000); // First 1000 chars for debugging
            }
            return '';
          });
          
          if (modalHTML) {
            console.log(`  📄 Modal HTML preview: ${modalHTML.substring(0, 200)}...`);
          }
          
          // Still save the prompt with empty text
          const categoryName = modalData.categoryName || promptData.category || 'Baby Photo';
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, []);
          }
          categoryGroups.get(categoryName).push({
            title: promptData.title,
            description: modalData.tags.join(' | ') || '',
            prompt_text: modalData.promptText || '', // Save whatever we found (even if empty)
            example_image_url: promptData.imageUrl,
            order_index: categoryGroups.get(categoryName).length
          });
        } else {
          // If modal didn't work, log and try to get from page
          console.log(`  ⚠️  Could not extract prompt text from modal`);
          
          // Try to get prompt text from the page directly (might be in a data attribute)
          const pagePromptText = await page.evaluate((index) => {
            const items = document.querySelectorAll('.template-item');
            if (items[index]) {
              // Check for data attributes
              const dataPrompt = items[index].getAttribute('data-prompt') || 
                               items[index].getAttribute('data-description') ||
                               items[index].getAttribute('data-text');
              if (dataPrompt && dataPrompt.length > 50) {
                return dataPrompt;
              }
              
              // Check for hidden elements with prompt text
              const hiddenText = items[index].querySelector('[data-prompt], [data-description], [style*="display: none"]');
              if (hiddenText) {
                const text = hiddenText.textContent || hiddenText.getAttribute('data-prompt') || hiddenText.getAttribute('data-description');
                if (text && text.length > 50) {
                  return text.trim();
                }
              }
            }
            return '';
          }, promptData.index);
          
          const categoryName = promptData.category || 'Baby Photo';
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, []);
          }
          
          categoryGroups.get(categoryName).push({
            title: promptData.title,
            description: '',
            prompt_text: pagePromptText || '', // Use page text if found, otherwise empty
            example_image_url: promptData.imageUrl,
            order_index: categoryGroups.get(categoryName).length
          });
          
          if (pagePromptText) {
            console.log(`  ✅ Found prompt text from page (${pagePromptText.length} chars)`);
          } else {
            console.log(`  ❌ No prompt text found - will need manual entry`);
          }
        }
        
        // Small delay between clicks
        await page.waitForTimeout(500);
        
      } catch (error) {
        console.log(`  ⚠️  Error extracting prompt ${i + 1}: ${error.message}`);
        // Continue with next prompt
      }
    }
    
    // Convert category groups to categories array
    let catIndex = 0;
    categoryGroups.forEach((prompts, categoryName) => {
      if (prompts.length > 0) {
        categoriesList.push({
          name: categoryName,
          description: `Gemini AI baby photo prompts for ${categoryName.toLowerCase()}`,
          icon: '👶',
          order_index: catIndex++,
          prompts: prompts
        });
      }
    });
    
    const finalData = {
      categories: categoriesList,
      totalPrompts: categoriesList.reduce((sum, cat) => sum + cat.prompts.length, 0)
    };
    
    console.log(`✅ Extracted ${finalData.categories.length} categories with ${finalData.totalPrompts} prompts\n`);
    
    // Save raw data
    await fs.writeJSON(RAW_DATA_FILE, finalData, { spaces: 2 });
    console.log(`💾 Saved raw data to: ${RAW_DATA_FILE}`);
    
    // Extract categories separately
    const categoriesForFile = finalData.categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order_index: cat.order_index
    }));
    
    await fs.writeJSON(CATEGORIES_FILE, categoriesForFile, { spaces: 2 });
    console.log(`💾 Saved categories to: ${CATEGORIES_FILE}`);
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${finalData.categories.length}`);
    console.log(`   - Total Prompts: ${finalData.totalPrompts}`);
    
    return finalData;
    
  } catch (error) {
    console.error('❌ Error scraping Filmora:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  // Get max prompts from command line argument (e.g., node scrape-filmora-prompts.js 50)
  const maxPrompts = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
  
  scrapeFilmoraPrompts(maxPrompts)
    .then(() => {
      console.log('✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = scrapeFilmoraPrompts;

