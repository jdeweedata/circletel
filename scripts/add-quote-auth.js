/**
 * Batch Script: Add Authentication to Quote API Endpoints
 * Adds authenticateAdmin and requirePermission to all quote API routes
 */

const fs = require('fs');
const path = require('path');

// Endpoints to update with their required permissions
const endpoints = [
  {
    file: 'app/api/quotes/route.ts',
    permission: 'quotes:read',
    method: 'GET',
  },
  {
    file: 'app/api/quotes/business/create/route.ts',
    permission: 'quotes:create',
    method: 'POST',
  },
  {
    file: 'app/api/quotes/business/[id]/route.ts',
    permissions: {
      GET: 'quotes:read',
      PUT: 'quotes:update',
      PATCH: 'quotes:update',
      DELETE: 'quotes:delete',
    },
  },
  {
    file: 'app/api/quotes/business/[id]/approve/route.ts',
    permission: 'quotes:approve',
    method: 'POST',
  },
  {
    file: 'app/api/quotes/business/[id]/reject/route.ts',
    permission: 'quotes:approve',
    method: 'POST',
  },
  {
    file: 'app/api/quotes/business/admin/analytics/route.ts',
    permission: 'quotes:read',
    method: 'GET',
  },
];

function addAuthToEndpoint(filePath, permission, method) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already has authentication
  if (content.includes('authenticateAdmin')) {
    console.log(`✓ Already has auth: ${filePath}`);
    return true;
  }

  // Add import
  const importStatement = `import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';`;

  if (!content.includes(importStatement)) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    }
  }

  // Add authentication code after "export async function"
  const authCode = `
  try {
    // ✅ SECURITY: Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // ✅ SECURITY: Check permission
    const permissionError = requirePermission(adminUser, '${permission}');
    if (permissionError) {
      return permissionError;
    }
`;

  // Find the function definition
  const funcRegex = new RegExp(`export async function ${method}\\([^)]+\\)\\s*{\\s*try\\s*{`, 'g');

  if (funcRegex.test(content)) {
    // Already has try block, insert after it
    content = content.replace(
      new RegExp(`(export async function ${method}\\([^)]+\\)\\s*{\\s*try\\s*{)`, 'g'),
      `$1${authCode}`
    );
  } else {
    // No try block, add one
    content = content.replace(
      new RegExp(`(export async function ${method}\\([^)]+\\)\\s*{)`, 'g'),
      `$1${authCode.trimStart()}`
    );
  }

  // Write updated content
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Added auth to: ${filePath} (${method}, ${permission})`);
  return true;
}

// Main execution
console.log('🔒 Adding authentication to quote API endpoints...\n');

let successCount = 0;
let skipCount = 0;

for (const endpoint of endpoints) {
  if (endpoint.permissions) {
    // Multiple methods in same file
    for (const [method, permission] of Object.entries(endpoint.permissions)) {
      const result = addAuthToEndpoint(endpoint.file, permission, method);
      if (result) successCount++;
      else skipCount++;
    }
  } else {
    // Single method
    const result = addAuthToEndpoint(endpoint.file, endpoint.permission, endpoint.method);
    if (result) successCount++;
    else skipCount++;
  }
}

console.log(`\n✅ Success: ${successCount} endpoints`);
console.log(`⚠️  Skipped: ${skipCount} endpoints`);
console.log('\n🎯 Next steps:');
console.log('1. Run: npm run type-check:memory');
console.log('2. Review changes with: git diff');
console.log('3. Test authentication with: node scripts/test-admin-quote-apis.js');
