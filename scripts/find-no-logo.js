const fs = require('fs-extra');
const rawData = fs.readJsonSync('aitoolsdirectory/output/aitoolsdirectory-tools-raw.json');

const noLogoTools = rawData.filter(t => !t.logo_url || t.logo_url.trim().length === 0);
console.log(`Tools without logo: ${noLogoTools.length}`);
if (noLogoTools.length > 0) {
    console.log('First 5 tools without logo:');
    noLogoTools.slice(0, 5).forEach(t => console.log(` - ${t.name}`));
}
