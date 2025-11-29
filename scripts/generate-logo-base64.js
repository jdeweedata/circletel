const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'public', 'images', 'circletel-logo.png');
const outputPath = path.join(__dirname, '..', 'lib', 'invoices', 'logo-base64.ts');

const data = fs.readFileSync(logoPath);
const base64 = 'data:image/png;base64,' + data.toString('base64');

const content = `// Auto-generated file - do not edit manually
// Generated from public/images/circletel-logo.png

export const CIRCLETEL_LOGO_BASE64 = "${base64}";
`;

fs.writeFileSync(outputPath, content);
console.log('Logo base64 file generated successfully!');
