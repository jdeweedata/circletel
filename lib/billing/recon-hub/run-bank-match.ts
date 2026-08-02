/**
 * Pull Netcash statement lines + Zoho cashbook deposits and match them.
 */

import { createClient } from '@/lib/supabase/server';
import { cashbookService } from '@/lib/integrations/zoho/cashbook-service';
import { NetCashStatementService } from '@/lib/payments/netcash-statement-service';
import { apiLogger } from '@/lib/logging';
import {
  bankPairsToExceptionRows,
  matchBankLines,
  summarizeBankPairs,
  type BankLineLike,
  type BankMatchPair,
} from './bank-match';
import type { ReconExceptionRow } from './types';

export interface BankMatchRunResult {
  pairs: BankMatchPair[];
  exceptions: ReconExceptionRow[];
  summary: ReturnType<typeof summarizeBankPairs>;
  dateRange: { from: string; to: string };
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function eachDateInclusive(fromDate: string, toDate: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out.slice(0, 14); // hard cap for hub latency
}

export type BankMatchMode = 'queue_only' | 'full';

/**
 * Run three-way bank match for [from, to) ISO bounds.
 * - queue_only: fast hub path using reconciliation_queue (+ optional Books pull)
 * - full: nightly cron — live Netcash statements + Zoho cashbook
 */
export async function runThreeWayBankMatch(
  windowFrom: string,
  windowTo: string,
  mode: BankMatchMode = 'queue_only'
): Promise<BankMatchRunResult> {
  const fromDate = toDateOnly(windowFrom);
  const toDate = toDateOnly(
    new Date(new Date(windowTo).getTime() - 1).toISOString()
  );

  let booksLines: BankLineLike[] = [];
  if (mode === 'full') {
    try {
      const pull = await cashbookService.pullDeposits(fromDate, toDate);
      booksLines = pull.deposits.map((d) => ({
        id: d.transactionId,
        date: d.date,
        amount: Math.abs(Number(d.amount) || 0),
        reference: d.reference || null,
        description: d.description || null,
        payerName: d.payerName || null,
      }));
    } catch (error) {
      apiLogger.warn('[bank-match] Zoho cashbook pull failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let netcashLines: BankLineLike[] = [];
  if (mode === 'full') {
    try {
      const svc = new NetCashStatementService();
      for (const day of eachDateInclusive(fromDate, toDate)) {
        const statement = await svc.getStatement(
          new Date(`${day}T12:00:00.000Z`)
        );
        if (!statement.success) continue;
        for (const [idx, t] of statement.transactions.entries()) {
          if (!(t.effect === '+' || t.amount > 0)) continue;
          netcashLines.push({
            id: `nc-${day}-${t.reference || idx}-${t.amount}`,
            date: (t.date || day).slice(0, 10),
            amount: Math.abs(Number(t.amount) || 0),
            reference: t.reference || t.accountReference || null,
            description: t.description || null,
          });
        }
      }
    } catch (error) {
      apiLogger.warn('[bank-match] Netcash statement pull failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Also include pending recon queue netcash_statement / zoho_cashbook as soft lines
  try {
    const supabase = await createClient();
    const { data: queue } = await supabase
      .from('reconciliation_queue')
      .select('id, amount, source_date, source_reference, payer_reference, source, status')
      .in('source', ['netcash_statement', 'zoho_cashbook', 'netcash_paynow', 'netcash'])
      .eq('status', 'pending')
      .gte('source_date', fromDate)
      .lte('source_date', toDate)
      .limit(500);

    for (const row of queue ?? []) {
      const src = String(row.source || '');
      const line: BankLineLike = {
        id: `queue-${row.id}`,
        date: String(row.source_date || fromDate).slice(0, 10),
        amount: Math.abs(Number(row.amount) || 0),
        reference:
          (row.source_reference as string | null) ||
          (row.payer_reference as string | null) ||
          null,
      };
      if (src.includes('zoho') || src === 'zoho_cashbook') {
        if (!booksLines.some((b) => b.id === line.id)) booksLines.push(line);
      } else if (!netcashLines.some((n) => n.id === line.id)) {
        netcashLines.push(line);
      }
    }
  } catch (error) {
    apiLogger.warn('[bank-match] queue enrichment failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const pairs = matchBankLines(netcashLines, booksLines);
  const exceptions = bankPairsToExceptionRows(pairs);
  const summary = summarizeBankPairs(pairs);

  // Persist auto-matches onto reconciliation_queue when both sides came from queue
  if (mode === 'full') {
    try {
      const supabase = await createClient();
      for (const pair of pairs) {
        if (pair.status !== 'matched') continue;
        const queueIds = [pair.netcashId, pair.booksId]
          .filter((id): id is string => Boolean(id?.startsWith('queue-')))
          .map((id) => id.replace(/^queue-/, ''));
        if (queueIds.length === 0) continue;
        const threeWayMeta = {
          netcashId: pair.netcashId,
          booksId: pair.booksId,
          amount: pair.amount,
          date: pair.date,
          reference: pair.reference,
          matchedAt: new Date().toISOString(),
        };
        for (const queueId of queueIds) {
          const { data: existing } = await supabase
            .from('reconciliation_queue')
            .select('raw_data')
            .eq('id', queueId)
            .eq('status', 'pending')
            .maybeSingle();
          if (!existing) continue;
          const prev =
            existing.raw_data && typeof existing.raw_data === 'object'
              ? (existing.raw_data as Record<string, unknown>)
              : {};
          await supabase
            .from('reconciliation_queue')
            .update({
              status: 'auto_matched',
              match_method: 'three_way_bank',
              match_confidence: 0.9,
              resolution_notes: `Auto-matched Netcash↔Books bank (${pair.date}, R${pair.amount})`,
              resolved_at: new Date().toISOString(),
              raw_data: { ...prev, three_way_match: threeWayMeta },
            })
            .eq('id', queueId)
            .eq('status', 'pending');
        }
      }
    } catch (error) {
      apiLogger.warn('[bank-match] failed to persist queue auto-matches', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    pairs,
    exceptions,
    summary,
    dateRange: { from: fromDate, to: toDate },
  };
}
