const fs = require('fs-extra');
const rawData = fs.readJsonSync('aitoolsdirectory/output/aitoolsdirectory-tools-raw.json');

let hasUrl = 0;
let noUrl = 0;
let aitoolsUrl = 0;

rawData.forEach(t => {
    if (t.website_url) {
        hasUrl++;
        if (t.website_url.includes('aitoolsdirectory.com')) {
            aitoolsUrl++;
        }
    } else {
        noUrl++;
    }
});

console.log(`Total Raw Tools: ${rawData.length}`);
console.log(`With Website URL: ${hasUrl}`);
console.log(`Without Website URL: ${noUrl}`);
console.log(`With 'aitoolsdirectory.com' URL: ${aitoolsUrl}`);
