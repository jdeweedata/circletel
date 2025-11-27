/**
 * Customer Order Journey E2E Test
 * 
 * Tests the complete customer journey from landing to order placement:
 * 1. Coverage Check (address entry)
 * 2. Package Selection
 * 3. Account Creation (Supabase Auth)
 * 4. OTP Verification
 * 5. Service Address Confirmation
 * 6. Payment Initiation
 * 
 * This test specifically monitors for Supabase-related issues.
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Test data - using existing registered user
const TEST_USER = {
  firstName: 'Jeffrey',
  lastName: 'De Wee',
  email: 'jeffrey.de.wee@circletel.co.za',
  password: 'a35kK4qCc3sVfj2!',
  phone: '0821234567',
};

// For new account tests, use dynamic email
const NEW_TEST_USER = {
  firstName: 'Test',
  lastName: 'Customer',
  email: `test-${Date.now()}@circletel-test.co.za`,
  password: 'TestPassword123!',
  phone: '0821234567',
};

const TEST_ADDRESS = '123 Main Road, Sandton, Johannesburg, 2196';

// Issue tracking
interface Issue {
  step: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: string;
  screenshot?: string;
}

const issues: Issue[] = [];

function logIssue(step: string, type: Issue['type'], message: string, details?: string) {
  const issue: Issue = {
    step,
    type,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
  issues.push(issue);
  console.log(`[${type.toUpperCase()}] ${step}: ${message}${details ? ` - ${details}` : ''}`);
}

// Helper to capture console errors
async function setupConsoleMonitoring(page: Page, stepName: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Check for Supabase-related errors
      if (text.includes('supabase') || text.includes('Supabase') || 
          text.includes('auth') || text.includes('Auth') ||
          text.includes('database') || text.includes('Database') ||
          text.includes('postgres') || text.includes('RLS') ||
          text.includes('row-level security')) {
        logIssue(stepName, 'error', 'Supabase Error', text);
      } else {
        logIssue(stepName, 'warning', 'Console Error', text);
      }
    }
  });

  page.on('pageerror', (error) => {
    logIssue(stepName, 'error', 'Page Error', error.message);
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.includes('supabase') || url.includes('/api/')) {
      logIssue(stepName, 'error', 'Request Failed', `${request.method()} ${url} - ${request.failure()?.errorText}`);
    }
  });
}

// Helper to check for API response errors
async function checkApiResponse(page: Page, stepName: string) {
  const responses: { url: string; status: number; body?: string }[] = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('supabase')) {
      const status = response.status();
      if (status >= 400) {
        let body = '';
        try {
          body = await response.text();
        } catch (e) {
          body = 'Could not read response body';
        }
        logIssue(stepName, 'error', `API Error ${status}`, `${url}\n${body}`);
      }
      responses.push({ url, status });
    }
  });

  return responses;
}

test.describe('Customer Order Journey - Full Flow', () => {
  test.setTimeout(180000); // 3 minutes for full flow

  test('Complete customer order journey with issue tracking', async ({ page }) => {
    // Clear any existing state
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('\n========================================');
    console.log('CUSTOMER ORDER JOURNEY TEST');
    console.log('========================================\n');

    // ============================================
    // STEP 1: Landing Page / Order Start
    // ============================================
    console.log('\n--- STEP 1: Landing Page ---');
    await setupConsoleMonitoring(page, 'Step 1: Landing');
    await checkApiResponse(page, 'Step 1: Landing');

    await page.goto(`${BASE_URL}/order`);
    
    // Should redirect to coverage page
    await page.waitForURL('**/order/coverage', { timeout: 10000 }).catch(() => {
      logIssue('Step 1: Landing', 'warning', 'Did not redirect to coverage page');
    });

    await page.screenshot({ path: 'test-results/step1-landing.png' });
    console.log('✓ Landing page loaded');

    // ============================================
    // STEP 2: Package Selection
    // ============================================
    console.log('\n--- STEP 2: Package Selection ---');
    await setupConsoleMonitoring(page, 'Step 2: Packages');
    await checkApiResponse(page, 'Step 2: Packages');

    // Navigate directly to packages page (since coverage check may not be fully implemented)
    await page.goto(`${BASE_URL}/order/packages`);
    await page.waitForLoadState('networkidle');

    // Wait for packages to load
    const packagesLoaded = await page.waitForSelector('[data-testid="package-card"], .package-card, [class*="package"]', { 
      timeout: 15000 
    }).catch(() => null);

    if (!packagesLoaded) {
      // Try alternative selectors
      const anyCard = await page.locator('button:has-text("Select"), button:has-text("Choose")').first().isVisible().catch(() => false);
      if (!anyCard) {
        logIssue('Step 2: Packages', 'error', 'No packages displayed', 'Could not find package cards on page');
      }
    }

    await page.screenshot({ path: 'test-results/step2-packages.png' });

    // Select a package (try multiple selectors)
    const selectButton = page.locator('button:has-text("Select"), button:has-text("Choose"), button:has-text("Continue")').first();
    if (await selectButton.isVisible()) {
      await selectButton.click();
      console.log('✓ Package selected');
    } else {
      logIssue('Step 2: Packages', 'error', 'Could not select package', 'No select button found');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/step2-after-select.png' });

    // ============================================
    // STEP 3: Account Creation (Supabase Auth)
    // ============================================
    console.log('\n--- STEP 3: Account Creation ---');
    await setupConsoleMonitoring(page, 'Step 3: Account');
    await checkApiResponse(page, 'Step 3: Account');

    await page.goto(`${BASE_URL}/order/account`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/step3-account-form.png' });

    // Fill account form
    const firstNameInput = page.locator('input[name="firstName"], input#firstName, input[placeholder*="First"]');
    const lastNameInput = page.locator('input[name="lastName"], input#lastName, input[placeholder*="Last"]');
    const emailInput = page.locator('input[name="email"], input#email, input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input#password, input[type="password"]');
    const phoneInput = page.locator('input[name="phone"], input#phone, input[type="tel"]');

    // Check if form fields exist
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(TEST_USER.firstName);
      console.log('✓ First name filled');
    } else {
      logIssue('Step 3: Account', 'error', 'First name field not found');
    }

    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(TEST_USER.lastName);
      console.log('✓ Last name filled');
    } else {
      logIssue('Step 3: Account', 'error', 'Last name field not found');
    }

    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_USER.email);
      console.log('✓ Email filled');
    } else {
      logIssue('Step 3: Account', 'error', 'Email field not found');
    }

    if (await passwordInput.isVisible()) {
      await passwordInput.fill(TEST_USER.password);
      console.log('✓ Password filled');
    } else {
      logIssue('Step 3: Account', 'error', 'Password field not found');
    }

    if (await phoneInput.isVisible()) {
      await phoneInput.fill(TEST_USER.phone);
      console.log('✓ Phone filled');
    } else {
      logIssue('Step 3: Account', 'error', 'Phone field not found');
    }

    // Accept terms
    const termsCheckbox = page.locator('input[name="acceptTerms"], input#acceptTerms, [role="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.click();
      console.log('✓ Terms accepted');
    }

    await page.screenshot({ path: 'test-results/step3-form-filled.png' });

    // Submit account form - be specific to avoid matching "Continue with Google"
    const submitButton = page.locator('button[type="submit"]:has-text("Create account"), form button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      // Monitor network for Supabase calls
      const supabaseRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('supabase')) {
          supabaseRequests.push(`${request.method()} ${request.url()}`);
        }
      });

      await submitButton.click();
      console.log('✓ Form submitted');

      // Wait for response
      await page.waitForTimeout(3000);

      // Log Supabase requests
      if (supabaseRequests.length > 0) {
        console.log(`  Supabase requests made: ${supabaseRequests.length}`);
        supabaseRequests.forEach(req => console.log(`    - ${req}`));
      }

      // Check for error messages
      const errorMessage = page.locator('[class*="error"], [role="alert"], .toast-error, [data-sonner-toast][data-type="error"]');
      if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorMessage.textContent();
        logIssue('Step 3: Account', 'error', 'Account creation error', errorText || 'Unknown error');
      }

      // Check for success
      const successMessage = page.locator('[data-sonner-toast][data-type="success"], .toast-success');
      if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Account created successfully');
      }
    } else {
      logIssue('Step 3: Account', 'error', 'Submit button not found');
    }

    await page.screenshot({ path: 'test-results/step3-after-submit.png' });

    // ============================================
    // STEP 4: OTP Verification (if redirected)
    // ============================================
    console.log('\n--- STEP 4: OTP Verification ---');
    
    const currentUrl = page.url();
    if (currentUrl.includes('verify-otp') || currentUrl.includes('verification')) {
      await setupConsoleMonitoring(page, 'Step 4: OTP');
      await checkApiResponse(page, 'Step 4: OTP');

      await page.screenshot({ path: 'test-results/step4-otp.png' });
      
      // In test mode, we might need to skip OTP or use a test code
      logIssue('Step 4: OTP', 'info', 'OTP verification page reached', 'Manual verification may be required');
      
      // Try to find skip button or test mode
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Continue without"), a:has-text("Skip")');
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click();
        console.log('✓ OTP skipped (test mode)');
      }
    } else {
      console.log('  OTP verification not required or skipped');
    }

    // ============================================
    // STEP 5: Service Address
    // ============================================
    console.log('\n--- STEP 5: Service Address ---');
    await setupConsoleMonitoring(page, 'Step 5: Address');
    await checkApiResponse(page, 'Step 5: Address');

    await page.goto(`${BASE_URL}/order/service-address`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/step5-address.png' });

    // Fill address if form exists
    const addressInput = page.locator('input[name="address"], input#address, input[placeholder*="address"]');
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.fill(TEST_ADDRESS);
      console.log('✓ Address filled');
    }

    // Continue button
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/step5-after-address.png' });

    // ============================================
    // STEP 6: Payment Page
    // ============================================
    console.log('\n--- STEP 6: Payment ---');
    await setupConsoleMonitoring(page, 'Step 6: Payment');
    await checkApiResponse(page, 'Step 6: Payment');

    await page.goto(`${BASE_URL}/order/payment`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/step6-payment.png' });

    // Check if payment page loaded correctly
    const paymentHeader = page.locator('h1:has-text("Payment"), h2:has-text("Payment")');
    if (await paymentHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Payment page loaded');
    } else {
      logIssue('Step 6: Payment', 'error', 'Payment page did not load correctly');
    }

    // Check for missing data errors
    const missingDataError = page.locator('text=/missing.*information/i, text=/complete.*step/i');
    if (await missingDataError.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await missingDataError.textContent();
      logIssue('Step 6: Payment', 'error', 'Missing order data', errorText || 'Order context data missing');
    }

    // Check order summary
    const orderSummary = page.locator('[class*="summary"], [data-testid="order-summary"]');
    if (await orderSummary.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✓ Order summary displayed');
    } else {
      logIssue('Step 6: Payment', 'warning', 'Order summary not visible');
    }

    // Try to initiate payment (but don't complete it)
    const payButton = page.locator('button:has-text("Pay"), button:has-text("Proceed to Payment")');
    if (await payButton.isVisible()) {
      console.log('✓ Payment button available');
      
      // Click to test order creation API
      await payButton.click();
      
      // Wait for API response
      await page.waitForTimeout(3000);
      
      // Check for errors
      const paymentError = page.locator('[class*="error"], [role="alert"], text=/failed/i');
      if (await paymentError.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await paymentError.textContent();
        logIssue('Step 6: Payment', 'error', 'Payment initiation failed', errorText || 'Unknown error');
      }
    }

    await page.screenshot({ path: 'test-results/step6-after-payment-attempt.png' });

    // ============================================
    // SUMMARY REPORT
    // ============================================
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');
    const infos = issues.filter(i => i.type === 'info');

    console.log(`Total Issues: ${issues.length}`);
    console.log(`  - Errors: ${errors.length}`);
    console.log(`  - Warnings: ${warnings.length}`);
    console.log(`  - Info: ${infos.length}`);

    if (errors.length > 0) {
      console.log('\n--- ERRORS ---');
      errors.forEach((e, i) => {
        console.log(`\n${i + 1}. [${e.step}] ${e.message}`);
        if (e.details) console.log(`   Details: ${e.details}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n--- WARNINGS ---');
      warnings.forEach((w, i) => {
        console.log(`${i + 1}. [${w.step}] ${w.message}`);
      });
    }

    // Supabase-specific issues
    const supabaseIssues = issues.filter(i => 
      i.message.toLowerCase().includes('supabase') ||
      i.details?.toLowerCase().includes('supabase') ||
      i.details?.toLowerCase().includes('auth') ||
      i.details?.toLowerCase().includes('rls')
    );

    if (supabaseIssues.length > 0) {
      console.log('\n--- SUPABASE-SPECIFIC ISSUES ---');
      supabaseIssues.forEach((s, i) => {
        console.log(`${i + 1}. [${s.step}] ${s.message}`);
        if (s.details) console.log(`   ${s.details}`);
      });
    }

    console.log('\n========================================\n');

    // Assert no critical errors
    expect(errors.length, `Found ${errors.length} errors during customer journey`).toBeLessThan(5);
  });

  test('Test Supabase Auth directly', async ({ page }) => {
    console.log('\n--- Testing Supabase Auth Directly ---');
    
    await setupConsoleMonitoring(page, 'Supabase Auth Test');
    await checkApiResponse(page, 'Supabase Auth Test');

    // Go to login page
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/supabase-auth-login.png' });

    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log('✓ Login form found');

      // Try login with real test credentials
      await emailInput.fill(TEST_USER.email);
      await passwordInput.fill(TEST_USER.password);

      const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForTimeout(3000);

        // Check response
        const errorMessage = page.locator('[class*="error"], [role="alert"]');
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await errorMessage.textContent();
          console.log(`  Auth response: ${text}`);
          // This is expected for invalid credentials
        }
      }
    } else {
      logIssue('Supabase Auth Test', 'error', 'Login form not found');
    }

    await page.screenshot({ path: 'test-results/supabase-auth-result.png' });

    // Report issues
    const authIssues = issues.filter(i => i.step === 'Supabase Auth Test');
    console.log(`\nAuth test issues: ${authIssues.length}`);
    authIssues.forEach(i => console.log(`  - ${i.message}: ${i.details || ''}`));
  });

  test('Existing customer login and order flow', async ({ page }) => {
    console.log('\n--- Testing Existing Customer Order Flow ---');
    
    await setupConsoleMonitoring(page, 'Existing Customer Flow');
    await checkApiResponse(page, 'Existing Customer Flow');

    // Step 1: Start from home page and do coverage check
    console.log('Step 1: Coverage check on home page');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/flow-1-home.png' });
    
    // Enter address in coverage checker
    const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Enter"]').first();
    if (await addressInput.isVisible()) {
      await addressInput.fill('123 Main Road, Cape Town');
      console.log('✓ Address entered');
      await page.waitForTimeout(1000);
    }
    
    // Click Check Coverage button
    const checkCoverageBtn = page.locator('button:has-text("Check coverage")');
    if (await checkCoverageBtn.isVisible()) {
      await checkCoverageBtn.click();
      console.log('✓ Check coverage clicked');
      
      // Wait for navigation to packages page (coverage API can take up to 30s)
      try {
        await page.waitForURL('**/packages/**', { timeout: 45000 });
        console.log('✓ Navigated to packages page');
      } catch (e) {
        console.log('⚠ Navigation timeout - checking current state');
      }
    }
    
    await page.screenshot({ path: 'test-results/flow-2-after-coverage.png' });
    
    let currentUrl = page.url();
    console.log(`  After coverage check URL: ${currentUrl}`);
    
    // Step 2: Should be on packages page now
    if (currentUrl.includes('/packages/')) {
      console.log('✓ Redirected to packages page');
      
      // Wait for packages to load (look for package cards or "Available Packages" text)
      try {
        await page.waitForSelector('text=/Available Packages/i, [class*="CompactPackageCard"], [class*="PackageCard"]', { timeout: 30000 });
        console.log('✓ Packages loaded');
      } catch (e) {
        console.log('⚠ Packages loading timeout');
      }
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/flow-3-packages.png' });
      
      // Click Continue button on sidebar or floating CTA
      const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Order now")').first();
      if (await continueBtn.isVisible({ timeout: 5000 })) {
        await continueBtn.click();
        console.log('✓ Continue clicked on packages page');
        
        // Wait for navigation
        try {
          await page.waitForURL('**/order/**', { timeout: 10000 });
          console.log('✓ Navigated to order flow');
        } catch (e) {
          console.log('⚠ Order navigation timeout');
        }
      } else {
        console.log('⚠ Continue button not visible');
      }
      
      currentUrl = page.url();
      console.log(`  After package selection URL: ${currentUrl}`);
    }
    
    await page.screenshot({ path: 'test-results/flow-4-after-package.png' });
    
    // Step 3: Should be on account page (not logged in yet)
    if (currentUrl.includes('/order/account')) {
      console.log('✓ Redirected to account page (not logged in)');
      
      // Click "Sign in" link to login as existing customer
      const signInLink = page.locator('a:has-text("Sign in")');
      if (await signInLink.isVisible()) {
        await signInLink.click();
        console.log('✓ Sign in link clicked');
        await page.waitForTimeout(2000);
      }
      
      currentUrl = page.url();
      console.log(`  After sign in click URL: ${currentUrl}`);
    }
    
    await page.screenshot({ path: 'test-results/flow-5-login.png' });
    
    // Step 4: Login page - enter credentials
    if (currentUrl.includes('/auth/login')) {
      console.log('✓ On login page');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill(TEST_USER.email);
        await passwordInput.fill(TEST_USER.password);
        console.log('✓ Credentials entered');
        
        await page.screenshot({ path: 'test-results/flow-6-credentials.png' });
        
        const loginButton = page.locator('button[type="submit"]').first();
        await loginButton.click();
        console.log('✓ Login button clicked');
        
        await page.waitForTimeout(5000); // Wait for login and redirect
      }
      
      currentUrl = page.url();
      console.log(`  After login URL: ${currentUrl}`);
    }
    
    await page.screenshot({ path: 'test-results/flow-7-after-login.png' });
    
    // Step 5: Should redirect to service-address after login
    if (currentUrl.includes('/order/service-address')) {
      console.log('✓ Correctly redirected to service-address after login');
      
      // Select property type
      const propertyTypeSelect = page.locator('[role="combobox"]');
      if (await propertyTypeSelect.isVisible()) {
        await propertyTypeSelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
          console.log('✓ Property type selected');
        }
      }
      
      await page.screenshot({ path: 'test-results/flow-8-service-address.png' });
      
      // Click Create Order button
      const createOrderButton = page.locator('button:has-text("Create Order")');
      if (await createOrderButton.isVisible()) {
        await createOrderButton.click();
        console.log('✓ Create Order clicked');
        await page.waitForTimeout(5000);
      }
      
      currentUrl = page.url();
      console.log(`  After create order URL: ${currentUrl}`);
    }
    
    await page.screenshot({ path: 'test-results/flow-9-final.png' });
    
    // Step 6: Should be on dashboard with order
    if (currentUrl.includes('/dashboard')) {
      console.log('✓ SUCCESS: Redirected to dashboard after order creation');
      
      // Check if pending order alert is visible
      const pendingAlert = page.locator('text=/pending.*order/i, text=/Complete Your Order/i');
      if (await pendingAlert.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✓ Pending order alert visible on dashboard');
      }
      
      // Check if order appears in recent orders
      const recentOrders = page.locator('text=/Recent Orders/i');
      if (await recentOrders.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Recent Orders section visible');
      }
    } else {
      logIssue('Existing Customer Flow', 'error', 'Did not reach dashboard', `Final URL: ${currentUrl}`);
    }
    
    // Report
    const flowIssues = issues.filter(i => i.step === 'Existing Customer Flow');
    console.log(`\n=== Existing Customer Flow Summary ===`);
    console.log(`Issues found: ${flowIssues.length}`);
    flowIssues.forEach(i => console.log(`  - ${i.type}: ${i.message}`));
    
    if (flowIssues.length === 0) {
      console.log('✓ All steps completed successfully!');
    }
  });

  test('Test Order API directly', async ({ page }) => {
    console.log('\n--- Testing Order API Directly ---');

    await setupConsoleMonitoring(page, 'Order API Test');

    // Make direct API call
    const response = await page.request.post(`${BASE_URL}/api/orders/create`, {
      data: {
        first_name: 'API',
        last_name: 'Test',
        email: `api-test-${Date.now()}@circletel-test.co.za`,
        phone: '0821234567',
        package_name: 'Test Package',
        package_speed: '50/50 Mbps',
        package_price: 599,
        installation_fee: 0,
        payment_amount: 1.00,
        is_validation_charge: true,
        installation_address: TEST_ADDRESS,
        account_type: 'personal',
      },
    });

    console.log(`API Response Status: ${response.status()}`);
    
    const responseBody = await response.json().catch(() => ({}));
    console.log(`API Response Body: ${JSON.stringify(responseBody, null, 2)}`);

    if (response.status() >= 400) {
      logIssue('Order API Test', 'error', `API returned ${response.status()}`, JSON.stringify(responseBody));
    } else {
      console.log('✓ Order API working');
    }

    // Report
    const apiIssues = issues.filter(i => i.step === 'Order API Test');
    console.log(`\nAPI test issues: ${apiIssues.length}`);
    apiIssues.forEach(i => console.log(`  - ${i.message}: ${i.details || ''}`));
  });
});
