/**
 * Billing engine domain types.
 * Whitelabel Phase 1 — statuses must match customer_invoices.valid_invoice_status.
 */

/** Persisted on customer_invoices.status — must match valid_invoice_status */
export type InvoiceDbStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'voided';

export type InvoiceType =
  | 'recurring'
  | 'installation'
  | 'pro_rata'
  | 'equipment'
  | 'adjustment';

export interface EngineAuditContext {
  user_id?: string;
  user_email?: string;
  source: 'cron' | 'admin' | 'webhook' | 'system' | 'simulation';
  reason?: string;
}
