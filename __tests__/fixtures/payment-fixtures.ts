/**
 * Payment Test Fixtures
 *
 * Realistic test data for payment flow tests
 */

// ============================================================================
// CUSTOMER FIXTURES
// ============================================================================

export const mockCustomer = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'john.doe@example.com',
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+27821234567',
  id_number: '9001015009087',
  account_number: 'CT-2025-00001',
  created_at: '2025-01-15T10:00:00.000Z',
};

export const mockCustomerBilling = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  customer_id: mockCustomer.id,
  account_number: 'CT-2025-00001',
  billing_day: 1,
  payment_method_type: 'debit_order',
  primary_payment_method_id: null,
  account_balance: 0,
  created_at: '2025-01-15T10:00:00.000Z',
};

// ============================================================================
// ORDER FIXTURES
// ============================================================================

export const mockConsumerOrder = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  order_number: 'ORD-2025-0001',
  customer_id: mockCustomer.id,
  email: mockCustomer.email,
  first_name: mockCustomer.first_name,
  last_name: mockCustomer.last_name,
  phone: mockCustomer.phone,
  package_id: '550e8400-e29b-41d4-a716-446655440020',
  package_name: 'SkyFibre 100Mbps',
  package_speed: '100/50 Mbps',
  package_price: 799,
  installation_fee: 1500,
  total_paid: 0,
  status: 'pending',
  payment_status: 'unpaid',
  installation_address: '123 Main Street, Sandton, Johannesburg, 2196',
  created_at: '2025-01-20T14:30:00.000Z',
};

export const orderStatuses = [
  'pending',
  'payment_method_registered',
  'payment_received',
  'kyc_pending',
  'kyc_approved',
  'scheduled',
  'in_progress',
  'completed',
  'active',
  'cancelled',
] as const;

// ============================================================================
// INVOICE FIXTURES
// ============================================================================

export const mockInvoice = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  invoice_number: 'INV-2025-0001',
  customer_id: mockCustomer.id,
  order_id: mockConsumerOrder.id,
  type: 'initial',
  amount: 2299, // R799 monthly + R1500 installation
  vat_amount: 344.85, // 15% VAT
  total_amount: 2643.85,
  status: 'unpaid',
  due_date: '2025-02-05',
  billing_period_start: '2025-01-20',
  billing_period_end: '2025-02-19',
  line_items: [
    { description: 'SkyFibre 100Mbps - Monthly', amount: 799 },
    { description: 'Installation Fee', amount: 1500 },
  ],
  created_at: '2025-01-20T14:35:00.000Z',
};

// ============================================================================
// PAYMENT METHOD FIXTURES
// ============================================================================

export const mockBankAccount = {
  bank_name: 'First National Bank',
  bank_code: '250655',
  branch_code: '250655',
  account_number: '62123456789',
  account_type: 'cheque',
  account_holder: 'John Doe',
};

export const mockPaymentMethod = {
  id: '550e8400-e29b-41d4-a716-446655440040',
  customer_id: mockCustomer.id,
  method_type: 'debit_order',
  display_name: 'Debit Order - FNB ***6789',
  last_four: '6789',
  is_primary: true,
  is_active: true,
  mandate_id: 'MANDATE-2025-0001',
  mandate_status: 'active',
  created_at: '2025-01-20T14:40:00.000Z',
};

// ============================================================================
// NETCASH WEBHOOK FIXTURES
// ============================================================================

export const mockNetcashSuccessPayload = {
  TransactionAccepted: 'true',
  Amount: '264385', // R2643.85 in cents
  Reference: 'INV-2025-0001',
  Extra1: mockInvoice.id,
  Extra2: mockConsumerOrder.id,
  Extra3: mockCustomer.id,
  RequestTrace: 'TRACE-2025-0001-ABC123',
  ResponseCode: '0',
  ResponseDescription: 'Transaction approved',
  AuthCode: 'AUTH123456',
  TransactionId: 'TXN-2025-0001',
};

export const mockNetcashFailedPayload = {
  TransactionAccepted: 'false',
  Amount: '264385',
  Reference: 'INV-2025-0001',
  Extra1: mockInvoice.id,
  Extra2: mockConsumerOrder.id,
  Extra3: mockCustomer.id,
  RequestTrace: 'TRACE-2025-0002-DEF456',
  ResponseCode: '101',
  ResponseDescription: 'Insufficient funds',
};

export const mockNetcashDeclinedPayload = {
  TransactionAccepted: 'false',
  Amount: '264385',
  Reference: 'INV-2025-0001',
  Extra1: mockInvoice.id,
  Extra2: mockConsumerOrder.id,
  Extra3: mockCustomer.id,
  RequestTrace: 'TRACE-2025-0003-GHI789',
  ResponseCode: '103',
  ResponseDescription: 'Card declined',
};

// ============================================================================
// EMANDATE FIXTURES
// ============================================================================

export const mockEmandateRequest = {
  customer_id: mockCustomer.id,
  order_id: mockConsumerOrder.id,
  bank_details: mockBankAccount,
  debit_day: 1,
  debit_amount: 799,
  start_date: '2025-02-01',
  account_reference: mockCustomer.account_number,
};

export const mockEmandateResponse = {
  success: true,
  mandate_id: 'MANDATE-2025-0001',
  status: 'pending_signature',
  signature_url: 'https://netcash.co.za/emandate/sign/abc123',
  expires_at: '2025-01-21T14:40:00.000Z',
};

export const mockEmandateSignedWebhook = {
  MandateID: 'MANDATE-2025-0001',
  Status: 'ACTIVE',
  CustomerReference: mockCustomer.account_number,
  BankName: 'First National Bank',
  AccountNumber: '***6789',
  DebitDay: 1,
  Amount: '79900', // R799 in cents
  SignedAt: '2025-01-20T15:00:00.000Z',
};

// ============================================================================
// SERVICE PACKAGE FIXTURES
// ============================================================================

export const mockServicePackage = {
  id: '550e8400-e29b-41d4-a716-446655440020',
  name: 'SkyFibre 100Mbps',
  service_type: 'fibre_consumer',
  product_category: 'fibre',
  speed_down: 100,
  speed_up: 50,
  price: 799,
  installation_fee: 1500,
  description: 'High-speed fibre for homes',
  features: ['Unlimited data', '99.9% uptime SLA', 'Free router'],
  customer_type: 'consumer',
  active: true,
};

// ============================================================================
// TRANSACTION FIXTURES
// ============================================================================

export const mockPaymentTransaction = {
  id: '550e8400-e29b-41d4-a716-446655440050',
  invoice_id: mockInvoice.id,
  customer_id: mockCustomer.id,
  order_id: mockConsumerOrder.id,
  amount: 2643.85,
  currency: 'ZAR',
  status: 'completed',
  provider: 'netcash',
  provider_transaction_id: 'TXN-2025-0001',
  reference: 'INV-2025-0001',
  request_trace: 'TRACE-2025-0001-ABC123',
  payment_method: 'card',
  created_at: '2025-01-20T15:30:00.000Z',
  completed_at: '2025-01-20T15:30:05.000Z',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a customer with overrides
 */
export function createMockCustomer(overrides: Partial<typeof mockCustomer> = {}) {
  return { ...mockCustomer, ...overrides };
}

/**
 * Create an order with overrides
 */
export function createMockOrder(overrides: Partial<typeof mockConsumerOrder> = {}) {
  return { ...mockConsumerOrder, ...overrides };
}

/**
 * Create an invoice with overrides
 */
export function createMockInvoice(overrides: Partial<typeof mockInvoice> = {}) {
  return { ...mockInvoice, ...overrides };
}

/**
 * Create a NetCash success payload with overrides
 */
export function createNetcashPayload(
  overrides: Partial<typeof mockNetcashSuccessPayload> = {}
) {
  return { ...mockNetcashSuccessPayload, ...overrides };
}

/**
 * Generate a valid HMAC signature for test payloads
 */
export function generateWebhookSignature(
  payload: string,
  secret: string = 'test-webhook-secret'
): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Create a complete test scenario with related entities
 */
export function createPaymentScenario() {
  const customer = createMockCustomer();
  const order = createMockOrder({ customer_id: customer.id });
  const invoice = createMockInvoice({
    customer_id: customer.id,
    order_id: order.id,
  });
  const paymentMethod = { ...mockPaymentMethod, customer_id: customer.id };

  return {
    customer,
    order,
    invoice,
    paymentMethod,
    webhookPayload: createNetcashPayload({
      Extra1: invoice.id,
      Extra2: order.id,
      Extra3: customer.id,
    }),
  };
}
