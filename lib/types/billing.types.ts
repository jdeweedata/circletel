/**
 * Billing Type Definitions
 *
 * Type system for automated billing, recurring charges, and billing cycles.
 * Supports customer dashboard production-ready billing automation.
 *
 * @module lib/types/billing.types
 */

// ============================================================================
// Billing Cycles
// ============================================================================

/**
 * Supported billing cycle days (user-selectable)
 */
export type BillingCycleDay = 1 | 5 | 25 | 30;

/**
 * Billing frequency
 */
export type BillingFrequency =
  | 'monthly'           // Standard monthly billing
  | 'quarterly'         // Every 3 months
  | 'annually'          // Once per year
  | 'one_time';         // Single charge only

/**
 * Billing cycle status
 */
export type BillingCycleStatus =
  | 'active'            // Actively generating invoices
  | 'suspended'         // Temporarily suspended
  | 'cancelled'         // Permanently cancelled
  | 'pending';          // Awaiting activation

/**
 * Billing cycle configuration
 * Maps to billing_cycles table
 */
export interface BillingCycle {
  id: string;
  customer_id: string;
  service_id?: string;
  billing_day: BillingCycleDay;
  frequency: BillingFrequency;
  next_billing_date: Date;
  last_billed_date?: Date;
  last_invoice_id?: string;
  amount: number;                   // Recurring amount
  is_active: boolean;
  status: BillingCycleStatus;
  start_date: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parameters for creating a billing cycle
 */
export interface CreateBillingCycleParams {
  customer_id: string;
  service_id?: string;
  billing_day: BillingCycleDay;
  frequency?: BillingFrequency;
  amount: number;
  start_date?: Date;
}

/**
 * Parameters for updating a billing cycle
 */
export interface UpdateBillingCycleParams {
  id: string;
  billing_day?: BillingCycleDay;
  amount?: number;
  status?: BillingCycleStatus;
  next_billing_date?: Date;
}

// ============================================================================
// Recurring Billing
// ============================================================================

/**
 * Recurring billing item
 */
export interface RecurringBillingItem {
  id: string;
  customer_id: string;
  service_id?: string;
  billing_cycle_id: string;
  description: string;
  amount: number;
  quantity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parameters for creating recurring billing
 */
export interface CreateRecurringBillingParams {
  customer_id: string;
  service_id: string;
  billing_day: BillingCycleDay;
  amount: number;
  description: string;
  start_date: Date;
  frequency?: BillingFrequency;
}

// ============================================================================
// Pro-Rata Calculations
// ============================================================================

/**
 * Pro-rata calculation method
 */
export type ProRataMethod =
  | 'daily'             // Calculate based on days in month
  | 'fixed_30'          // Fixed 30-day month
  | 'fixed_365';        // Fixed 365-day year

/**
 * Pro-rata calculation parameters
 */
export interface ProRataParams {
  /** Full monthly amount */
  monthly_amount: number;

  /** Service start date */
  start_date: Date;

  /** Billing cycle end date (usually end of month) */
  end_date: Date;

  /** Calculation method */
  method?: ProRataMethod;
}

/**
 * Pro-rata calculation result
 */
export interface ProRataResult {
  /** Pro-rated amount */
  amount: number;

  /** Number of days */
  days: number;

  /** Total days in period */
  total_days: number;

  /** Daily rate */
  daily_rate: number;

  /** Calculation breakdown */
  breakdown: string;
}

// ============================================================================
// Billing Automation
// ============================================================================

/**
 * Billing job types
 */
export type BillingJobType =
  | 'generate_recurring'        // Generate recurring invoices
  | 'send_reminders'            // Send payment reminders
  | 'mark_overdue'              // Mark invoices as overdue
  | 'process_debit_orders'      // Process debit order payments
  | 'sync_to_zoho';             // Sync to ZOHO Billing

/**
 * Billing job status
 */
export type BillingJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Billing automation job log
 * Maps to billing_automation_logs table
 */
export interface BillingAutomationLog {
  id: string;
  job_name: string;
  job_type: BillingJobType;
  execution_date: Date;
  status: BillingJobStatus;
  invoices_generated?: number;
  invoices_failed?: number;
  execution_duration_ms?: number;
  error_log?: Record<string, unknown>;
  created_at: Date;
}

/**
 * Parameters for scheduling a billing job
 */
export interface ScheduleBillingJobParams {
  job_type: BillingJobType;
  execution_date: Date;
  parameters?: Record<string, unknown>;
}

// ============================================================================
// Payment Methods & Debit Orders
// ============================================================================

/**
 * Debit order status
 */
export type DebitOrderStatus =
  | 'pending'           // Awaiting bank authorization
  | 'authorized'        // Bank authorization received
  | 'active'            // Active and processing
  | 'suspended'         // Temporarily suspended
  | 'cancelled'         // Permanently cancelled
  | 'failed';           // Authorization failed

/**
 * Debit order mandate
 * Maps to customer_payment_methods table (method_type = 'debit_order')
 */
export interface DebitOrderMandate {
  id: string;
  customer_id: string;
  mandate_id: string;               // NetCash eMandate ID
  mandate_status: DebitOrderStatus;
  account_holder_name: string;
  bank_name: string;
  account_number_last_four: string;
  max_debit_amount: number;
  debit_day: BillingCycleDay;
  start_date: Date;
  end_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parameters for setting up a debit order
 */
export interface SetupDebitOrderParams {
  customer_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  branch_code: string;
  account_type: 'cheque' | 'savings' | 'transmission';
  max_debit_amount: number;
  debit_day: BillingCycleDay;
  authorization_date: Date;
}

// ============================================================================
// Billing Configuration
// ============================================================================

/**
 * System-wide billing configuration
 */
export interface BillingConfiguration {
  /** VAT rate (0.15 for South Africa) */
  vat_rate: number;

  /** Default payment terms in days */
  payment_terms_days: number;

  /** Days before due date to send first reminder */
  reminder_days_before: number[];

  /** Days after due date to send overdue reminders */
  reminder_days_after: number[];

  /** Grace period before marking as overdue (days) */
  overdue_grace_period: number;

  /** Late payment fee percentage */
  late_payment_fee_rate?: number;

  /** Late payment fee fixed amount */
  late_payment_fee_fixed?: number;

  /** Invoice advance days (generate invoice X days before due) */
  invoice_advance_days: number;

  /** Auto-suspend service after X days overdue */
  auto_suspend_days?: number;

  /** Enable automated billing */
  automated_billing_enabled: boolean;

  /** Enable email notifications */
  email_notifications_enabled: boolean;

  /** Enable SMS notifications */
  sms_notifications_enabled: boolean;
}

/**
 * Default billing configuration for CircleTel
 */
export const DEFAULT_BILLING_CONFIG: BillingConfiguration = {
  vat_rate: 0.15,                           // 15% SA VAT
  payment_terms_days: 7,                    // 7 days payment terms
  reminder_days_before: [7, 3, 1],          // Remind 7, 3, 1 days before due
  reminder_days_after: [1, 3, 7, 14],       // Remind 1, 3, 7, 14 days after due
  overdue_grace_period: 0,                  // No grace period
  late_payment_fee_rate: 0.02,              // 2% late fee
  invoice_advance_days: 7,                  // Generate invoice 7 days early
  automated_billing_enabled: true,
  email_notifications_enabled: true,
  sms_notifications_enabled: true
};

// ============================================================================
// Billing Reports
// ============================================================================

/**
 * Billing period summary
 */
export interface BillingPeriodSummary {
  period_start: Date;
  period_end: Date;
  total_invoices: number;
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  collection_rate: number;              // Percentage
  average_invoice_value: number;
  by_status: Record<string, number>;
}

/**
 * Customer billing summary
 */
export interface CustomerBillingSummary {
  customer_id: string;
  customer_name: string;
  total_invoices: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  oldest_unpaid_invoice_date?: Date;
  days_outstanding?: number;
  payment_history: Array<{
    date: Date;
    amount: number;
    invoice_number: string;
  }>;
}

/**
 * Parameters for generating billing reports
 */
export interface BillingReportParams {
  report_type: 'period_summary' | 'customer_summary' | 'aging_report' | 'revenue_forecast';
  date_from: Date;
  date_to: Date;
  customer_ids?: string[];
  include_details?: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for BillingCycleDay
 */
export function isBillingCycleDay(value: unknown): value is BillingCycleDay {
  return typeof value === 'number' && [1, 5, 25, 30].includes(value);
}

/**
 * Type guard for BillingFrequency
 */
export function isBillingFrequency(value: unknown): value is BillingFrequency {
  return typeof value === 'string' && [
    'monthly', 'quarterly', 'annually', 'one_time'
  ].includes(value);
}

/**
 * Type guard for BillingJobType
 */
export function isBillingJobType(value: unknown): value is BillingJobType {
  return typeof value === 'string' && [
    'generate_recurring', 'send_reminders', 'mark_overdue',
    'process_debit_orders', 'sync_to_zoho'
  ].includes(value);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate next billing date based on billing day and frequency
 */
export function calculateNextBillingDate(
  billingDay: BillingCycleDay,
  frequency: BillingFrequency,
  fromDate: Date = new Date()
): Date {
  const nextDate = new Date(fromDate);

  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'one_time':
      return nextDate; // No next billing date
  }

  // Set to billing day
  nextDate.setDate(billingDay);

  // Handle edge case: if billing day is 30 and month has < 30 days
  if (billingDay === 30) {
    const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    if (lastDayOfMonth < 30) {
      nextDate.setDate(lastDayOfMonth);
    }
  }

  return nextDate;
}

/**
 * Calculate pro-rata amount
 */
export function calculateProRata(params: ProRataParams): ProRataResult {
  const { monthly_amount, start_date, end_date, method = 'daily' } = params;

  const startTime = new Date(start_date).getTime();
  const endTime = new Date(end_date).getTime();
  const days = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;

  let total_days: number;
  switch (method) {
    case 'fixed_30':
      total_days = 30;
      break;
    case 'fixed_365':
      total_days = 365;
      break;
    case 'daily':
    default:
      // Days in the month
      const year = start_date.getFullYear();
      const month = start_date.getMonth();
      total_days = new Date(year, month + 1, 0).getDate();
      break;
  }

  const daily_rate = monthly_amount / total_days;
  const amount = daily_rate * days;

  return {
    amount: Number(amount.toFixed(2)),
    days,
    total_days,
    daily_rate: Number(daily_rate.toFixed(2)),
    breakdown: `${days} days / ${total_days} days × R${monthly_amount.toFixed(2)} = R${amount.toFixed(2)}`
  };
}

/**
 * Get billing day name
 */
export function getBillingDayName(billingDay: BillingCycleDay): string {
  const suffixes: Record<BillingCycleDay, string> = {
    1: '1st',
    5: '5th',
    25: '25th',
    30: '30th (or last day)'
  };
  return suffixes[billingDay];
}
