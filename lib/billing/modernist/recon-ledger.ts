// lib/billing/modernist/recon-ledger.ts
import type {
  NetcashMatchState,
  ThreeWayInvoiceRow,
} from '@/lib/billing/recon-hub/types';

export type TraceTone = 'ok' | 'warn' | 'bad' | 'none';
export type LedgerFilter =
  | 'all'
  | 'exceptions'
  | 'zoho'
  | 'netcash'
  | 'ar'
  | 'clean';

export function isBrokenThreeWay(r: ThreeWayInvoiceRow): boolean {
  return (
    r.matchFlags.ctPaidBooksOpen ||
    r.matchFlags.amountMismatch ||
    r.matchFlags.netcashUnmatchedPaid ||
    (r.matchFlags.booksUnlinked && r.ctStatus !== 'paid') ||
    r.booksSyncStatus === 'failed' ||
    r.netcashState === 'unmatched'
  );
}

export function toneForCt(r: ThreeWayInvoiceRow): TraceTone {
  if (['overdue'].includes(r.ctStatus)) return 'bad';
  if (r.matchFlags.ctPaidBooksOpen === false && r.ctStatus === 'paid') return 'ok';
  if (['sent', 'partial'].includes(r.ctStatus)) return 'warn';
  if (r.ctStatus === 'paid') return 'ok';
  return 'ok';
}

export function toneForBooks(r: ThreeWayInvoiceRow): TraceTone {
  if (r.matchFlags.amountMismatch) return 'bad';
  if (r.matchFlags.ctPaidBooksOpen || r.booksSyncStatus === 'pending') return 'warn';
  if (r.booksSyncStatus === 'failed') return 'bad';
  if (!r.booksInvoiceId) return 'none';
  if (r.booksSyncStatus === 'synced') return 'ok';
  return 'warn';
}

export function toneForNetcash(state: NetcashMatchState): TraceTone {
  if (state === 'matched') return 'ok';
  if (state === 'unmatched' || state === 'pending_queue') return 'bad';
  return 'none';
}

export function filterLedgerRows(
  rows: ThreeWayInvoiceRow[],
  filter: LedgerFilter
): ThreeWayInvoiceRow[] {
  switch (filter) {
    case 'exceptions':
      return rows.filter(isBrokenThreeWay);
    case 'zoho':
      return rows.filter(
        (r) =>
          r.matchFlags.ctPaidBooksOpen ||
          r.booksSyncStatus === 'pending' ||
          r.booksSyncStatus === 'failed'
      );
    case 'netcash':
      return rows.filter(
        (r) => r.matchFlags.netcashUnmatchedPaid || r.netcashState === 'unmatched'
      );
    case 'ar':
      return rows.filter(
        (r) =>
          r.ctDue > 0.05 &&
          ['sent', 'overdue', 'partial', 'open'].includes(r.ctStatus)
      );
    case 'clean':
      return rows.filter((r) => !isBrokenThreeWay(r));
    case 'all':
    default:
      return rows;
  }
}

export function ledgerActionLabel(r: ThreeWayInvoiceRow): string {
  if (r.matchFlags.netcashUnmatchedPaid || r.netcashState === 'unmatched')
    return 'Match';
  if (r.matchFlags.ctPaidBooksOpen || r.booksSyncStatus === 'pending')
    return 'Re-run';
  if (r.ctDue > 0.05 && ['overdue', 'sent', 'partial'].includes(r.ctStatus))
    return 'Open AR';
  if (isBrokenThreeWay(r)) return 'Review';
  return '';
}
