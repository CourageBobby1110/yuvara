const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const iconSvgPath = path.join(__dirname, '../public/icon-v2.svg');
  const logoSvgPath = path.join(__dirname, '../public/logo-v2.svg');

  console.log('Optimizing icons...');

  try {
    // 1. Render icon-v2.svg to public/icon.png (192x192px)
    await sharp(iconSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, '../public/icon.png'));
    console.log('✔ Created public/icon.png (192x192)');

    // 2. Render icon-v2.svg to public/favicon.ico (48x48px)
    if (fs.existsSync(path.join(__dirname, '../public/favicon.ico'))) {
      fs.unlinkSync(path.join(__dirname, '../public/favicon.ico'));
    }
    await sharp(iconSvgPath)
      .resize(48, 48)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    console.log('✔ Created public/favicon.ico (48x48)');

    // 3. Render icon-v2.svg to app/favicon.ico (48x48px)
    if (fs.existsSync(path.join(__dirname, '../app/favicon.ico'))) {
      fs.unlinkSync(path.join(__dirname, '../app/favicon.ico'));
    }
    await sharp(iconSvgPath)
      .resize(48, 48)
      .png()
      .toFile(path.join(__dirname, '../app/favicon.ico'));
    console.log('✔ Created app/favicon.ico (48x48)');

    // 4. Render logo-v2.svg to public/logo.png (512x512px)
    if (fs.existsSync(logoSvgPath)) {
      if (fs.existsSync(path.join(__dirname, '../public/logo.png'))) {
        fs.unlinkSync(path.join(__dirname, '../public/logo.png'));
      }
      await sharp(logoSvgPath)
        .resize(512, 512)
        .png()
        .toFile(path.join(__dirname, '../public/logo.png'));
      console.log('✔ Created public/logo.png (512x512)');
    }

    console.log('All icons optimized successfully!');
  } catch (error) {
    console.error('Error optimizing icons:', error);
  }
}

main();
