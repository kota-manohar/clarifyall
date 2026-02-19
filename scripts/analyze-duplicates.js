const fs = require('fs-extra');
const rawData = fs.readJsonSync('aitoolsdirectory/output/aitoolsdirectory-tools-raw.json');

const urlCounts = {};
rawData.forEach(t => {
    const url = t.website_url;
    if (url) {
        urlCounts[url] = (urlCounts[url] || 0) + 1;
    }
});

const duplicates = Object.entries(urlCounts).filter(([url, count]) => count > 1);
console.log(`Total Unique URLs: ${Object.keys(urlCounts).length}`);
console.log(`Duplicate URLs: ${duplicates.length}`);

duplicates.sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([url, count]) => {
    console.log(` - ${url}: ${count} times`);
});
