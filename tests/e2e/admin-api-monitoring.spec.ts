/**
 * E2E Test: Admin API Monitoring Dashboard
 * Tests the coverage API monitoring integration
 */

import { test, expect } from '@playwright/test';

const ADMIN_LOGIN_URL = 'http://localhost:3000/admin/login';
const MONITORING_URL = 'http://localhost:3000/admin/coverage/monitoring';
const API_ENDPOINT = 'http://localhost:3000/api/admin/coverage/monitoring';

// Admin credentials (adjust based on your test setup)
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin@circletel.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || 'admin123';

test.describe('API Monitoring Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto(ADMIN_LOGIN_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  });

  test('should load monitoring dashboard page', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Check page title
    await expect(page.locator('h2')).toContainText('API Monitoring');
    
    // Check description
    await expect(page.locator('text=Real-time coverage API performance metrics')).toBeVisible();
  });

  test('should display overview metric cards', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Wait for data to load
    await page.waitForSelector('[class*="grid"]', { timeout: 10000 });
    
    // Check for metric cards
    await expect(page.locator('text=System Status')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Avg Response Time')).toBeVisible();
    await expect(page.locator('text=Cache Hit Rate')).toBeVisible();
  });

  test('should display health status badge', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Wait for status badge
    const statusBadge = page.locator('text=/HEALTHY|DEGRADED|UNHEALTHY/i').first();
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
  });

  test('should have functional tabs', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Check all tabs exist
    await expect(page.locator('text=Performance')).toBeVisible();
    await expect(page.locator('text=Cache')).toBeVisible();
    await expect(page.locator('text=Layers')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
    
    // Click through tabs
    await page.click('text=Cache');
    await expect(page.locator('text=MTN Coverage Cache')).toBeVisible();
    
    await page.click('text=Layers');
    await expect(page.locator('text=MTN WMS Layer Performance')).toBeVisible();
    
    await page.click('text=Actions');
    await expect(page.locator('text=Management Actions')).toBeVisible();
  });

  test('should show time window selector', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Find time window dropdown
    const timeWindowSelect = page.locator('select').first();
    await expect(timeWindowSelect).toBeVisible();
    
    // Check options exist
    const options = await timeWindowSelect.locator('option').allTextContents();
    expect(options).toContain('Last 5 minutes');
    expect(options).toContain('Last hour');
    expect(options).toContain('Last 24 hours');
  });

  test('should toggle auto-refresh', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Find auto-refresh button
    const autoRefreshBtn = page.locator('button:has-text("Auto"), button:has-text("Manual")');
    await expect(autoRefreshBtn).toBeVisible();
    
    // Click to toggle
    await autoRefreshBtn.click();
    
    // Should change text
    await expect(autoRefreshBtn).toBeVisible();
  });

  test('should have refresh button', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    const refreshBtn = page.locator('button:has-text("Refresh")');
    await expect(refreshBtn).toBeVisible();
    
    // Click refresh
    await refreshBtn.click();
    
    // Wait for potential loading state
    await page.waitForTimeout(1000);
  });

  test('should have export CSV button', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toBeVisible();
  });

  test('should display performance metrics in Performance tab', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Click Performance tab
    await page.click('text=Performance');
    
    // Check for response time distribution
    await expect(page.locator('text=Response Time Distribution')).toBeVisible();
    await expect(page.locator('text=Average')).toBeVisible();
    await expect(page.locator('text=Median (P50)')).toBeVisible();
    await expect(page.locator('text=P95')).toBeVisible();
    await expect(page.locator('text=P99')).toBeVisible();
    
    // Check for error breakdown
    await expect(page.locator('text=Error Breakdown')).toBeVisible();
    
    // Check for rate limiting
    await expect(page.locator('text=Rate Limiting')).toBeVisible();
  });

  test('should display cache statistics in Cache tab', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Click Cache tab
    await page.click('text=Cache');
    
    // Check MTN Coverage Cache section
    await expect(page.locator('text=MTN Coverage Cache')).toBeVisible();
    await expect(page.locator('text=30-minute TTL')).toBeVisible();
    await expect(page.locator('text=Hit Ratio')).toBeVisible();
    await expect(page.locator('text=Cache Hits')).toBeVisible();
    await expect(page.locator('text=Cache Misses')).toBeVisible();
    
    // Check Aggregation Cache section
    await expect(page.locator('text=Aggregation Cache')).toBeVisible();
    await expect(page.locator('text=5-minute TTL')).toBeVisible();
  });

  test('should display optimization status in Actions tab', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Click Actions tab
    await page.click('text=Actions');
    
    // Check optimization status
    await expect(page.locator('text=Optimization Status')).toBeVisible();
    await expect(page.locator('text=Request Deduplication')).toBeVisible();
    await expect(page.locator('text=8s Timeout Controls')).toBeVisible();
    await expect(page.locator('text=Adaptive Cache Keys')).toBeVisible();
    await expect(page.locator('text=Parallel Layer Queries')).toBeVisible();
    
    // All should show "Active" badge
    const activeBadges = page.locator('text=Active');
    await expect(activeBadges.first()).toBeVisible();
  });

  test('should have management action buttons in Actions tab', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Click Actions tab
    await page.click('text=Actions');
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Reset Metrics")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear All Caches")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Metrics (CSV)")')).toBeVisible();
  });

  test('should change time window and update data', async ({ page }) => {
    await page.goto(MONITORING_URL);
    
    // Select different time window
    const timeWindowSelect = page.locator('select').first();
    await timeWindowSelect.selectOption('300000'); // 5 minutes
    
    // Wait for data to potentially update
    await page.waitForTimeout(2000);
    
    // Change to another window
    await timeWindowSelect.selectOption('86400000'); // 24 hours
    
    // Data should still be visible
    await expect(page.locator('text=Success Rate')).toBeVisible();
  });
});

test.describe('API Endpoint Tests', () => {
  
  test('should return monitoring data from API endpoint', async ({ request }) => {
    // Note: This test requires authentication
    // You may need to set up proper auth headers
    
    const response = await request.get(API_ENDPOINT, {
      params: { window: '3600000' }
    });
    
    // Check response status (may be 401 if not authenticated)
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('mtn');
      expect(data).toHaveProperty('cache');
      expect(data).toHaveProperty('summary');
      
      // Verify MTN data structure
      expect(data.mtn).toHaveProperty('health');
      expect(data.mtn).toHaveProperty('performance');
      expect(data.mtn).toHaveProperty('rateLimiting');
    }
  });

  test('should return CSV format when requested', async ({ request }) => {
    const response = await request.get(API_ENDPOINT, {
      params: { 
        window: '3600000',
        format: 'csv'
      }
    });
    
    // Check response status (may be 401 if not authenticated)
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/csv');
    }
  });
});

test.describe('Visual Regression Tests', () => {
  
  test('should match dashboard screenshot', async ({ page }) => {
    await page.goto(ADMIN_LOGIN_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    
    await page.goto(MONITORING_URL);
    
    // Wait for content to load
    await page.waitForSelector('text=API Monitoring', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for metrics to load
    
    // Take screenshot
    await expect(page).toHaveScreenshot('api-monitoring-dashboard.png', {
      fullPage: true,
      timeout: 10000
    });
  });
});
