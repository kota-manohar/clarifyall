const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_FILE = path.join(OUTPUT_DIR, 'aitoolsdirectory-tools-raw.json');
const PARSED_DATA_FILE = path.join(OUTPUT_DIR, 'aitoolsdirectory-tools-parsed.json');

/**
 * Parse and normalize extracted tool data
 */
function parseAiToolsData() {
  console.log('🔧 Parsing and normalizing tool data...');

  if (!fs.existsSync(RAW_DATA_FILE)) {
    throw new Error(`Raw data file not found: ${RAW_DATA_FILE}. Please run scrape-aitoolsdirectory.js first.`);
  }

  const rawData = fs.readJsonSync(RAW_DATA_FILE);
  console.log(`📊 Processing ${rawData.length} raw tools...`);

  const parsedTools = [];
  const seenUrls = new Set();
  const seenNames = new Set();

  rawData.forEach((tool, index) => {
    try {
      // Skip duplicates
      const urlKey = tool.website_url ? tool.website_url.toLowerCase() : '';
      const nameKey = tool.name ? tool.name.toLowerCase().trim() : '';

      if (nameKey.includes('liminary')) {
        console.log(`   🔍 Raw Liminary: logo=${tool.logo_url}, website=${tool.website_url}`);
      }

      // Early deduplication removed to allow merging of data later
      // if (urlKey && seenUrls.has(urlKey)) return;
      // if (nameKey && seenNames.has(nameKey)) return;

      if (urlKey) seenUrls.add(urlKey);
      if (nameKey) seenNames.add(nameKey);

      // Normalize name
      const name = (tool.name || '').trim().substring(0, 200);
      if (!name || name.length < 2) {
        return; // Skip invalid names
      }

      // Normalize description
      const description = (tool.description || '').trim().substring(0, 500);
      const fullDescription = (tool.full_description || description || '').trim().substring(0, 2000);

      // Normalize and validate URL
      let websiteUrl = (tool.website_url || '').trim();
      if (websiteUrl && !websiteUrl.startsWith('http')) {
        if (websiteUrl.startsWith('//')) {
          websiteUrl = 'https:' + websiteUrl;
        } else if (websiteUrl.startsWith('/')) {
          websiteUrl = 'https://aitoolsdirectory.com' + websiteUrl;
        } else {
          websiteUrl = 'https://' + websiteUrl;
        }
      }

      // Replace utm_source=toolify with utm_source=clarifyall.com (if copied from toolify logic)
      if (websiteUrl) {
        websiteUrl = websiteUrl.replace(/utm_source=[^&]+/gi, 'utm_source=clarifyall.com');
      }

      // Validate URL format
      try {
        if (websiteUrl) {
          new URL(websiteUrl);
        }
      } catch (e) {
        websiteUrl = ''; // Invalid URL
      }

      // Normalize logo URL
      let logoUrl = (tool.logo_url || '').trim();
      if (logoUrl && !logoUrl.startsWith('http')) {
        if (logoUrl.startsWith('//')) {
          logoUrl = 'https:' + logoUrl;
        } else if (logoUrl.startsWith('/')) {
          logoUrl = 'https://aitoolsdirectory.com' + logoUrl;
        }
      }

      // Normalize category
      const category = (tool.category || '').trim();

      // Normalize pricing model
      let pricingModel = (tool.pricing_model || 'FREE').toUpperCase();
      if (!['FREE', 'FREEMIUM', 'FREE_TRIAL', 'OPEN_SOURCE', 'PAID'].includes(pricingModel)) {
        // Try to infer from description or pricing string
        const desc = (description + ' ' + fullDescription + ' ' + pricingModel).toLowerCase();
        if (desc.includes('freemium')) pricingModel = 'FREEMIUM';
        else if (desc.includes('free trial') || desc.includes('trial')) pricingModel = 'FREE_TRIAL';
        else if (desc.includes('open source') || desc.includes('opensource')) pricingModel = 'OPEN_SOURCE';
        else if (desc.includes('paid') || desc.includes('$') || desc.includes('pricing')) pricingModel = 'PAID';
        else pricingModel = 'FREE';
      }

      // Normalize platforms (JSON array)
      let platforms = [];
      if (Array.isArray(tool.platforms)) {
        platforms = tool.platforms
          .map(p => String(p).trim())
          .filter(p => p.length > 0 && p.length < 50)
          .slice(0, 10);
      } else if (typeof tool.platforms === 'string') {
        platforms = tool.platforms.split(',').map(p => p.trim()).filter(p => p.length > 0).slice(0, 10);
      }

      // Normalize feature tags (JSON array)
      let featureTags = [];
      if (Array.isArray(tool.feature_tags)) {
        featureTags = tool.feature_tags
          .map(t => String(t).trim())
          .filter(t => t.length > 0 && t.length < 50)
          .slice(0, 20);
      } else if (typeof tool.feature_tags === 'string') {
        featureTags = tool.feature_tags.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 20);
      }

      // Create parsed tool object
      const parsedTool = {
        name,
        description: description || 'AI tool from aitoolsdirectory.com',
        full_description: fullDescription || description || 'AI tool from aitoolsdirectory.com',
        website_url: websiteUrl || null,
        logo_url: logoUrl || null,
        category,
        pricing_model: pricingModel,
        platforms: platforms.length > 0 ? platforms : null,
        feature_tags: featureTags.length > 0 ? featureTags : null
      };

      parsedTools.push(parsedTool);

    } catch (error) {
      console.error(`⚠️  Error parsing tool ${index}:`, error.message);
    }
  });

  console.log('📊 Drop Stats:');
  console.log(`   - Duplicate URLs: ${rawData.length - seenUrls.size}`);
  console.log(`   - Duplicate Names: ${rawData.length - seenNames.size}`); // Approximation


  // Remove duplicates by name (case-insensitive)
  const uniqueTools = [];
  const nameMap = new Map();

  parsedTools.forEach(tool => {
    const nameLower = tool.name.toLowerCase();
    if (!nameMap.has(nameLower)) {
      nameMap.set(nameLower, tool);
      uniqueTools.push(tool);
    } else {
      // Merge data if duplicate found
      const existing = nameMap.get(nameLower);
      console.log(`   🔄 Merging duplicate: ${tool.name}`);
      console.log(`      Existing: logo=${existing.logo_url}, website=${existing.website_url}`);
      console.log(`      New:      logo=${tool.logo_url}, website=${tool.website_url}`);

      if (!existing.website_url && tool.website_url) {
        console.log(`      + Merged Website URL`);
        existing.website_url = tool.website_url;
      }
      if (!existing.logo_url && tool.logo_url) {
        console.log(`      + Merged Logo URL`);
        existing.logo_url = tool.logo_url;
      }
      if (!existing.description && tool.description) {
        existing.description = tool.description;
      }
    }
  });

  console.log(`✅ Parsed ${uniqueTools.length} unique tools (removed ${parsedTools.length - uniqueTools.length} duplicates)`);

  // Filter only tools with complete data (name, description, website_url, logo_url)
  const missingStats = { name: 0, description: 0, website: 0, logo: 0 };

  const completeTools = uniqueTools.filter(tool => {
    const hasName = tool.name && tool.name.trim().length > 0;
    const hasDescription = tool.description && tool.description.trim().length > 0;
    const hasWebsiteUrl = tool.website_url && tool.website_url.trim().length > 0 && tool.website_url !== 'NULL';
    const hasLogoUrl = tool.logo_url && tool.logo_url.trim().length > 0 && tool.logo_url !== 'NULL';

    if (!hasName) missingStats.name++;
    if (!hasDescription) missingStats.description++;
    if (!hasWebsiteUrl) missingStats.website++;
    if (!hasLogoUrl) missingStats.logo++;

    return hasName && hasDescription && hasWebsiteUrl && hasLogoUrl;
  });

  console.log(`\n📊 Filtering complete tools only:`);
  console.log(`   - Total unique tools: ${uniqueTools.length}`);
  console.log(`   - Complete tools (with all data): ${completeTools.length}`);
  console.log(`   - Incomplete tools (skipped): ${uniqueTools.length - completeTools.length}`);
  console.log(`     * Missing Name: ${missingStats.name}`);
  console.log(`     * Missing Description: ${missingStats.description}`);
  console.log(`     * Missing Website: ${missingStats.website}`);
  console.log(`     * Missing Logo: ${missingStats.logo}`);

  // Save parsed data (only complete tools)
  fs.writeJsonSync(PARSED_DATA_FILE, completeTools, { spaces: 2 });
  console.log(`💾 Saved ${completeTools.length} complete tools to ${PARSED_DATA_FILE}`);

  return completeTools;
}

// Run if called directly
if (require.main === module) {
  try {
    parseAiToolsData();
    console.log('✅ Parsing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Parsing failed:', error);
    process.exit(1);
  }
}

module.exports = parseAiToolsData;
