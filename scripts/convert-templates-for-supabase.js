/**
 * Email Template Converter for Supabase
 *
 * Converts TypeScript email templates to Supabase Go template syntax
 *
 * Usage:
 *   node scripts/convert-templates-for-supabase.js
 *
 * Output:
 *   docs/email-templates/supabase-ready/
 *     - verification-email.html
 *     - password-reset-email.html
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal
const COLORS = {
  GREEN: '\x1b[32m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

// Template mappings: TypeScript variable → Supabase Go template variable
const VARIABLE_MAPPINGS = {
  '${confirmationUrl}': '{{ .ConfirmationURL }}',
  '${email}': '{{ .Email }}',
  '${firstName}': '{{ .Email }}',  // Supabase doesn't have firstName, use email
  '${lastName}': '{{ .Email }}',
  '${currentYear}': '{{ .Year }}',
  '${greeting}': '{{ if .Email }}Hi there{{ else }}Hi{{ end }}'
};

// Templates to convert
const TEMPLATES = {
  verification: {
    name: 'Email Verification (Confirm signup)',
    inputStart: 'export const getVerificationEmailHTML',
    outputFile: 'verification-email.html',
    subject: 'Verify Your CircleTel Account - Welcome! 🎉'
  },
  passwordReset: {
    name: 'Password Reset',
    inputStart: 'export const getPasswordResetEmailHTML',
    outputFile: 'password-reset-email.html',
    subject: 'Reset Your CircleTel Password'
  }
};

function extractTemplate(content, startMarker) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return null;

  // Find the return statement with template literal
  const returnIndex = content.indexOf('return `', startIndex);
  if (returnIndex === -1) return null;

  // Find the closing of the template literal
  let depth = 0;
  let templateStart = returnIndex + 8; // After 'return `'
  let templateEnd = -1;

  for (let i = templateStart; i < content.length; i++) {
    if (content[i] === '`' && content[i - 1] !== '\\') {
      if (depth === 0) {
        templateEnd = i;
        break;
      }
    }
    if (content[i] === '$' && content[i + 1] === '{') {
      depth++;
    }
    if (content[i] === '}' && depth > 0) {
      depth--;
    }
  }

  if (templateEnd === -1) return null;

  let template = content.substring(templateStart, templateEnd);

  // Remove the .trim() if present
  template = template.replace(/\.trim\(\)$/, '');

  return template.trim();
}

function convertVariables(template) {
  let converted = template;

  // Replace all TypeScript variables with Supabase variables
  Object.entries(VARIABLE_MAPPINGS).forEach(([tsVar, supabaseVar]) => {
    const regex = new RegExp(tsVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    converted = converted.replace(regex, supabaseVar);
  });

  // Fix the greeting variable (more complex replacement)
  converted = converted.replace(
    /\$\{greeting\},\s*Welcome to CircleTel!/g,
    'Hi there, Welcome to CircleTel!'
  );

  converted = converted.replace(
    /\$\{greeting\},\s*Reset Your Password/g,
    'Hi there, Reset Your Password'
  );

  // Remove any remaining ${...} that might have been missed
  converted = converted.replace(/\$\{[^}]+\}/g, (match) => {
    console.warn(`⚠️  Warning: Unmapped variable found: ${match}`);
    return match;
  });

  return converted;
}

function createOutputDirectory() {
  const outputDir = path.join(process.cwd(), 'docs', 'email-templates', 'supabase-ready');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

function writeTemplateFile(outputDir, filename, content, templateInfo) {
  const outputPath = path.join(outputDir, filename);

  // Add instructions header
  const header = `<!--
  CircleTel ${templateInfo.name} Template
  Generated: ${new Date().toISOString()}

  INSTRUCTIONS:
  1. Copy entire content below
  2. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates
  3. Select: ${templateInfo.name}
  4. Paste this HTML into the template editor
  5. Update subject line to: ${templateInfo.subject}
  6. Click "Save"

  For help: See docs/email-templates/RESEND_INTEGRATION_CHECKLIST.md
-->

`;

  const fullContent = header + content;

  fs.writeFileSync(outputPath, fullContent, 'utf-8');
  return outputPath;
}

function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    CircleTel - Email Template Converter for Supabase      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Read source template file
  const templateFilePath = path.join(process.cwd(), 'lib', 'email', 'verification-templates.ts');

  if (!fs.existsSync(templateFilePath)) {
    console.error(`${COLORS.RED}❌ Template file not found: ${templateFilePath}${COLORS.RESET}`);
    process.exit(1);
  }

  console.log(`${COLORS.BLUE}ℹ️  Reading templates from: ${templateFilePath}${COLORS.RESET}`);
  const content = fs.readFileSync(templateFilePath, 'utf-8');

  // Create output directory
  const outputDir = createOutputDirectory();
  console.log(`${COLORS.BLUE}ℹ️  Output directory: ${outputDir}${COLORS.RESET}`);
  console.log('\n');

  // Convert each template
  let successCount = 0;

  Object.entries(TEMPLATES).forEach(([key, templateInfo]) => {
    console.log(`Processing: ${templateInfo.name}...`);

    // Extract template
    const template = extractTemplate(content, templateInfo.inputStart);

    if (!template) {
      console.error(`${COLORS.RED}❌ Failed to extract template: ${templateInfo.name}${COLORS.RESET}`);
      return;
    }

    // Convert variables
    const converted = convertVariables(template);

    // Write to file
    const outputPath = writeTemplateFile(outputDir, templateInfo.outputFile, converted, templateInfo);

    console.log(`${COLORS.GREEN}✅ Generated: ${templateInfo.outputFile}${COLORS.RESET}`);
    console.log(`   Subject: ${templateInfo.subject}`);
    console.log(`   Path: ${outputPath}`);
    console.log('\n');

    successCount++;
  });

  // Summary
  console.log('='.repeat(60));
  console.log(`${COLORS.GREEN}✅ Conversion complete!${COLORS.RESET}`);
  console.log(`   Templates converted: ${successCount}/${Object.keys(TEMPLATES).length}`);
  console.log(`   Output location: ${outputDir}`);
  console.log('\n');

  // Next steps
  console.log('NEXT STEPS:');
  console.log('');
  console.log('1. Open generated files in: docs/email-templates/supabase-ready/');
  console.log('');
  console.log('2. For each template:');
  console.log('   - Open the .html file');
  console.log('   - Copy entire content (including HTML tags)');
  console.log('   - Go to Supabase Dashboard → Auth → Email Templates');
  console.log('   - Paste into the appropriate template editor');
  console.log('   - Update subject line as noted in file header');
  console.log('   - Click "Save"');
  console.log('');
  console.log('3. Test by creating a new account or resetting password');
  console.log('');
  console.log('For detailed instructions:');
  console.log('   docs/email-templates/RESEND_INTEGRATION_CHECKLIST.md');
  console.log('');
}

// Run converter
try {
  main();
} catch (error) {
  console.error(`${COLORS.RED}❌ Unexpected error:${COLORS.RESET}`, error);
  process.exit(1);
}
