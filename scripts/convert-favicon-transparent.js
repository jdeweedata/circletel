const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertFavicon() {
  const inputPath = path.join(__dirname, '..', 'public', 'ctel-favicon-transparent.jpeg');
  const publicDir = path.join(__dirname, '..', 'public');

  try {
    console.log('Converting transparent favicon...');

    // Convert to favicon.ico (32x32)
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Created favicon.ico (32x32)');

    // Create icon.png (192x192 for PWA)
    await sharp(inputPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon.png'));
    console.log('✓ Created icon.png (192x192)');

    // Create icon-512.png for PWA
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png (512x512)');

    // Create apple-touch-icon.png (180x180)
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180)');

    console.log('\n✅ Transparent favicon conversion complete!');
    console.log('\nGenerated files:');
    console.log('  - favicon.ico (32x32)');
    console.log('  - icon.png (192x192)');
    console.log('  - icon-512.png (512x512)');
    console.log('  - apple-touch-icon.png (180x180)');

  } catch (error) {
    console.error('Error converting favicon:', error);
    process.exit(1);
  }
}

convertFavicon();
