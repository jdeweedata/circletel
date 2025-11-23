/**
 * CMS Performance Testing Script
 * Tests page load times, API response times, and AI generation speed
 *
 * Run with: node scripts/test-cms-performance.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005';
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'devadmin@circletel.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Performance thresholds (ms)
const THRESHOLDS = {
  API_RESPONSE: 1000,        // 1 second for API responses
  PAGE_LOAD: 3000,           // 3 seconds for page loads
  AI_GENERATION: 30000,      // 30 seconds for AI generation
  DATABASE_QUERY: 500,       // 500ms for database queries
  IMAGE_UPLOAD: 5000,        // 5 seconds for image uploads
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function checkThreshold(time, threshold) {
  if (time < threshold) return 'green';
  if (time < threshold * 1.5) return 'yellow';
  return 'red';
}

async function measureTime(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - start;
    return { success: false, duration, error: error.message };
  }
}

async function testAPIPerformance(authToken) {
  log('\n🔧 Testing API Performance...', 'cyan');

  const tests = [
    {
      name: 'GET /api/cms/pages (list)',
      threshold: THRESHOLDS.API_RESPONSE,
      fn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cms/pages?page=1&limit=10`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
    },
    {
      name: 'GET /api/cms/media (list)',
      threshold: THRESHOLDS.API_RESPONSE,
      fn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cms/media?page=1&limit=10`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
    },
    {
      name: 'POST /api/cms/pages (create)',
      threshold: THRESHOLDS.API_RESPONSE,
      fn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'Performance Test Page',
            slug: 'perf-test-' + Date.now(),
            content_type: 'landing_page',
            content: '<p>Test content</p>',
            status: 'draft',
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // Clean up
        await supabase.from('cms_pages').delete().eq('id', data.id);
        return data;
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await measureTime(test.name, test.fn);
    const color = result.success ? checkThreshold(result.duration, test.threshold) : 'red';

    log(
      `  ${result.success ? '✓' : '✗'} ${test.name}: ${formatTime(result.duration)} ${result.success ? '' : `(${result.error})`}`,
      color
    );

    results.push({
      name: test.name,
      duration: result.duration,
      threshold: test.threshold,
      passed: result.success && result.duration < test.threshold,
    });
  }

  return results;
}

async function testAIGenerationPerformance(authToken) {
  log('\n🤖 Testing AI Generation Performance...', 'cyan');

  const tests = [
    {
      name: 'Content Generation (200 words)',
      threshold: THRESHOLDS.AI_GENERATION,
      fn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cms/generate/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            topic: 'Fiber Internet Benefits',
            content_type: 'landing_page',
            tone: 'professional',
            keywords: ['fiber', 'internet'],
            target_audience: 'business',
            word_count: 200,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
    },
    {
      name: 'SEO Metadata Generation',
      threshold: THRESHOLDS.AI_GENERATION,
      fn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cms/generate/seo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'Fiber Internet for Businesses',
            content: '<p>Fast fiber internet for your business needs</p>',
            target_keywords: ['fiber internet', 'business internet'],
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await measureTime(test.name, test.fn);
    const color = result.success ? checkThreshold(result.duration, test.threshold) : 'red';

    log(
      `  ${result.success ? '✓' : '✗'} ${test.name}: ${formatTime(result.duration)} ${result.success ? '' : `(${result.error})`}`,
      color
    );

    results.push({
      name: test.name,
      duration: result.duration,
      threshold: test.threshold,
      passed: result.success && result.duration < test.threshold,
    });

    // Wait a bit between AI requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

async function testDatabasePerformance() {
  log('\n💾 Testing Database Performance...', 'cyan');

  const tests = [
    {
      name: 'Query all pages',
      threshold: THRESHOLDS.DATABASE_QUERY,
      fn: async () => {
        const { data, error } = await supabase
          .from('cms_pages')
          .select('*')
          .limit(10);
        if (error) throw error;
        return data;
      },
    },
    {
      name: 'Query pages with filters',
      threshold: THRESHOLDS.DATABASE_QUERY,
      fn: async () => {
        const { data, error } = await supabase
          .from('cms_pages')
          .select('*')
          .eq('status', 'draft')
          .eq('content_type', 'landing_page')
          .limit(10);
        if (error) throw error;
        return data;
      },
    },
    {
      name: 'Query media files',
      threshold: THRESHOLDS.DATABASE_QUERY,
      fn: async () => {
        const { data, error } = await supabase
          .from('cms_media')
          .select('*')
          .limit(10);
        if (error) throw error;
        return data;
      },
    },
    {
      name: 'Query AI usage logs',
      threshold: THRESHOLDS.DATABASE_QUERY,
      fn: async () => {
        const { data, error } = await supabase
          .from('ai_usage_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data;
      },
    },
    {
      name: 'Count total pages',
      threshold: THRESHOLDS.DATABASE_QUERY,
      fn: async () => {
        const { count, error } = await supabase
          .from('cms_pages')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count;
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await measureTime(test.name, test.fn);
    const color = result.success ? checkThreshold(result.duration, test.threshold) : 'red';

    log(
      `  ${result.success ? '✓' : '✗'} ${test.name}: ${formatTime(result.duration)} ${result.success ? '' : `(${result.error})`}`,
      color
    );

    results.push({
      name: test.name,
      duration: result.duration,
      threshold: test.threshold,
      passed: result.success && result.duration < test.threshold,
    });
  }

  return results;
}

async function testPaginationPerformance(authToken) {
  log('\n📄 Testing Pagination Performance...', 'cyan');

  const pageSizes = [10, 25, 50, 100];
  const results = [];

  for (const size of pageSizes) {
    const result = await measureTime(`Fetch ${size} pages`, async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?page=1&limit=${size}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    const color = result.success ? checkThreshold(result.duration, THRESHOLDS.API_RESPONSE) : 'red';

    log(
      `  ${result.success ? '✓' : '✗'} Page size ${size}: ${formatTime(result.duration)}`,
      color
    );

    results.push({
      name: `Pagination (${size} items)`,
      duration: result.duration,
      threshold: THRESHOLDS.API_RESPONSE,
      passed: result.success && result.duration < THRESHOLDS.API_RESPONSE,
    });
  }

  return results;
}

function generateReport(allResults) {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Performance Test Summary', 'blue');
  log('='.repeat(60), 'blue');

  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  const avgDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
  const maxDuration = Math.max(...allResults.map(r => r.duration));
  const minDuration = Math.min(...allResults.map(r => r.duration));

  log(`\nTotal Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');

  log(`\nAverage Duration: ${formatTime(avgDuration)}`, 'cyan');
  log(`Fastest Test: ${formatTime(minDuration)}`, 'green');
  log(`Slowest Test: ${formatTime(maxDuration)}`, maxDuration > 5000 ? 'yellow' : 'cyan');

  if (failedTests > 0) {
    log('\n❌ Failed Tests:', 'red');
    allResults
      .filter(r => !r.passed)
      .forEach(r => {
        log(`  - ${r.name}: ${formatTime(r.duration)} (threshold: ${formatTime(r.threshold)})`, 'red');
      });
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    passRate: (passedTests / totalTests) * 100,
    avgDuration,
  };
}

async function main() {
  log('🚀 Starting CMS Performance Tests\n', 'blue');

  try {
    // Authenticate
    log('🔐 Authenticating...', 'cyan');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError || !authData.session) {
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    const authToken = authData.session.access_token;
    log('✓ Authenticated successfully\n', 'green');

    // Run all tests
    const allResults = [];

    const apiResults = await testAPIPerformance(authToken);
    allResults.push(...apiResults);

    const dbResults = await testDatabasePerformance();
    allResults.push(...dbResults);

    const paginationResults = await testPaginationPerformance(authToken);
    allResults.push(...paginationResults);

    const aiResults = await testAIGenerationPerformance(authToken);
    allResults.push(...aiResults);

    // Generate report
    const summary = generateReport(allResults);

    // Cleanup
    await supabase.auth.signOut();

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
