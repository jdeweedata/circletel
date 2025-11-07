/**
 * Test Utilities for Payment Management System
 *
 * @group payment-management
 * @group test-utils
 */

import type { PaymentTransaction, WebhookLog, PaymentProviderSettings } from '@/lib/types/payment.types';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock payment transaction
 */
export function createMockTransaction(overrides?: Partial<PaymentTransaction>): PaymentTransaction {
  const baseTransaction: PaymentTransaction = {
    id: crypto.randomUUID(),
    transaction_id: `CT-TEST-${Date.now()}`,
    reference: 'ORDER-001',
    provider: 'netcash',
    amount: 799.0,
    currency: 'ZAR',
    status: 'completed',
    payment_method: 'card',
    payment_method_details: { last4: '4242', brand: 'visa' },
    customer_email: 'customer@example.com',
    customer_name: 'John Doe',
    customer_id: crypto.randomUUID(),
    invoice_id: null,
    order_id: null,
    provider_reference: 'NC-REF-123',
    provider_response: {
      status: 'success',
      message: 'Payment completed'
    },
    metadata: {},
    error_code: null,
    error_message: null,
    failure_reason: null,
    initiated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  };

  return { ...baseTransaction, ...overrides };
}

/**
 * Generate mock webhook log
 */
export function createMockWebhook(overrides?: Partial<WebhookLog>): WebhookLog {
  const baseWebhook: WebhookLog = {
    id: crypto.randomUUID(),
    webhook_id: crypto.randomUUID(),
    provider: 'netcash',
    event_type: 'payment.completed',
    http_method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature': 'abc123'
    },
    query_params: null,
    body: JSON.stringify({ status: 'completed' }),
    body_parsed: { status: 'completed' },
    signature: 'abc123',
    signature_verified: true,
    signature_algorithm: 'hmac-sha256',
    status: 'processed',
    processing_started_at: new Date().toISOString(),
    processing_completed_at: new Date().toISOString(),
    processing_duration_ms: 150,
    transaction_id: 'CT-TEST-123',
    reference: 'ORDER-001',
    success: true,
    error_message: null,
    error_stack: null,
    actions_taken: ['update_transaction', 'send_email'],
    response_status_code: 200,
    response_body: { success: true },
    retry_count: 0,
    max_retries: 3,
    last_retry_at: null,
    next_retry_at: null,
    source_ip: '192.168.1.1',
    user_agent: 'NetCash-Webhook/1.0',
    metadata: {},
    received_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return { ...baseWebhook, ...overrides };
}

/**
 * Generate mock provider settings
 */
export function createMockProviderSettings(overrides?: Partial<PaymentProviderSettings>): PaymentProviderSettings {
  const baseSettings: PaymentProviderSettings = {
    id: crypto.randomUUID(),
    provider: 'netcash',
    enabled: true,
    priority: 1,
    credentials: {
      service_key: 'encrypted_key',
      merchant_id: 'encrypted_id'
    },
    settings: {
      timeout: 30000,
      retry_attempts: 3
    },
    capabilities_override: null,
    min_amount: 1.0,
    max_amount: null,
    daily_limit: null,
    test_mode: false,
    test_credentials: null,
    webhook_url: 'https://api.circletel.co.za/webhooks/netcash',
    webhook_secret: 'encrypted_secret',
    webhook_events: ['payment.completed', 'payment.failed'],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null
  };

  return { ...baseSettings, ...overrides };
}

/**
 * Generate multiple mock transactions
 */
export function createMockTransactions(count: number, overrides?: Partial<PaymentTransaction>[]): PaymentTransaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction(overrides?.[i] || {})
  );
}

/**
 * Generate multiple mock webhooks
 */
export function createMockWebhooks(count: number, overrides?: Partial<WebhookLog>[]): WebhookLog[] {
  return Array.from({ length: count }, (_, i) =>
    createMockWebhook(overrides?.[i] || {})
  );
}

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

/**
 * Create mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockData: any[] = [];
  const mockError: any = null;

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve({ data: mockData, error: mockError }))
  };

  const mockClient = {
    from: jest.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  };

  return {
    client: mockClient,
    query: mockQuery,
    setMockData: (data: any[]) => {
      mockData.length = 0;
      mockData.push(...data);
    },
    setMockError: (error: any) => {
      Object.assign(mockError, error);
    }
  };
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate user typing in search input
 */
export function simulateSearch(searchTerm: string, onChange: (value: string) => void): void {
  onChange(searchTerm);
}

/**
 * Simulate filter selection
 */
export function simulateFilterChange(filterValue: string, onChange: (value: string) => void): void {
  onChange(filterValue);
}

/**
 * Generate CSV content for testing
 */
export function generateMockCSV(transactions: PaymentTransaction[]): string {
  const headers = [
    'Transaction ID',
    'Reference',
    'Provider',
    'Amount',
    'Currency',
    'Status',
    'Payment Method',
    'Customer Email',
    'Customer Name',
    'Initiated At',
    'Completed At'
  ];

  const rows = transactions.map(t => [
    t.transaction_id,
    t.reference,
    t.provider,
    t.amount,
    t.currency,
    t.status,
    t.payment_method || '',
    t.customer_email || '',
    t.customer_name || '',
    new Date(t.initiated_at).toLocaleString(),
    t.completed_at ? new Date(t.completed_at).toLocaleString() : ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert transaction has required fields
 */
export function assertValidTransaction(transaction: any): void {
  expect(transaction).toHaveProperty('id');
  expect(transaction).toHaveProperty('transaction_id');
  expect(transaction).toHaveProperty('reference');
  expect(transaction).toHaveProperty('provider');
  expect(transaction).toHaveProperty('amount');
  expect(transaction).toHaveProperty('currency');
  expect(transaction).toHaveProperty('status');
  expect(transaction).toHaveProperty('created_at');
}

/**
 * Assert webhook has required fields
 */
export function assertValidWebhook(webhook: any): void {
  expect(webhook).toHaveProperty('id');
  expect(webhook).toHaveProperty('webhook_id');
  expect(webhook).toHaveProperty('provider');
  expect(webhook).toHaveProperty('event_type');
  expect(webhook).toHaveProperty('status');
  expect(webhook).toHaveProperty('signature_verified');
  expect(webhook).toHaveProperty('received_at');
}

/**
 * Assert transaction stats are calculated correctly
 */
export function assertTransactionStats(
  stats: any,
  transactions: PaymentTransaction[]
): void {
  expect(stats.total_count).toBe(transactions.length);
  expect(stats.completed_count).toBe(
    transactions.filter(t => t.status === 'completed').length
  );
  expect(stats.failed_count).toBe(
    transactions.filter(t => t.status === 'failed').length
  );
  expect(stats.pending_count).toBe(
    transactions.filter(t => t.status === 'pending' || t.status === 'processing').length
  );
}

/**
 * Assert webhook stats are calculated correctly
 */
export function assertWebhookStats(
  stats: any,
  webhooks: WebhookLog[]
): void {
  expect(stats.total_count).toBe(webhooks.length);
  expect(stats.processed_count).toBe(
    webhooks.filter(w => w.status === 'processed').length
  );
  expect(stats.failed_count).toBe(
    webhooks.filter(w => w.status === 'failed').length
  );
  expect(stats.signature_verified_count).toBe(
    webhooks.filter(w => w.signature_verified).length
  );
}

// ============================================================================
// MOCK ENVIRONMENT SETUP
// ============================================================================

/**
 * Setup mock environment variables
 */
export function setupMockEnv(): () => void {
  const originalEnv = { ...process.env };

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

  // Cleanup function
  return () => {
    process.env = originalEnv;
  };
}

/**
 * Setup DOM for testing (browser APIs)
 */
export function setupMockDOM(): () => void {
  // Mock URL.createObjectURL
  const originalCreateObjectURL = global.URL.createObjectURL;
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

  // Mock URL.revokeObjectURL
  const originalRevokeObjectURL = global.URL.revokeObjectURL;
  global.URL.revokeObjectURL = jest.fn();

  // Mock document.createElement
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = jest.fn((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName === 'a') {
      element.click = jest.fn();
    }
    return element;
  }) as any;

  // Cleanup function
  return () => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  createMockTransaction,
  createMockWebhook,
  createMockProviderSettings,
  createMockTransactions,
  createMockWebhooks,
  createMockSupabaseClient,
  waitForAsync,
  simulateSearch,
  simulateFilterChange,
  generateMockCSV,
  assertValidTransaction,
  assertValidWebhook,
  assertTransactionStats,
  assertWebhookStats,
  setupMockEnv,
  setupMockDOM
};
