const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '..', 'logos');

async function convertSvgToPng() {
    console.log('🔄 Converting existing SVG logos to PNG...\n');

    const files = fs.readdirSync(LOGOS_DIR);
    const svgFiles = files.filter(f => f.endsWith('.svg'));

    console.log(`Found ${svgFiles.length} SVG files to convert\n`);

    let converted = 0;
    let failed = 0;

    for (const svgFile of svgFiles) {
        const svgPath = path.join(LOGOS_DIR, svgFile);
        const pngFile = svgFile.replace('.svg', '.png');
        const pngPath = path.join(LOGOS_DIR, pngFile);

        try {
            console.log(`  🔄 Converting ${svgFile}...`);

            await sharp(svgPath)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(pngPath);

            // Remove original SVG
            fs.unlinkSync(svgPath);

            const stats = fs.statSync(pngPath);
            console.log(`  ✅ Converted: ${pngFile} (${(stats.size / 1024).toFixed(2)} KB)`);
            converted++;

        } catch (error) {
            console.log(`  ❌ Failed to convert ${svgFile}: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Conversion complete!`);
    console.log(`   - Converted: ${converted}`);
    console.log(`   - Failed: ${failed}`);

    // Copy all logos to public folder
    console.log('\n📁 Copying logos to public folder...');
    const publicLogosDir = path.join(__dirname, '..', '..', 'public', 'logos');
    fs.ensureDirSync(publicLogosDir);

    const allLogos = fs.readdirSync(LOGOS_DIR);
    for (const logo of allLogos) {
        const src = path.join(LOGOS_DIR, logo);
        const dest = path.join(publicLogosDir, logo);
        fs.copyFileSync(src, dest);
    }

    console.log(`✅ Copied ${allLogos.length} logos to public/logos/`);
}

convertSvgToPng().catch(console.error);
