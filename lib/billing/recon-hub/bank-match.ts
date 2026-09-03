/**
 * Pure Netcash statement ↔ Zoho cashbook deposit matcher.
 * Auto-match requires the same account number, exact name, amount, and date window.
 */

import type { ReconExceptionRow } from './types';
import { extractAccountNumber, namesEqual } from './party-identity';

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
  status: 'matched' | 'netcash_only' | 'books_only' | 'amount_drift' | 'name_mismatch';
  amountDelta?: number;
}

const AMOUNT_TOLERANCE = 0.05;
const DATE_WINDOW_DAYS = 2;
const CASH_QUEUE_HREF = '/admin/finance/reconciliation/cash-queue';

function parseDay(iso: string): number {
  const d = iso.length === 10 ? `${iso}T00:00:00.000Z` : iso;
  return Math.floor(new Date(d).getTime() / 86_400_000);
}

function amountsClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= AMOUNT_TOLERANCE;
}

function datesClose(a: string, b: string): boolean {
  return Math.abs(parseDay(a) - parseDay(b)) <= DATE_WINDOW_DAYS;
}

function lineAccount(line: BankLineLike): string | null {
  return (
    extractAccountNumber(line.reference) ||
    extractAccountNumber(line.description) ||
    null
  );
}

/**
 * Greedy match: account number + exact name + amount + date window.
 * Amount+date alone never auto-matches.
 */
export function matchBankLines(
  netcash: BankLineLike[],
  books: BankLineLike[]
): BankMatchPair[] {
  const pairs: BankMatchPair[] = [];
  const usedBooks = new Set<string>();
  const usedNetcash = new Set<string>();

  for (const n of netcash) {
    const nAccount = lineAccount(n);
    if (!nAccount) continue;

    const sameAccount = books.filter(
      (b) =>
        !usedBooks.has(b.id) &&
        lineAccount(b) === nAccount &&
        amountsClose(n.amount, b.amount) &&
        datesClose(n.date, b.date)
    );

    const namedHit = sameAccount.find((b) =>
      namesEqual(n.payerName, b.payerName)
    );
    if (namedHit) {
      usedBooks.add(namedHit.id);
      usedNetcash.add(n.id);
      pairs.push({
        netcashId: n.id,
        booksId: namedHit.id,
        amount: n.amount,
        date: n.date,
        reference: n.reference,
        status: 'matched',
      });
      continue;
    }

    if (sameAccount.length > 0) {
      const hit = sameAccount[0];
      usedBooks.add(hit.id);
      usedNetcash.add(n.id);
      pairs.push({
        netcashId: n.id,
        booksId: hit.id,
        amount: n.amount,
        date: n.date,
        reference: n.reference,
        status: 'name_mismatch',
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
        href: CASH_QUEUE_HREF,
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
        href: CASH_QUEUE_HREF,
      });
    } else if (p.status === 'name_mismatch') {
      rows.push({
        id: `bank-name-${p.netcashId}-${p.booksId}`,
        kind: 'bank_match',
        date: p.date,
        netcashRef: p.reference,
        amount: p.amount,
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        zohoStatus: 'n/a',
        reasonCode: 'name_mismatch',
        reasonLabel: 'Account matched — customer/business name does not match',
        severity: 'red',
        href: CASH_QUEUE_HREF,
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
    nameMismatchCount: pairs.filter((p) => p.status === 'name_mismatch').length,
  };
}
