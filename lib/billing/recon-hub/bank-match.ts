/**
 * Pure Netcash statement ↔ Zoho cashbook deposit matcher.
 */

import type { ReconExceptionRow } from './types';

export interface BankLineLike {
  id: string;
  date: string; // YYYY-MM-DD preferred
  amount: number;
  reference: string | null;
  description?: string | null;
  payerName?: string | null;
}

export interface BankMatchPair {
  netcashId: string | null;
  booksId: string | null;
  amount: number;
  date: string;
  reference: string | null;
  status: 'matched' | 'netcash_only' | 'books_only' | 'amount_drift';
  amountDelta?: number;
}

const AMOUNT_TOLERANCE = 0.05;
const DATE_WINDOW_DAYS = 2;

function parseDay(iso: string): number {
  const d = iso.length === 10 ? `${iso}T00:00:00.000Z` : iso;
  return Math.floor(new Date(d).getTime() / 86_400_000);
}

function normRef(ref: string | null | undefined): string {
  return String(ref || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function amountsClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= AMOUNT_TOLERANCE;
}

function datesClose(a: string, b: string): boolean {
  return Math.abs(parseDay(a) - parseDay(b)) <= DATE_WINDOW_DAYS;
}

/**
 * Greedy match: prefer reference+amount, then amount+date window.
 */
export function matchBankLines(
  netcash: BankLineLike[],
  books: BankLineLike[]
): BankMatchPair[] {
  const pairs: BankMatchPair[] = [];
  const usedBooks = new Set<string>();
  const usedNetcash = new Set<string>();

  // Pass 1: exact reference + amount
  for (const n of netcash) {
    const nRef = normRef(n.reference);
    if (!nRef) continue;
    const hit = books.find(
      (b) =>
        !usedBooks.has(b.id) &&
        amountsClose(n.amount, b.amount) &&
        (normRef(b.reference) === nRef ||
          normRef(b.description).includes(nRef) ||
          nRef.includes(normRef(b.reference)))
    );
    if (hit) {
      usedBooks.add(hit.id);
      usedNetcash.add(n.id);
      pairs.push({
        netcashId: n.id,
        booksId: hit.id,
        amount: n.amount,
        date: n.date,
        reference: n.reference,
        status: 'matched',
      });
    }
  }

  // Pass 2: amount + date window
  for (const n of netcash) {
    if (usedNetcash.has(n.id)) continue;
    const hit = books.find(
      (b) =>
        !usedBooks.has(b.id) &&
        amountsClose(n.amount, b.amount) &&
        datesClose(n.date, b.date)
    );
    if (hit) {
      usedBooks.add(hit.id);
      usedNetcash.add(n.id);
      const drift = Math.abs(parseDay(n.date) - parseDay(hit.date)) > 0;
      pairs.push({
        netcashId: n.id,
        booksId: hit.id,
        amount: n.amount,
        date: n.date,
        reference: n.reference,
        status: drift ? 'amount_drift' : 'matched',
        amountDelta: Math.round((n.amount - hit.amount) * 100) / 100,
      });
    }
  }

  for (const n of netcash) {
    if (usedNetcash.has(n.id)) continue;
    pairs.push({
      netcashId: n.id,
      booksId: null,
      amount: n.amount,
      date: n.date,
      reference: n.reference,
      status: 'netcash_only',
    });
  }

  for (const b of books) {
    if (usedBooks.has(b.id)) continue;
    pairs.push({
      netcashId: null,
      booksId: b.id,
      amount: b.amount,
      date: b.date,
      reference: b.reference,
      status: 'books_only',
    });
  }

  return pairs;
}

export function bankPairsToExceptionRows(pairs: BankMatchPair[]): ReconExceptionRow[] {
  const rows: ReconExceptionRow[] = [];
  for (const p of pairs) {
    if (p.status === 'matched') continue;
    if (p.status === 'netcash_only') {
      rows.push({
        id: `bank-nc-${p.netcashId}`,
        kind: 'bank_match',
        date: p.date,
        netcashRef: p.reference,
        amount: p.amount,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        zohoStatus: 'n/a',
        reasonCode: 'bank_netcash_no_books',
        reasonLabel: 'Netcash settled — no Zoho bank/payment match',
        severity: 'red',
        href: '/admin/finance/reconciliation',
      });
    } else if (p.status === 'books_only') {
      rows.push({
        id: `bank-zb-${p.booksId}`,
        kind: 'bank_match',
        date: p.date,
        netcashRef: p.reference,
        amount: p.amount,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        zohoStatus: 'n/a',
        reasonCode: 'bank_books_no_netcash',
        reasonLabel: 'Zoho bank deposit — no Netcash line',
        severity: 'amber',
        href: '/admin/integrations/zoho-books',
      });
    } else if (p.status === 'amount_drift') {
      rows.push({
        id: `bank-drift-${p.netcashId}-${p.booksId}`,
        kind: 'bank_match',
        date: p.date,
        netcashRef: p.reference,
        amount: p.amount,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        zohoStatus: 'n/a',
        reasonCode: 'bank_amount_drift',
        reasonLabel: 'Netcash ↔ Books bank amount/date drift',
        severity: 'amber',
        href: '/admin/finance/reconciliation',
      });
    }
  }
  return rows;
}

export function summarizeBankPairs(pairs: BankMatchPair[]) {
  return {
    matchedCount: pairs.filter((p) => p.status === 'matched').length,
    netcashOnlyCount: pairs.filter((p) => p.status === 'netcash_only').length,
    booksOnlyCount: pairs.filter((p) => p.status === 'books_only').length,
    driftCount: pairs.filter((p) => p.status === 'amount_drift').length,
  };
}
