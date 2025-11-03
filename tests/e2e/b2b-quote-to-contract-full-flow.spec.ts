/**
 * B2B Quote-to-Contract Complete Workflow E2E Test
 * Task Group 14: E2E Testing & Deployment
 * 
 * Tests the full happy path from quote approval to service activation:
 * Quote → KYC → Contract → Payment → Order → RICA → Activation
 * 
 * Uses mocked external services (Didit, NetCash, Zoho, ICASA)
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_QUOTE = {
  company_name: 'Test Company Ltd',
  contact_name: 'John Doe',
  contact_email: 'john.doe@testcompany.co.za',
  contact_phone: '+27821234567',
  service_address: '123 Main Street, Gardens, Cape Town, 8001',
  package_name: '100Mbps Fibre',
  monthly_price: 799.00,
  installation_fee: 699.00,
};

const TEST_KYC_DATA = {
  id_number: '8001015009087',
  full_name: 'John Doe',
  liveness_score: 0.98,
  document_authenticity: 0.95,
  aml_flags: [],
};

test.describe('B2B Quote-to-Contract Full Workflow', () => {
  let adminPage: Page;
  let customerPage: Page;
  let quoteId: string;
  let contractNumber: string;
  let orderNumber: string;

  test.beforeAll(async ({ browser }) => {
    // Create separate contexts for admin and customer
    const adminContext = await browser.newContext();
    const customerContext = await browser.newContext();
    
    adminPage = await adminContext.newPage();
    customerPage = await customerContext.newPage();
  });

  test.afterAll(async () => {
    await adminPage.close();
    await customerPage.close();
  });

  test('Step 1: Admin creates business quote', async () => {
    // Navigate to admin login
    await adminPage.goto('/admin/login');
    
    // Login as admin
    await adminPage.fill('input[name="email"]', 'admin@circletel.co.za');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(adminPage.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
    
    // Navigate to quotes
    await adminPage.click('text=Quotes');
    await adminPage.click('text=Create Quote');
    
    // Fill quote form
    await adminPage.fill('input[name="company_name"]', TEST_QUOTE.company_name);
    await adminPage.fill('input[name="contact_name"]', TEST_QUOTE.contact_name);
    await adminPage.fill('input[name="contact_email"]', TEST_QUOTE.contact_email);
    await adminPage.fill('input[name="contact_phone"]', TEST_QUOTE.contact_phone);
    await adminPage.fill('input[name="service_address"]', TEST_QUOTE.service_address);
    
    // Select package
    await adminPage.click('text=100Mbps Fibre');
    
    // Submit quote
    await adminPage.click('button:has-text("Create Quote")');
    
    // Wait for success and extract quote ID
    await expect(adminPage.locator('text=Quote created successfully')).toBeVisible({ timeout: 5000 });
    
    const quoteNumberElement = await adminPage.locator('[data-testid="quote-number"]');
    const quoteNumberText = await quoteNumberElement.textContent();
    quoteId = quoteNumberText?.match(/QT-\d{4}-\d{3}/)?.[0] || '';
    
    expect(quoteId).toMatch(/QT-\d{4}-\d{3}/);
    console.log('✅ Quote created:', quoteId);
  });

  test('Step 2: Manager approves quote', async () => {
    // Navigate to quotes list
    await adminPage.goto('/admin/quotes');
    
    // Find the quote
    await adminPage.fill('input[placeholder="Search quotes..."]', quoteId);
    await adminPage.click(`text=${quoteId}`);
    
    // Approve quote
    await adminPage.click('button:has-text("Approve")');
    await adminPage.fill('textarea[name="approval_notes"]', 'Approved for standard installation');
    await adminPage.click('button:has-text("Confirm Approval")');
    
    // Verify approval
    await expect(adminPage.locator('text=Quote approved')).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator('[data-testid="quote-status"]')).toContainText('Approved');
    
    console.log('✅ Quote approved');
  });

  test('Step 3: Customer completes KYC verification (mocked)', async () => {
    // In real scenario, customer would receive email with KYC link
    // For testing, navigate directly to KYC page
    await customerPage.goto(`/customer/quote/${quoteId}/kyc`);
    
    // Mock Didit iframe completion by calling API directly
    const kycResponse = await customerPage.request.post('/api/compliance/webhook/didit', {
      data: {
        event_type: 'verification.completed',
        session_id: 'test-didit-session-123',
        quote_id: quoteId,
        result: {
          verified: true,
          liveness_passed: true,
          document_verified: true,
        },
        extracted_data: TEST_KYC_DATA,
        timestamp: new Date().toISOString(),
      },
      headers: {
        'X-Didit-Signature': 'mocked-signature-for-testing',
      },
    });
    
    expect(kycResponse.ok()).toBeTruthy();
    
    // Verify KYC completion on UI
    await customerPage.reload();
    await expect(customerPage.locator('text=Verification Complete')).toBeVisible({ timeout: 10000 });
    await expect(customerPage.locator('[data-testid="kyc-status"]')).toContainText('Approved');
    
    console.log('✅ KYC verification completed');
  });

  test('Step 4: Contract is auto-generated', async () => {
    // Check admin view for contract generation
    await adminPage.goto(`/admin/quotes/${quoteId}`);
    
    // Wait for contract generation
    await expect(adminPage.locator('text=Contract Generated')).toBeVisible({ timeout: 15000 });
    
    // Extract contract number
    const contractElement = await adminPage.locator('[data-testid="contract-number"]');
    contractNumber = (await contractElement.textContent()) || '';
    
    expect(contractNumber).toMatch(/CT-\d{4}-\d{3}/);
    console.log('✅ Contract generated:', contractNumber);
  });

  test('Step 5: Customer signs contract (mocked Zoho Sign)', async () => {
    // Navigate to contract signing page
    await customerPage.goto(`/customer/contracts/${contractNumber}`);
    
    // Mock Zoho Sign signature by calling webhook
    const signResponse = await customerPage.request.post(`/api/contracts/${contractNumber}/signature-webhook`, {
      data: {
        event_type: 'request.signed',
        request_id: 'zoho-sign-request-123',
        contract_id: contractNumber,
        signer_email: TEST_QUOTE.contact_email,
        signed_at: new Date().toISOString(),
        all_signed: true,
      },
    });
    
    expect(signResponse.ok()).toBeTruthy();
    
    // Verify signature completion
    await customerPage.reload();
    await expect(customerPage.locator('text=Contract Signed')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Contract signed');
  });

  test('Step 6: Invoice is generated', async () => {
    // Check for invoice generation
    await adminPage.goto(`/admin/contracts/${contractNumber}`);
    
    // Wait for invoice
    await expect(adminPage.locator('text=Invoice Generated')).toBeVisible({ timeout: 10000 });
    
    const invoiceElement = await adminPage.locator('[data-testid="invoice-number"]');
    const invoiceNumber = (await invoiceElement.textContent()) || '';
    
    expect(invoiceNumber).toMatch(/INV-\d{4}-\d{3}/);
    console.log('✅ Invoice generated:', invoiceNumber);
  });

  test('Step 7: Payment is completed (mocked NetCash)', async () => {
    // Get invoice ID from admin page
    const invoiceId = await adminPage.getAttribute('[data-testid="invoice-id"]', 'data-id');
    
    // Mock NetCash payment webhook
    const paymentResponse = await adminPage.request.post('/api/payments/webhook', {
      data: {
        event_type: 'payment.completed',
        transaction_id: 'netcash-txn-123456',
        invoice_id: invoiceId,
        amount: TEST_QUOTE.monthly_price + TEST_QUOTE.installation_fee,
        status: 'completed',
        payment_method: 'card',
        customer_email: TEST_QUOTE.contact_email,
        timestamp: new Date().toISOString(),
      },
      headers: {
        'X-NetCash-Signature': 'mocked-signature',
      },
    });
    
    expect(paymentResponse.ok()).toBeTruthy();
    
    // Verify payment success
    await adminPage.reload();
    await expect(adminPage.locator('text=Payment Received')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Payment completed');
  });

  test('Step 8: Order is auto-created', async () => {
    // Navigate to orders
    await adminPage.goto('/admin/orders');
    
    // Search for order by customer email
    await adminPage.fill('input[placeholder="Search orders..."]', TEST_QUOTE.contact_email);
    
    // Verify order exists
    await expect(adminPage.locator('text=ORD-')).toBeVisible({ timeout: 10000 });
    
    const orderElement = await adminPage.locator('[data-testid="order-number"]').first();
    orderNumber = (await orderElement.textContent()) || '';
    
    expect(orderNumber).toMatch(/ORD-\d{4}-\d{3}/);
    console.log('✅ Order created:', orderNumber);
  });

  test('Step 9: RICA is submitted (mocked)', async () => {
    // Check order details
    await adminPage.click(`text=${orderNumber}`);
    
    // Wait for RICA submission
    await expect(adminPage.locator('text=RICA Submitted')).toBeVisible({ timeout: 15000 });
    
    const ricaElement = await adminPage.locator('[data-testid="rica-tracking-id"]');
    const ricaTrackingId = (await ricaElement.textContent()) || '';
    
    expect(ricaTrackingId).toMatch(/RICA-\d{4}-\d{6}/);
    console.log('✅ RICA submitted:', ricaTrackingId);
  });

  test('Step 10: RICA is approved (mocked ICASA)', async () => {
    // Get order ID
    const orderId = await adminPage.getAttribute('[data-testid="order-id"]', 'data-id');
    
    // Mock ICASA approval webhook
    const ricaResponse = await adminPage.request.post('/api/activation/rica-webhook', {
      data: {
        event_type: 'rica.approved',
        tracking_id: 'RICA-2025-123456',
        order_id: orderId,
        approved_at: new Date().toISOString(),
        approval_reference: 'APPR-789',
        service_lines: [
          {
            iccid: '8927123456789012345',
            status: 'active',
            activation_date: new Date().toISOString(),
          },
        ],
      },
    });
    
    expect(ricaResponse.ok()).toBeTruthy();
    
    // Verify RICA approval
    await adminPage.reload();
    await expect(adminPage.locator('text=RICA Approved')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ RICA approved');
  });

  test('Step 11: Service is activated', async () => {
    // Wait for service activation
    await expect(adminPage.locator('text=Service Active')).toBeVisible({ timeout: 15000 });
    
    // Verify account number generated
    const accountElement = await adminPage.locator('[data-testid="account-number"]');
    const accountNumber = (await accountElement.textContent()) || '';
    
    expect(accountNumber).toMatch(/ACC-\d{4}-[A-Z0-9]{6}/);
    
    // Verify customer can see active service
    await customerPage.goto('/customer/dashboard');
    await expect(customerPage.locator('text=Service Active')).toBeVisible({ timeout: 10000 });
    await expect(customerPage.locator(`text=${accountNumber}`)).toBeVisible();
    
    console.log('✅ Service activated:', accountNumber);
  });

  test('Step 12: Verify complete audit trail', async () => {
    // Navigate to order details
    await adminPage.goto(`/admin/orders/${orderNumber}`);
    
    // Verify all workflow stages present
    const expectedStages = [
      'Quote Created',
      'Quote Approved',
      'KYC Completed',
      'Contract Generated',
      'Contract Signed',
      'Invoice Generated',
      'Payment Received',
      'Order Created',
      'RICA Submitted',
      'RICA Approved',
      'Service Activated',
    ];
    
    for (const stage of expectedStages) {
      await expect(adminPage.locator(`text=${stage}`)).toBeVisible();
    }
    
    console.log('✅ Complete audit trail verified');
  });

  test('Step 13: Verify customer notifications sent', async () => {
    // Check admin notification logs
    await adminPage.goto('/admin/notifications');
    
    // Filter by customer email
    await adminPage.fill('input[placeholder="Filter by email..."]', TEST_QUOTE.contact_email);
    
    // Verify 3 workflow emails sent
    const expectedEmails = [
      'KYC Verification Complete',
      'Contract Ready to Sign',
      'Service Activated',
    ];
    
    for (const emailSubject of expectedEmails) {
      await expect(adminPage.locator(`text=${emailSubject}`)).toBeVisible();
    }
    
    console.log('✅ All notification emails sent');
  });
});

/**
 * Test Summary:
 * 
 * Complete workflow validated in 13 steps:
 * 1. ✅ Admin creates quote
 * 2. ✅ Manager approves quote
 * 3. ✅ Customer completes KYC (mocked Didit)
 * 4. ✅ Contract auto-generated
 * 5. ✅ Customer signs contract (mocked Zoho Sign)
 * 6. ✅ Invoice generated
 * 7. ✅ Payment completed (mocked NetCash)
 * 8. ✅ Order auto-created
 * 9. ✅ RICA submitted
 * 10. ✅ RICA approved (mocked ICASA)
 * 11. ✅ Service activated
 * 12. ✅ Audit trail complete
 * 13. ✅ Notifications sent
 * 
 * External services mocked:
 * - Didit KYC (webhook)
 * - Zoho Sign (webhook)
 * - NetCash Pay Now (webhook)
 * - ICASA RICA (webhook)
 * 
 * Total test time: ~2-3 minutes
 * Coverage: End-to-end happy path
 */
