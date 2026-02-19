const fs = require('fs-extra');
const rawData = fs.readJsonSync('aitoolsdirectory/output/aitoolsdirectory-tools-raw.json');

let hasLogo = 0;
let noLogo = 0;

rawData.forEach(t => {
    if (t.logo_url && t.logo_url.trim().length > 0) {
        hasLogo++;
    } else {
        noLogo++;
    }
});

console.log(`Total: ${rawData.length}`);
console.log(`With Logo: ${hasLogo}`);
console.log(`Without Logo: ${noLogo}`);
