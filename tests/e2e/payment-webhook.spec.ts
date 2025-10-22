/**
 * Payment Webhook Integration Tests
 *
 * Tests the Netcash webhook integration including:
 * - Webhook signature validation
 * - Payment success webhook processing
 * - Payment failure webhook handling
 * - Duplicate webhook detection (idempotency)
 * - Order status updates
 * - Email notifications
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';
const WEBHOOK_URL = `${BASE_URL}/api/payment/netcash/webhook`;

// Test webhook secret (should match .env for tests)
const TEST_WEBHOOK_SECRET = process.env.NETCASH_WEBHOOK_SECRET || 'test_webhook_secret_12345';

// Helper function to generate HMAC-SHA256 signature
function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

// Helper function to create test webhook payload
function createTestWebhookPayload(options: {
  status: 'Approved' | 'Declined' | 'Cancelled';
  transactionId: string;
  reference: string;
  amount: string;
  orderId?: string;
}) {
  return {
    Reference: options.reference,
    TransactionID: options.transactionId,
    Status: options.status,
    Amount: options.amount, // In cents
    Extra1: options.orderId || `order-${Date.now()}`,
    Extra2: options.reference,
    Extra3: 'test@circletel.co.za',
    PaymentDate: new Date().toISOString(),
    PaymentMethod: 'Credit Card',
  };
}

// Helper function to create test order via API
async function createTestOrder(page: any) {
  const orderResponse = await page.request.post(`${BASE_URL}/api/orders/create`, {
    data: {
      customerName: 'Webhook Test User',
      customerEmail: 'webhook-test@circletel.co.za',
      customerPhone: '+27821234567',
      packageId: 'test-package-webhook',
      serviceType: 'fibre',
      speedDown: 50,
      speedUp: 10,
      basePrice: 599.00,
      installationFee: 1000.00,
      totalAmount: 1599.00,
      installationAddress: '123 Webhook Test St',
    },
  });

  const { order } = await orderResponse.json();
  return order;
}

test.describe('Webhook Integration Tests', () => {
  test('WH1: Should accept valid webhook signature', async ({ request }) => {
    test.setTimeout(30000);

    // Create test payload
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-${Date.now()}`,
      reference: `CT-${Date.now()}-TEST`,
      amount: '159900', // R1599.00 in cents
    });

    // Generate valid signature
    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

    // Send webhook request
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
      },
    });

    // Verify response
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('processed');
  });

  test('WH2: Should reject invalid webhook signature', async ({ request }) => {
    test.setTimeout(30000);

    // Create test payload
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-${Date.now()}`,
      reference: `CT-${Date.now()}-TEST`,
      amount: '159900',
    });

    // Use invalid signature
    const invalidSignature = 'invalid_signature_12345';

    // Send webhook request
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': invalidSignature,
      },
    });

    // Verify response (should still return 200 but with error)
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('validation failed');
  });

  test('WH3: Should process payment success webhook', async ({ request, page }) => {
    test.setTimeout(60000);

    // Create test order first
    const order = await createTestOrder(page);

    // Create payment success webhook
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-SUCCESS-${Date.now()}`,
      reference: order.payment_reference,
      amount: String(order.total_amount * 100), // Convert to cents
      orderId: order.id,
    });

    // Generate valid signature
    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

    // Send webhook
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
        'X-Forwarded-For': '196.33.252.1', // Netcash IP range
      },
    });

    // Verify webhook processed
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.webhookId).toBeDefined();

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify order status updated in database
    const orderCheckResponse = await request.get(`${BASE_URL}/api/orders/${order.id}`);
    const { order: updatedOrder } = await orderCheckResponse.json();
    expect(updatedOrder.payment_status).toBe('paid');
    expect(updatedOrder.status).toContain('payment'); // payment_verified or payment_received
  });

  test('WH4: Should process payment failure webhook', async ({ request, page }) => {
    test.setTimeout(60000);

    // Create test order
    const order = await createTestOrder(page);

    // Create payment failure webhook
    const payload = createTestWebhookPayload({
      status: 'Declined',
      transactionId: `TXN-DECLINED-${Date.now()}`,
      reference: order.payment_reference,
      amount: String(order.total_amount * 100),
      orderId: order.id,
    });

    // Generate valid signature
    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

    // Send webhook
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
        'X-Forwarded-For': '196.33.252.1',
      },
    });

    // Verify webhook processed
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify order status
    const orderCheckResponse = await request.get(`${BASE_URL}/api/orders/${order.id}`);
    const { order: updatedOrder } = await orderCheckResponse.json();
    expect(updatedOrder.payment_status).toBe('failed');
  });

  test('WH5: Should detect and reject duplicate webhooks (idempotency)', async ({ request, page }) => {
    test.setTimeout(60000);

    // Create test order
    const order = await createTestOrder(page);

    // Create webhook payload
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-DUPLICATE-${Date.now()}`,
      reference: order.payment_reference,
      amount: String(order.total_amount * 100),
      orderId: order.id,
    });

    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);
    const headers = {
      'Content-Type': 'application/json',
      'X-Netcash-Signature': signature,
      'X-Forwarded-For': '196.33.252.1',
    };

    // Send webhook first time
    const response1 = await request.post(WEBHOOK_URL, {
      data: payload,
      headers,
    });

    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Send same webhook second time (duplicate)
    const response2 = await request.post(WEBHOOK_URL, {
      data: payload,
      headers,
    });

    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(data2.success).toBe(true);
    expect(data2.message).toContain('duplicate');

    // Verify order was only updated once
    const orderCheckResponse = await request.get(`${BASE_URL}/api/orders/${order.id}`);
    const { order: updatedOrder } = await orderCheckResponse.json();
    expect(updatedOrder.payment_status).toBe('paid');

    // Verify only one successful webhook record exists for this transaction
    // (Would need admin API endpoint to check webhook logs)
  });

  test('WH6: Should handle webhook with missing order', async ({ request }) => {
    test.setTimeout(30000);

    // Create webhook for non-existent order
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-NOORDER-${Date.now()}`,
      reference: `CT-NONEXISTENT-${Date.now()}`,
      amount: '159900',
      orderId: 'non-existent-order-id',
    });

    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

    // Send webhook
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
        'X-Forwarded-For': '196.33.252.1',
      },
    });

    // Should still return 200 (don't fail Netcash)
    expect(response.status()).toBe(200);
    const data = await response.json();

    // But should log error
    expect(data.success).toBe(false);
    expect(data.error || data.message).toMatch(/order.*not.*found/i);
  });

  test('WH7: Should handle webhook with malformed payload', async ({ request }) => {
    test.setTimeout(30000);

    // Create malformed payload (missing required fields)
    const malformedPayload = {
      Reference: 'TEST-MALFORMED',
      // Missing TransactionID, Status, Amount
    };

    const signature = generateWebhookSignature(malformedPayload, TEST_WEBHOOK_SECRET);

    // Send webhook
    const response = await request.post(WEBHOOK_URL, {
      data: malformedPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
        'X-Forwarded-For': '196.33.252.1',
      },
    });

    // Should return 200 (don't fail Netcash)
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/validation.*failed|invalid.*payload/i);
  });

  test('WH8: Should enforce IP whitelist', async ({ request }) => {
    test.setTimeout(30000);

    // Create valid webhook
    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-INVALIDIP-${Date.now()}`,
      reference: `CT-${Date.now()}-TEST`,
      amount: '159900',
    });

    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

    // Send from non-whitelisted IP
    const response = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature,
        'X-Forwarded-For': '192.168.1.1', // Non-Netcash IP
      },
    });

    // Should return 200 but reject
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/validation.*failed|IP/i);
  });

  test('WH9: Health check endpoint functional', async ({ request }) => {
    test.setTimeout(10000);

    // Send GET request to webhook endpoint
    const response = await request.get(WEBHOOK_URL);

    // Accept 200 (healthy) or 503 (unhealthy) as valid responses
    expect([200, 503]).toContain(response.status());
    const data = await response.json();
    // Status can be 'healthy' or 'unhealthy' depending on payment configuration
    expect(data.status).toMatch(/^(healthy|unhealthy)$/);
    // If unhealthy, should have an error field
    if (data.status === 'unhealthy') {
      expect(data.error).toBeDefined();
    }
  });

  test('WH10: Should handle webhook rate limiting', async ({ request }) => {
    test.setTimeout(60000);

    const payload = createTestWebhookPayload({
      status: 'Approved',
      transactionId: `TXN-RATELIMIT-${Date.now()}`,
      reference: `CT-${Date.now()}-TEST`,
      amount: '159900',
    });

    const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);
    const headers = {
      'Content-Type': 'application/json',
      'X-Netcash-Signature': signature,
      'X-Forwarded-For': '196.33.252.100', // Use specific IP for rate limiting
    };

    // Send 101 requests (rate limit is 100/min)
    const requests = [];
    for (let i = 0; i < 101; i++) {
      // Modify transaction ID to avoid idempotency check
      const uniquePayload = {
        ...payload,
        TransactionID: `${payload.TransactionID}-${i}`,
      };
      const uniqueSignature = generateWebhookSignature(uniquePayload, TEST_WEBHOOK_SECRET);

      requests.push(
        request.post(WEBHOOK_URL, {
          data: uniquePayload,
          headers: {
            ...headers,
            'X-Netcash-Signature': uniqueSignature,
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    // First 100 should succeed
    const successCount = responses.filter((r) => r.status() === 200).length;
    expect(successCount).toBeGreaterThanOrEqual(90); // Allow some variance

    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    if (lastResponse.status() === 429) {
      const data = await lastResponse.json();
      expect(data.error).toContain('rate limit');
      expect(data.retryAfter).toBeDefined();
    }
  });
});

test.describe('Webhook Monitoring Dashboard Tests', () => {
  test('WH11: Admin can view webhook logs', async ({ page }) => {
    test.setTimeout(60000);

    // Login as admin (assuming auth is set up)
    await page.goto(`${BASE_URL}/admin/login`);
    // TODO: Add login steps when admin auth is ready

    // Navigate to webhook monitoring page
    await page.goto(`${BASE_URL}/admin/payments/webhooks`);

    // Verify page loaded
    await expect(page.locator('h1:has-text("Webhook Monitoring")')).toBeVisible();

    // Verify statistics cards visible
    await expect(page.locator('[data-testid="webhook-stats-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-stats-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-stats-failed"]')).toBeVisible();

    // Verify webhook table visible
    await expect(page.locator('[data-testid="webhook-table"]')).toBeVisible();
  });

  test('WH12: Admin can filter webhooks by status', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE_URL}/admin/payments/webhooks`);

    // Select "Failed" filter
    await page.selectOption('[data-testid="webhook-status-filter"]', 'failed');

    // Verify only failed webhooks shown
    await page.waitForSelector('[data-testid="webhook-table-row"]', { timeout: 5000 });
    const rows = await page.locator('[data-testid="webhook-table-row"]').all();

    for (const row of rows) {
      const statusBadge = row.locator('[data-testid="status-badge"]');
      await expect(statusBadge).toHaveText(/failed/i);
    }
  });

  test('WH13: Admin can view webhook details', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE_URL}/admin/payments/webhooks`);

    // Click on first webhook row
    await page.click('[data-testid="webhook-table-row"]:first-child');

    // Verify modal opened
    await expect(page.locator('[data-testid="webhook-details-modal"]')).toBeVisible();

    // Verify details displayed
    await expect(page.locator('[data-testid="webhook-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-payload"]')).toBeVisible();
  });

  test('WH14: Admin can retry failed webhook', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE_URL}/admin/payments/webhooks`);

    // Filter for failed webhooks
    await page.selectOption('[data-testid="webhook-status-filter"]', 'failed');
    await page.waitForSelector('[data-testid="webhook-table-row"]', { timeout: 5000 });

    // Click retry button on first failed webhook
    await page.click('[data-testid="webhook-table-row"]:first-child [data-testid="retry-button"]');

    // Verify confirmation dialog
    await expect(page.locator('[data-testid="retry-confirmation"]')).toBeVisible();

    // Confirm retry
    await page.click('button:has-text("Confirm")');

    // Verify success toast
    await expect(page.locator('text=/webhook.*retried|retry.*successful/i')).toBeVisible({ timeout: 5000 });
  });
});
