/**
 * Billing System Type Definitions
 * 
 * Shared types for billing, invoices, and payment methods
 */

import { Database } from '@/lib/types/database.types';

// Database table types
export type CustomerInvoice = Database['public']['Tables']['customer_invoices']['Row'];
export type CustomerInvoiceInsert = Database['public']['Tables']['customer_invoices']['Insert'];
export type CustomerInvoiceUpdate = Database['public']['Tables']['customer_invoices']['Update'];

export type CustomerBilling = Database['public']['Tables']['customer_billing']['Row'];
export type CustomerBillingInsert = Database['public']['Tables']['customer_billing']['Insert'];
export type CustomerBillingUpdate = Database['public']['Tables']['customer_billing']['Update'];

export type PaymentMethod = Database['public']['Tables']['customer_payment_methods']['Row'];
export type PaymentMethodInsert = Database['public']['Tables']['customer_payment_methods']['Insert'];
export type PaymentMethodUpdate = Database['public']['Tables']['customer_payment_methods']['Update'];

export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row'];
export type PaymentTransactionInsert = Database['public']['Tables']['payment_transactions']['Insert'];
export type PaymentTransactionUpdate = Database['public']['Tables']['payment_transactions']['Update'];

/**
 * Billing date options
 */
export type BillingDate = 1 | 5 | 25 | 30;

/**
 * Invoice status
 */
export type InvoiceStatus = 'unpaid' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';

/**
 * Invoice type
 */
export type InvoiceType = 'recurring' | 'installation' | 'pro_rata' | 'equipment' | 'adjustment';

/**
 * Payment method type
 */
export type PaymentMethodType = 'debit_order' | 'card' | 'eft';

/**
 * Payment transaction status
 */
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

/**
 * Invoice line item structure
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type: InvoiceType;
}

/**
 * Payment method display (masked details)
 */
export interface PaymentMethodDisplay {
  id: string;
  display_name: string;
  last_four?: string;
  method_type: PaymentMethodType;
  is_primary: boolean;
  is_active: boolean;
  mandate_status?: string;
}

/**
 * Bank account details (for encryption)
 */
export interface BankAccountDetails {
  bank_name: string;
  account_number: string;
  account_type: 'cheque' | 'savings';
  branch_code: string;
  account_holder: string;
}

/**
 * Card details (for encryption)
 */
export interface CardDetails {
  card_number: string;
  card_holder: string;
  expiry_month: string;
  expiry_year: string;
  card_type: 'visa' | 'mastercard' | 'amex';
  cvv?: string; // Don't store CVV
}

/**
 * Invoice with customer details
 */
export interface InvoiceWithDetails extends CustomerInvoice {
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    account_number: string;
  };
  service?: {
    id: string;
    package_name: string;
    service_type: string;
  };
}

/**
 * Billing summary for dashboard
 */
export interface BillingSummary {
  account_balance: number;
  credit_limit: number;
  next_billing_date?: string;
  primary_payment_method?: PaymentMethodDisplay;
  recent_transactions: PaymentTransaction[];
  upcoming_invoices: CustomerInvoice[];
  overdue_invoices: CustomerInvoice[];
  auto_pay_enabled: boolean;
}

/**
 * Pro-rata calculation result
 */
export interface ProRataCalculation {
  days_in_period: number;
  days_used: number;
  monthly_amount: number;
  prorated_amount: number;
  billing_period_start: Date;
  billing_period_end: Date;
}

/**
 * Invoice generation result
 */
export interface InvoiceGenerationResult {
  invoice: CustomerInvoice;
  balance_updated: boolean;
  notification_sent: boolean;
  pdf_generated: boolean;
}

/**
 * Payment processing result
 */
export interface PaymentProcessingResult {
  transaction: PaymentTransaction;
  invoice_updated: boolean;
  balance_updated: boolean;
  notification_sent: boolean;
  status: TransactionStatus;
  error_message?: string;
}
