const fs = require('fs-extra');
const rawData = fs.readJsonSync('aitoolsdirectory/output/aitoolsdirectory-tools-raw.json');

console.log(`Total Raw: ${rawData.length}`);

const missingStats = { name: 0, description: 0, website: 0, logo: 0 };
let validCount = 0;

rawData.forEach(tool => {
    const hasName = tool.name && tool.name.trim().length > 0;
    const hasDescription = tool.description && tool.description.trim().length > 0;
    const hasWebsiteUrl = tool.website_url && tool.website_url.trim().length > 0 && tool.website_url !== 'NULL';
    const hasLogoUrl = tool.logo_url && tool.logo_url.trim().length > 0 && tool.logo_url !== 'NULL';

    if (hasName && hasDescription && hasWebsiteUrl && hasLogoUrl) {
        validCount++;
    } else {
        if (!hasName) missingStats.name++;
        if (!hasDescription) missingStats.description++;
        if (!hasWebsiteUrl) missingStats.website++;
        if (!hasLogoUrl) missingStats.logo++;
    }
});

console.log(`Valid Tools: ${validCount}`);
console.log(`Missing Stats:`, missingStats);
