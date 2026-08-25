/**
 * Pure-domain billing simulation types (no Supabase).
 * Whitelabel Phase 1d — month-cycle harness.
 */

import type { InvoiceDbStatus } from '../types';

export type SimInvoiceType = 'recurring' | 'pro_rata' | 'installation' | 'adjustment';

export interface SimInvoice {
  id: string;
  serviceId: string;
  type: SimInvoiceType;
  status: InvoiceDbStatus;
  /** Incl-VAT total owed */
  totalAmount: number;
  amountPaid: number;
  /** Sum of credit notes applied against this invoice */
  creditsApplied: number;
  events: SimEvent[];
}

export type SimEvent =
  | { kind: 'created'; at: string; type: SimInvoiceType }
  | { kind: 'issued'; at: string }
  | { kind: 'payment'; at: string; amount: number; method?: string }
  | { kind: 'collection_failed'; at: string; reason: string; payLinkInvoked: boolean }
  | { kind: 'credit'; at: string; amount: number; noteId: string }
  | { kind: 'status'; at: string; from: InvoiceDbStatus; to: InvoiceDbStatus };

export interface MonthScenario {
  name: string;
  period: string; // e.g. 2026-07
  invoices: SimInvoice[];
}

export interface ArSnapshot {
  invoiceTotals: number;
  credits: number;
  payments: number;
  /** (totals - credits) - payments */
  outstanding: number;
}
