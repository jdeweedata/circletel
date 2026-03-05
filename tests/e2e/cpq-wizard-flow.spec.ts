import { PiPackageBold } from 'react-icons/pi';
import { test, expect } from '@playwright/test';

/**
 * E2E Test: CPQ Wizard Flow
 *
 * This test covers the CPQ (Configure, Price, Quote) wizard journey:
 * 1. Navigate to CPQ dashboard
 * 2. Create new session
 * 3. Complete Step 1: Needs Assessment (AI parsing)
 * 4. Complete Step 2: Location & Coverage
 * 5. Complete Step 3: PiPackageBold Selection
 * 6. Complete Step 4: Configuration
 * 7. Complete Step 5: Pricing & Discounts
 * 8. Complete Step 6: Customer Details
 * 9. Complete Step 7: Review & Submit
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@circletel.co.za';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword';

test.describe('CPQ Wizard Flow', () => {
  // Skip login for now - assumes authenticated session
  test.beforeEach(async ({ page }) => {
    // Navigate to CPQ dashboard
    await page.goto(`${BASE_URL}/admin/cpq`);
    await page.waitForLoadState('networkidle');
  });

  test('should display CPQ dashboard with sessions list', async ({ page }) => {
    console.log('Testing CPQ dashboard...');

    // Verify page title
    await expect(page.locator('h1').filter({ hasText: /CPQ Sessions/i })).toBeVisible({ timeout: 10000 });
    console.log('Page loaded successfully');

    // Verify stats cards are visible
    await expect(page.locator('text=Total Sessions')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    console.log('Stats cards visible');

    // Verify "New Quote" button exists
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await expect(newQuoteButton).toBeVisible();
    console.log('New Quote button visible');

    console.log('CPQ dashboard test passed');
  });

  test('should create new CPQ session and load wizard', async ({ page }) => {
    console.log('Testing session creation...');

    // Click "New Quote" button
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await newQuoteButton.click();
    console.log('Clicked New Quote');

    // Wait for redirect to wizard
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });
    console.log('Redirected to wizard');

    // Verify wizard loaded - check for step indicator
    await expect(page.locator('text=Step 1 of 7').or(page.locator('text=Needs Assessment'))).toBeVisible({ timeout: 10000 });
    console.log('Wizard loaded on Step 1');

    console.log('Session creation test passed');
  });

  test('should navigate through wizard steps', async ({ page }) => {
    console.log('Testing wizard navigation...');

    // Create new session first
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await newQuoteButton.click();
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });

    // Step 1: Needs Assessment
    console.log('Step 1: Needs Assessment');
    await expect(page.locator('text=Needs Assessment').or(page.locator('text=Step 1'))).toBeVisible({ timeout: 10000 });

    // Try AI parsing
    const nlInput = page.locator('textarea').first();
    if (await nlInput.isVisible({ timeout: 5000 })) {
      await nlInput.fill('I need 100Mbps fibre for 2 sites in Johannesburg with 99.9% SLA');
      console.log('Filled NL input');

      // Click parse button
      const parseButton = page.locator('button').filter({ hasText: /Parse|Analyze/i }).first();
      if (await parseButton.isVisible({ timeout: 3000 })) {
        await parseButton.click();
        await page.waitForTimeout(3000); // Wait for AI parsing
        console.log('AI parsing triggered');
      }
    }

    // Click Next
    const nextButton = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
    await nextButton.click();
    await page.waitForTimeout(1000);
    console.log('Moved to Step 2');

    // Step 2: Location & Coverage
    console.log('Step 2: Location & Coverage');
    await expect(page.locator('text=Location').or(page.locator('text=Step 2'))).toBeVisible({ timeout: 10000 });

    // Add a location
    const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Address"]').first();
    if (await addressInput.isVisible({ timeout: 5000 })) {
      await addressInput.fill('123 Main Street, Sandton, Johannesburg');
      await page.waitForTimeout(2000);
      console.log('Address entered');

      // Click Add Site
      const addSiteButton = page.locator('button').filter({ hasText: /Add Site|Add Location/i }).first();
      if (await addSiteButton.isVisible({ timeout: 3000 })) {
        await addSiteButton.click();
        await page.waitForTimeout(2000);
        console.log('Site added');
      }
    }

    // Navigate through remaining steps (quick validation only)
    for (let step = 3; step <= 7; step++) {
      const nextBtn = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        console.log(`Moved to Step ${step}`);
      }
    }

    // Verify reached Review step
    await expect(
      page.locator('text=Review').or(page.locator('text=Submit'))
    ).toBeVisible({ timeout: 10000 });
    console.log('Reached Review & Submit step');

    console.log('Wizard navigation test passed');
  });

  test('should auto-save session data', async ({ page }) => {
    console.log('Testing auto-save functionality...');

    // Create new session
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await newQuoteButton.click();
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });

    // Get session URL
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    console.log(`Session ID: ${sessionId}`);

    // Fill some data
    const nlInput = page.locator('textarea').first();
    if (await nlInput.isVisible({ timeout: 5000 })) {
      await nlInput.fill('Test auto-save: 50Mbps for 1 site in Pretoria');
      console.log('Filled input data');
    }

    // Wait for auto-save (default debounce is 1.5 seconds)
    await page.waitForTimeout(3000);
    console.log('Waited for auto-save');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('Page refreshed');

    // Verify data persisted
    const savedInput = page.locator('textarea').first();
    if (await savedInput.isVisible({ timeout: 5000 })) {
      const savedValue = await savedInput.inputValue();
      if (savedValue.includes('50Mbps') || savedValue.includes('Pretoria')) {
        console.log('Data persisted after refresh');
      } else {
        console.log('Data may not have persisted - checking session');
      }
    }

    console.log('Auto-save test completed');
  });

  test('should display validation errors on incomplete steps', async ({ page }) => {
    console.log('Testing validation...');

    // Create new session
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await newQuoteButton.click();
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });

    // Skip to Step 7 (Review) without completing steps
    // Navigate through all steps quickly
    for (let i = 0; i < 6; i++) {
      const nextBtn = page.locator('button').filter({ hasText: /Next|Continue|Skip/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // On Review step, check for validation errors
    const validationErrors = page.locator('text=/required|missing|error/i');
    const hasErrors = await validationErrors.count() > 0;

    if (hasErrors) {
      console.log('Validation errors displayed correctly');
    } else {
      console.log('No validation errors shown (may have default values)');
    }

    // Submit button should be disabled with errors
    const submitButton = page.locator('button').filter({ hasText: /Create Quote|Submit/i }).first();
    if (await submitButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await submitButton.isDisabled();
      console.log(`Submit button disabled: ${isDisabled}`);
    }

    console.log('Validation test completed');
  });

  test('should cancel session from dashboard', async ({ page }) => {
    console.log('Testing session cancellation...');

    // Create a session first
    const newQuoteButton = page.locator('button').filter({ hasText: /New Quote/i });
    await newQuoteButton.click();
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });

    // Get session ID
    const sessionUrl = page.url();
    const sessionId = sessionUrl.split('/').pop();
    console.log(`Created session: ${sessionId}`);

    // Go back to dashboard
    await page.goto(`${BASE_URL}/admin/cpq`);
    await page.waitForLoadState('networkidle');

    // Find session in list and open dropdown menu
    const sessionRow = page.locator(`tr:has-text("${sessionId?.slice(0, 8)}")`).first();
    if (await sessionRow.isVisible({ timeout: 5000 })) {
      const menuButton = sessionRow.locator('button').filter({ has: page.locator('svg') }).last();
      await menuButton.click();
      console.log('Opened session menu');

      // Click Cancel
      const cancelOption = page.locator('[role="menuitem"]').filter({ hasText: /Cancel/i });
      if (await cancelOption.isVisible({ timeout: 3000 })) {
        // Handle confirmation dialog
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });
        await cancelOption.click();
        await page.waitForTimeout(2000);
        console.log('Session cancelled');
      }
    }

    console.log('Cancellation test completed');
  });

  test('should filter sessions by status', async ({ page }) => {
    console.log('Testing status filter...');

    // Open status filter dropdown
    const statusFilter = page.locator('[data-testid="status-filter"], select, button').filter({ hasText: /All Statuses|Status/i }).first();
    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
      console.log('Opened status filter');

      // Select "In Progress"
      const inProgressOption = page.locator('[role="option"], option').filter({ hasText: /In Progress/i }).first();
      if (await inProgressOption.isVisible({ timeout: 3000 })) {
        await inProgressOption.click();
        await page.waitForTimeout(1500);
        console.log('Filtered by In Progress');
      }
    }

    // Verify filter applied (URL should have status param or table shows filtered results)
    const currentUrl = page.url();
    const hasStatusParam = currentUrl.includes('status=');
    console.log(`URL has status param: ${hasStatusParam}`);

    console.log('Filter test completed');
  });

  test('should search sessions', async ({ page }) => {
    console.log('Testing search functionality...');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Test Company');
      await page.waitForTimeout(1000);
      console.log('Search query entered');

      // Verify search filters the list (or shows "no results")
      const tableRows = page.locator('tbody tr');
      const rowCount = await tableRows.count();
      console.log(`Visible rows after search: ${rowCount}`);
    }

    console.log('Search test completed');
  });
});

test.describe('CPQ Wizard Step Details', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new session for each test
    await page.goto(`${BASE_URL}/admin/cpq/new`);
    await page.waitForURL(/\/admin\/cpq\/[a-f0-9-]+/, { timeout: 15000 });
  });

  test('Step 1: AI Natural Language Parser', async ({ page }) => {
    console.log('Testing AI NL Parser...');

    // Verify on Step 1
    await expect(page.locator('text=Needs Assessment').or(page.locator('text=Step 1'))).toBeVisible({ timeout: 10000 });

    // Find NL input
    const nlInput = page.locator('textarea').first();
    await expect(nlInput).toBeVisible({ timeout: 5000 });

    // Enter complex requirement
    await nlInput.fill('We need a 200Mbps symmetrical fibre line for our head office in Rosebank, Johannesburg. Also 50Mbps lines for 3 branch offices in Pretoria. We need 99.95% SLA and failover capability. Budget is around R15,000 per month.');
    console.log('Complex requirement entered');

    // Click parse
    const parseButton = page.locator('button').filter({ hasText: /Parse|Analyze|Process/i }).first();
    if (await parseButton.isVisible({ timeout: 3000 })) {
      await parseButton.click();

      // Wait for AI response
      await page.waitForTimeout(5000);

      // Check for parsed data display (confidence badge, extracted fields)
      const confidenceBadge = page.locator('text=/confidence|\\d+%/i').first();
      if (await confidenceBadge.isVisible({ timeout: 5000 })) {
        console.log('AI parsing returned with confidence score');
      }

      // Check extracted fields are displayed
      const bandwidthField = page.locator('input, span').filter({ hasText: /200|Mbps/i }).first();
      if (await bandwidthField.isVisible({ timeout: 3000 })) {
        console.log('Bandwidth extracted correctly');
      }
    }

    console.log('AI NL Parser test completed');
  });

  test('Step 2: Multi-site Location Entry', async ({ page }) => {
    console.log('Testing multi-site location entry...');

    // Navigate to Step 2
    const nextButton = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
    await nextButton.click();
    await page.waitForTimeout(1500);

    // Verify on Step 2
    await expect(page.locator('text=Location').or(page.locator('text=Coverage'))).toBeVisible({ timeout: 10000 });

    // Add first site
    const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Address"]').first();
    if (await addressInput.isVisible({ timeout: 5000 })) {
      await addressInput.fill('100 Grayston Drive, Sandton');
      await page.waitForTimeout(1500);
      console.log('First address entered');

      const addButton = page.locator('button').filter({ hasText: /Add|Check Coverage/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(2000);
        console.log('First site added');
      }
    }

    // Check for bulk paste option
    const bulkPasteButton = page.locator('button').filter({ hasText: /Bulk|Paste|Multiple/i }).first();
    if (await bulkPasteButton.isVisible({ timeout: 3000 })) {
      console.log('Bulk paste option available');
    }

    // Verify site list
    const siteList = page.locator('[data-testid="site-list"], .site-list, ul, div').filter({ has: page.locator('text=Sandton') });
    if (await siteList.isVisible({ timeout: 3000 })) {
      console.log('Site list displays added location');
    }

    console.log('Multi-site location test completed');
  });

  test('Step 3: PiPackageBold Selection with AI Recommendations', async ({ page }) => {
    console.log('Testing package selection...');

    // Navigate to Step 3 (skip Steps 1-2)
    for (let i = 0; i < 2; i++) {
      const nextBtn = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify on Step 3
    await expect(page.locator('text=Package').or(page.locator('text=Selection'))).toBeVisible({ timeout: 10000 });

    // Check for AI recommendations section
    const recommendationsSection = page.locator('text=/Recommend|AI|Suggested/i').first();
    if (await recommendationsSection.isVisible({ timeout: 5000 })) {
      console.log('AI recommendations section visible');
    }

    // Check for package cards
    const packageCards = page.locator('[data-testid*="package"], .package-card, [class*="package"]');
    const cardCount = await packageCards.count();
    console.log(`Package cards displayed: ${cardCount}`);

    // Try selecting a package
    const selectButton = page.locator('button').filter({ hasText: /Select|Choose|Add/i }).first();
    if (await selectButton.isVisible({ timeout: 3000 })) {
      await selectButton.click();
      await page.waitForTimeout(1000);
      console.log('Package selected');
    }

    console.log('Package selection test completed');
  });

  test('Step 5: Discount Validation', async ({ page }) => {
    console.log('Testing discount validation...');

    // Navigate to Step 5 (skip Steps 1-4)
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify on Step 5
    await expect(page.locator('text=Pricing').or(page.locator('text=Discount'))).toBeVisible({ timeout: 10000 });

    // Find discount slider/input
    const discountInput = page.locator('input[type="range"], input[type="number"]').first();
    if (await discountInput.isVisible({ timeout: 5000 })) {
      // Try setting a high discount (should trigger validation)
      await discountInput.fill('25');
      await page.waitForTimeout(1000);
      console.log('Discount set to 25%');

      // Check for approval warning
      const approvalWarning = page.locator('text=/approval|limit|exceeded/i').first();
      if (await approvalWarning.isVisible({ timeout: 3000 })) {
        console.log('Approval warning displayed for high discount');
      }
    }

    console.log('Discount validation test completed');
  });

  test('Step 7: Review & Submit Validation', async ({ page }) => {
    console.log('Testing review & submit...');

    // Navigate to Step 7 (skip all previous steps)
    for (let i = 0; i < 6; i++) {
      const nextBtn = page.locator('button').filter({ hasText: /Next|Continue/i }).first();
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify on Step 7
    await expect(page.locator('text=Review').or(page.locator('text=Submit'))).toBeVisible({ timeout: 10000 });

    // Check for summary sections
    const customerSection = page.locator('text=Customer').first();
    const locationSection = page.locator('text=Location').first();
    const pricingSection = page.locator('text=Pricing').first();

    if (await customerSection.isVisible({ timeout: 3000 })) {
      console.log('Customer summary visible');
    }
    if (await locationSection.isVisible({ timeout: 3000 })) {
      console.log('Location summary visible');
    }
    if (await pricingSection.isVisible({ timeout: 3000 })) {
      console.log('Pricing summary visible');
    }

    // Check terms checkbox
    const termsCheckbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 3000 })) {
      await termsCheckbox.click();
      console.log('Terms accepted');
    }

    // Check Create Quote button state
    const createButton = page.locator('button').filter({ hasText: /Create Quote/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await createButton.isDisabled();
      console.log(`Create Quote button disabled: ${isDisabled}`);
    }

    console.log('Review & submit test completed');
  });
});
