/**
 * Invoice Type Definitions
 *
 * Comprehensive type system for invoice operations across B2B and B2C flows.
 * Supports both CircleTel internal invoices and ZOHO Billing sync.
 *
 * @module lib/types/invoice.types
 */

// ============================================================================
// Invoice Status & Types
// ============================================================================

/**
 * Invoice status lifecycle
 */
export type InvoiceStatus =
  | 'draft'             // Invoice created but not sent
  | 'sent'              // Invoice sent to customer
  | 'unpaid'            // Invoice sent but payment not received
  | 'partial'           // Partial payment received
  | 'paid'              // Fully paid
  | 'overdue'           // Past due date
  | 'cancelled'         // Cancelled by admin
  | 'refunded';         // Payment refunded

/**
 * Invoice types for different business scenarios
 */
export type InvoiceType =
  | 'recurring'         // Monthly recurring service charge
  | 'installation'      // One-time installation fee
  | 'pro_rata'          // Pro-rated charge for partial month
  | 'equipment'         // Router/equipment purchase
  | 'adjustment'        // Manual adjustment (credit/debit)
  | 'b2b_contract';     // B2B contract-based invoice

/**
 * Line item types
 */
export type LineItemType =
  | 'service'           // Recurring service
  | 'equipment'         // Hardware/equipment
  | 'installation'      // Installation fee
  | 'activation'        // Activation fee
  | 'adjustment'        // Manual adjustment
  | 'other';            // Other charges

// ============================================================================
// Invoice Line Items
// ============================================================================

/**
 * Individual line item on an invoice
 */
export interface InvoiceLineItem {
  /** Line item description */
  description: string;

  /** Quantity */
  quantity: number;

  /** Unit price (excluding VAT) */
  unit_price: number;

  /** Total amount for this line (quantity * unit_price) */
  amount: number;

  /** Line item type */
  type?: LineItemType;

  /** Tax rate (0.15 for SA VAT) */
  tax_rate?: number;

  /** Tax amount */
  tax_amount?: number;

  /** Product/service code */
  product_code?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Invoice Creation
// ============================================================================

/**
 * Parameters for creating an invoice
 */
export interface CreateInvoiceParams {
  /** Customer ID */
  customer_id: string;

  /** Invoice type */
  invoice_type: InvoiceType;

  /** Line items */
  line_items: InvoiceLineItem[];

  /** Invoice date (defaults to today) */
  invoice_date?: Date;

  /** Payment due date (defaults to invoice_date + payment_terms_days) */
  due_date?: Date;

  /** Internal notes (not shown to customer) */
  notes?: string;

  /** Customer-facing notes */
  customer_notes?: string;

  /** Contract ID (for B2B invoices) */
  contract_id?: string;

  /** Service ID (for recurring invoices) */
  service_id?: string;

  /** Billing cycle ID */
  billing_cycle_id?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for updating an invoice
 */
export interface UpdateInvoiceParams {
  /** Invoice ID */
  id: string;

  /** New status */
  status?: InvoiceStatus;

  /** Updated line items */
  line_items?: InvoiceLineItem[];

  /** Updated due date */
  due_date?: Date;

  /** Updated notes */
  notes?: string;

  /** Updated customer notes */
  customer_notes?: string;
}

// ============================================================================
// Invoice Models
// ============================================================================

/**
 * B2B Invoice (contract-based)
 * Maps to invoices table
 */
export interface B2BInvoice {
  id: string;
  invoice_number: string;           // CT-YYYY-NNN
  customer_id: string;
  contract_id?: string;
  subtotal: number;
  vat_rate: number;                 // 0.15 for SA
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  payment_method?: string;
  payment_reference?: string;
  items: InvoiceLineItem[];         // JSONB
  invoice_date: Date;
  due_date: Date;
  paid_date?: Date;
  sent_date?: Date;
  notes?: string;
  customer_notes?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * B2C Invoice (customer-based)
 * Maps to customer_invoices table
 */
export interface CustomerInvoice {
  id: string;
  invoice_number: string;           // INV-YYYY-NNNNN
  customer_id: string;
  service_id?: string;
  billing_cycle_id?: string;
  invoice_type: InvoiceType;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;               // Computed: total_amount - amount_paid
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];    // JSONB
  invoice_date: Date;
  due_date: Date;
  paid_date?: Date;
  sent_date?: Date;
  overdue_since?: Date;
  notes?: string;
  customer_notes?: string;
  pdf_url?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generic invoice type (union of B2B and B2C)
 */
export type Invoice = B2BInvoice | CustomerInvoice;

// ============================================================================
// Invoice Payment Records
// ============================================================================

/**
 * Payment record for an invoice
 */
export interface InvoicePaymentRecord {
  /** Payment amount */
  amount: number;

  /** Payment date */
  payment_date: Date;

  /** Payment method used */
  payment_method: string;

  /** Payment reference/transaction ID */
  payment_reference: string;

  /** Notes */
  notes?: string;
}

/**
 * Parameters for recording a payment on an invoice
 */
export interface RecordInvoicePaymentParams {
  /** Invoice ID */
  invoice_id: string;

  /** Payment amount */
  amount: number;

  /** Payment date */
  payment_date: Date;

  /** Payment method */
  payment_method: string;

  /** Payment transaction ID */
  payment_reference: string;

  /** Notes */
  notes?: string;
}

// ============================================================================
// Invoice Operations
// ============================================================================

/**
 * Invoice summary for lists/dashboards
 */
export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  invoice_date: Date;
  due_date: Date;
  is_overdue: boolean;
  days_overdue?: number;
}

/**
 * Invoice statistics
 */
export interface InvoiceStatistics {
  total_count: number;
  total_amount: number;
  paid_count: number;
  paid_amount: number;
  unpaid_count: number;
  unpaid_amount: number;
  overdue_count: number;
  overdue_amount: number;
  by_status: Record<InvoiceStatus, number>;
  by_type: Record<InvoiceType, number>;
}

/**
 * Parameters for querying invoices
 */
export interface InvoiceQueryParams {
  /** Customer ID filter */
  customer_id?: string;

  /** Status filter */
  status?: InvoiceStatus | InvoiceStatus[];

  /** Invoice type filter */
  invoice_type?: InvoiceType | InvoiceType[];

  /** Date range (invoice_date) */
  date_from?: Date;
  date_to?: Date;

  /** Due date range */
  due_date_from?: Date;
  due_date_to?: Date;

  /** Only overdue invoices */
  overdue_only?: boolean;

  /** Search term (invoice number, customer name) */
  search?: string;

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Sorting */
  sort_by?: 'invoice_date' | 'due_date' | 'total_amount' | 'status';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Invoice Reminders
// ============================================================================

/**
 * Invoice reminder configuration
 */
export interface InvoiceReminderConfig {
  /** Days before due date to send reminder */
  days_before_due: number[];

  /** Days after due date to send reminder */
  days_after_due: number[];

  /** Email template to use */
  email_template: string;

  /** SMS template to use */
  sms_template?: string;
}

/**
 * Invoice reminder record
 */
export interface InvoiceReminder {
  id: string;
  invoice_id: string;
  reminder_type: 'pre_due' | 'overdue';
  days_offset: number;
  sent_date: Date;
  delivery_method: 'email' | 'sms' | 'both';
  status: 'sent' | 'failed';
  error_message?: string;
  created_at: Date;
}

// ============================================================================
// ZOHO Integration
// ============================================================================

/**
 * ZOHO invoice mapping
 */
export interface ZOHOInvoiceMapping {
  id: string;
  circletel_invoice_id: string;
  zoho_invoice_id: string;
  zoho_invoice_number: string;
  sync_status: 'pending' | 'synced' | 'failed' | 'conflict';
  last_synced_at?: Date;
  sync_error?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * ZOHO invoice format (for API calls)
 */
export interface ZOHOInvoiceData {
  customer_id: string;
  invoice_number: string;
  date: string;                     // YYYY-MM-DD
  due_date: string;                 // YYYY-MM-DD
  line_items: Array<{
    item_id?: string;
    name: string;
    description?: string;
    rate: number;
    quantity: number;
    tax_id?: string;
  }>;
  notes?: string;
  terms?: string;
  custom_fields?: Array<{
    label: string;
    value: string;
  }>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for InvoiceStatus
 */
export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && [
    'draft', 'sent', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'
  ].includes(value);
}

/**
 * Type guard for InvoiceType
 */
export function isInvoiceType(value: unknown): value is InvoiceType {
  return typeof value === 'string' && [
    'recurring', 'installation', 'pro_rata', 'equipment', 'adjustment', 'b2b_contract'
  ].includes(value);
}

/**
 * Type guard for B2BInvoice
 */
export function isB2BInvoice(invoice: Invoice): invoice is B2BInvoice {
  return 'contract_id' in invoice;
}

/**
 * Type guard for CustomerInvoice
 */
export function isCustomerInvoice(invoice: Invoice): invoice is CustomerInvoice {
  return 'service_id' in invoice;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  vatRate: number = 0.15
): {
  subtotal: number;
  vat_amount: number;
  total_amount: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const vat_amount = subtotal * vatRate;
  const total_amount = subtotal + vat_amount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    vat_amount: Number(vat_amount.toFixed(2)),
    total_amount: Number(total_amount.toFixed(2))
  };
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: Invoice | InvoiceSummary): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(invoice.due_date);
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(invoice: Invoice | InvoiceSummary): number {
  if (!isInvoiceOverdue(invoice)) {
    return 0;
  }
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
