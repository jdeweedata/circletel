/**
 * NetCash merchant-statement audit (read-only).
 * Sweeps daily statements and classifies debit / PayNow success lines vs invoices.
 */

import {
  NetCashStatementService,
  TRANSACTION_CODES,
  type StatementTransaction,
  netcashStatementService,
} from '@/lib/payments/netcash-statement-service';
import { createClient } from '@/lib/supabase/server';

export const STATEMENT_AUDIT_MAX_DAYS = 62;

export type StatementAuditRails = 'all' | 'debit' | 'paynow';

export type StatementAuditMatch =
  | 'MATCHED_PAID_OK'
  | 'MATCHED_PAID_DUE_DRIFT'
  | 'MATCHED_INVOICE_NOT_PAID'
  | 'MATCHED_PARTIAL_OR_UNPAID_STATUS'
  | 'SUCCESS_NO_INVOICE'
  | 'FAIL_INVOICE_UNPAID_OK'
  | 'FAIL_BUT_INVOICE_PAID'
  | 'FAIL_NO_INVOICE';

export type StatementAuditRail = 'debit' | 'paynow' | 'other';

export interface InvoiceAuditSnapshot {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  paid_at: string | null;
  paynow_transaction_ref: string | null;
  payment_collection_method: string | null;
}

export interface StatementAuditRow {
  date: string;
  code: string;
  rail: StatementAuditRail;
  amount: number;
  reference: string;
  description: string;
  invoiceNumber: string | null;
  invoiceId: string | null;
  match: StatementAuditMatch;
  invStatus: string | null;
  invPaid: number | null;
  invDue: number | null;
  possibleDoubleCollect: boolean;
}

export interface StatementAuditDayError {
  date: string;
  error: string;
}

export interface StatementAuditSummary {
  matchedPaidOk: number;
  matchedPaidDueDrift: number;
  matchedInvoiceNotPaid: number;
  successNoInvoice: number;
  possibleDoubleCollect: number;
  failLines: number;
  statementDaysFailed: number;
  successLines: number;
  daysScanned: number;
  daysOk: number;
}

export interface StatementAuditReport {
  from: string;
  to: string;
  rails: StatementAuditRails;
  ranAt: string;
  durationMs: number;
  summary: StatementAuditSummary;
  successes: StatementAuditRow[];
  failures: StatementAuditRow[];
  dayErrors: StatementAuditDayError[];
}

export interface StatementAuditRequest {
  from: string;
  to: string;
  rails?: StatementAuditRails;
}

const PAYNOW_SUCCESS = new Set(['PNC', 'PIS']);
const PAYNOW_FAIL = new Set(['PNU', 'PIF', 'PND']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function datesBetween(from: string, to: string): string[] {
  return enumerateDates(from, to);
}

function enumerateDates(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m, d] = from.split('-').map(Number);
  const [ey, em, ed] = to.split('-').map(Number);
  const endKey = ey * 10000 + em * 100 + ed;
  while (y * 10000 + m * 100 + d <= endKey) {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    out.push(`${y}-${mm}-${dd}`);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    y = dt.getUTCFullYear();
    m = dt.getUTCMonth() + 1;
    d = dt.getUTCDate();
    if (out.length > STATEMENT_AUDIT_MAX_DAYS + 1) break;
  }
  return out;
}

export function validateStatementAuditRange(
  from: string,
  to: string
): { ok: true; days: string[] } | { ok: false; error: string } {
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return { ok: false, error: 'from and to must be YYYY-MM-DD' };
  }
  if (from > to) {
    return { ok: false, error: 'from must be on or before to' };
  }
  const days = enumerateDates(from, to);
  if (days.length === 0) {
    return { ok: false, error: 'Invalid date range' };
  }
  if (days.length > STATEMENT_AUDIT_MAX_DAYS) {
    return {
      ok: false,
      error: `Date range exceeds maximum of ${STATEMENT_AUDIT_MAX_DAYS} days`,
    };
  }
  return { ok: true, days };
}

/** Extract INV-2026-NNNNN from description / reference blobs. */
export function extractInvoiceNumber(...parts: Array<string | undefined | null>): string | null {
  const blob = parts.filter(Boolean).join(' ');
  const full = blob.match(/INV-?2026-0*(\d+)/i);
  if (full) {
    return `INV-2026-${full[1].padStart(5, '0')}`;
  }
  const short = blob.match(/INV-0*(\d+)/i);
  if (short) {
    return `INV-2026-${short[1].padStart(5, '0')}`;
  }
  return null;
}

export function classifyStatementCode(code: string): {
  kind: 'debit_success' | 'debit_fail' | 'paynow_success' | 'paynow_fail' | 'ignore';
  rail: StatementAuditRail;
} {
  const c = code.toUpperCase();
  const debitMeta = TRANSACTION_CODES[c as keyof typeof TRANSACTION_CODES];
  if (debitMeta?.type === 'debit_success') {
    return { kind: 'debit_success', rail: 'debit' };
  }
  if (debitMeta?.type === 'debit_unpaid' || debitMeta?.type === 'debit_disputed') {
    return { kind: 'debit_fail', rail: 'debit' };
  }
  if (PAYNOW_SUCCESS.has(c)) {
    return { kind: 'paynow_success', rail: 'paynow' };
  }
  if (PAYNOW_FAIL.has(c)) {
    return { kind: 'paynow_fail', rail: 'paynow' };
  }
  return { kind: 'ignore', rail: 'other' };
}

export function classifySuccessAgainstInvoice(
  inv: InvoiceAuditSnapshot | null | undefined
): StatementAuditMatch {
  if (!inv) return 'SUCCESS_NO_INVOICE';
  const due = Number(inv.amount_due) || 0;
  const paid = Number(inv.amount_paid) || 0;
  if (inv.status === 'paid' && due <= 0.001) return 'MATCHED_PAID_OK';
  if (inv.status === 'paid' && due > 0.001) return 'MATCHED_PAID_DUE_DRIFT';
  if (paid > 0) return 'MATCHED_PARTIAL_OR_UNPAID_STATUS';
  return 'MATCHED_INVOICE_NOT_PAID';
}

export function classifyFailAgainstInvoice(
  inv: InvoiceAuditSnapshot | null | undefined
): StatementAuditMatch {
  if (!inv) return 'FAIL_NO_INVOICE';
  if (inv.status === 'paid') return 'FAIL_BUT_INVOICE_PAID';
  return 'FAIL_INVOICE_UNPAID_OK';
}

function railsAllows(rails: StatementAuditRails, rail: StatementAuditRail): boolean {
  if (rails === 'all') return rail === 'debit' || rail === 'paynow';
  return rails === rail;
}

export function resolveInvoiceFromMaps(
  invoiceNumber: string | null,
  reference: string,
  byNum: Map<string, InvoiceAuditSnapshot>,
  byPaynowRef: Map<string, InvoiceAuditSnapshot>
): InvoiceAuditSnapshot | null {
  if (invoiceNumber) {
    const hit = byNum.get(invoiceNumber);
    if (hit) return hit;
  }
  if (!reference) return null;
  const exact = byPaynowRef.get(reference);
  if (exact) return exact;

  const uuid = reference.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (uuid) {
    const byUuid = byPaynowRef.get(uuid[0]);
    if (byUuid) return byUuid;
  }

  for (const [k, v] of byPaynowRef) {
    if (!k) continue;
    if (reference.includes(k) || k.includes(reference)) return v;
  }
  return null;
}

export function buildAuditRow(params: {
  date: string;
  tx: StatementTransaction;
  rail: StatementAuditRail;
  match: StatementAuditMatch;
  inv: InvoiceAuditSnapshot | null;
  invoiceNumber: string | null;
  possibleDoubleCollect?: boolean;
}): StatementAuditRow {
  const { date, tx, rail, match, inv, invoiceNumber, possibleDoubleCollect } = params;
  return {
    date,
    code: (tx.transactionCode || '').toUpperCase(),
    rail,
    amount: Number(tx.amount) || 0,
    reference: tx.reference || '',
    description: (tx.description || '').replace(/\s+/g, ' ').slice(0, 120),
    invoiceNumber: inv?.invoice_number || invoiceNumber,
    invoiceId: inv?.id || null,
    match,
    invStatus: inv?.status ?? null,
    invPaid: inv ? Number(inv.amount_paid) : null,
    invDue: inv ? Number(inv.amount_due) : null,
    possibleDoubleCollect: Boolean(possibleDoubleCollect),
  };
}

/** Apply double-collect flags when same invoice has paynow + debit success in window. */
export function flagPossibleDoubleCollects(successes: StatementAuditRow[]): void {
  const byInv = new Map<string, { paynow: boolean; debit: boolean; indexes: number[] }>();
  successes.forEach((row, index) => {
    if (!row.invoiceNumber) return;
    const entry = byInv.get(row.invoiceNumber) || {
      paynow: false,
      debit: false,
      indexes: [],
    };
    if (row.rail === 'paynow') entry.paynow = true;
    if (row.rail === 'debit') entry.debit = true;
    entry.indexes.push(index);
    byInv.set(row.invoiceNumber, entry);
  });
  for (const entry of byInv.values()) {
    if (entry.paynow && entry.debit) {
      for (const i of entry.indexes) {
        successes[i].possibleDoubleCollect = true;
      }
    }
  }
}

export function summarizeAudit(params: {
  successes: StatementAuditRow[];
  failures: StatementAuditRow[];
  dayErrors: StatementAuditDayError[];
  daysScanned: number;
  daysOk: number;
}): StatementAuditSummary {
  const { successes, failures, dayErrors, daysScanned, daysOk } = params;
  let matchedPaidOk = 0;
  let matchedPaidDueDrift = 0;
  let matchedInvoiceNotPaid = 0;
  let successNoInvoice = 0;
  const doubleInvs = new Set<string>();

  for (const s of successes) {
    if (s.match === 'MATCHED_PAID_OK') matchedPaidOk++;
    else if (s.match === 'MATCHED_PAID_DUE_DRIFT') matchedPaidDueDrift++;
    else if (
      s.match === 'MATCHED_INVOICE_NOT_PAID' ||
      s.match === 'MATCHED_PARTIAL_OR_UNPAID_STATUS'
    ) {
      matchedInvoiceNotPaid++;
    } else if (s.match === 'SUCCESS_NO_INVOICE') successNoInvoice++;
    if (s.possibleDoubleCollect && s.invoiceNumber) {
      doubleInvs.add(s.invoiceNumber);
    }
  }

  return {
    matchedPaidOk,
    matchedPaidDueDrift,
    matchedInvoiceNotPaid,
    successNoInvoice,
    possibleDoubleCollect: doubleInvs.size,
    failLines: failures.length,
    statementDaysFailed: dayErrors.length,
    successLines: successes.length,
    daysScanned,
    daysOk,
  };
}

export type StatementFetcher = (date: Date) => Promise<{
  success: boolean;
  transactions: StatementTransaction[];
  error?: string;
}>;

export async function runStatementAudit(
  request: StatementAuditRequest,
  deps?: {
    fetchStatement?: StatementFetcher;
    loadInvoices?: () => Promise<InvoiceAuditSnapshot[]>;
  }
): Promise<StatementAuditReport> {
  const started = Date.now();
  const rails: StatementAuditRails = request.rails || 'all';
  const validated = validateStatementAuditRange(request.from, request.to);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const fetchStatement =
    deps?.fetchStatement ||
    ((date: Date) => netcashStatementService.getStatement(date));

  const loadInvoices =
    deps?.loadInvoices ||
    (async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('customer_invoices')
        .select(
          'id, invoice_number, status, total_amount, amount_paid, amount_due, paid_at, paynow_transaction_ref, payment_collection_method'
        );
      if (error) throw new Error(`Failed to load invoices: ${error.message}`);
      return (data || []) as InvoiceAuditSnapshot[];
    });

  const invoices = await loadInvoices();
  const byNum = new Map(invoices.map((i) => [i.invoice_number, i]));
  const byPaynowRef = new Map<string, InvoiceAuditSnapshot>();
  for (const inv of invoices) {
    if (inv.paynow_transaction_ref) {
      byPaynowRef.set(inv.paynow_transaction_ref, inv);
    }
  }

  const successes: StatementAuditRow[] = [];
  const failures: StatementAuditRow[] = [];
  const dayErrors: StatementAuditDayError[] = [];
  let daysOk = 0;

  for (const dateStr of validated.days) {
    const st = await fetchStatement(new Date(`${dateStr}T12:00:00+02:00`));
    if (!st.success) {
      dayErrors.push({
        date: dateStr,
        error: st.error || 'Statement not available',
      });
      continue;
    }
    daysOk++;

    for (const tx of st.transactions) {
      const { kind, rail } = classifyStatementCode(tx.transactionCode || '');
      if (kind === 'ignore') continue;
      if (!railsAllows(rails, rail)) continue;

      const invoiceNumber = extractInvoiceNumber(
        tx.description,
        tx.reference,
        tx.accountReference
      );
      const inv = resolveInvoiceFromMaps(
        invoiceNumber,
        tx.reference || '',
        byNum,
        byPaynowRef
      );

      if (kind === 'debit_success' || kind === 'paynow_success') {
        successes.push(
          buildAuditRow({
            date: dateStr,
            tx,
            rail,
            match: classifySuccessAgainstInvoice(inv),
            inv,
            invoiceNumber,
          })
        );
      } else {
        failures.push(
          buildAuditRow({
            date: dateStr,
            tx,
            rail,
            match: classifyFailAgainstInvoice(inv),
            inv,
            invoiceNumber,
          })
        );
      }
    }
  }

  flagPossibleDoubleCollects(successes);

  const summary = summarizeAudit({
    successes,
    failures,
    dayErrors,
    daysScanned: validated.days.length,
    daysOk,
  });

  return {
    from: request.from,
    to: request.to,
    rails,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    summary,
    successes,
    failures,
    dayErrors,
  };
}

/** Exposed for tests that need the singleton type without constructing NetCash. */
export type { NetCashStatementService };
