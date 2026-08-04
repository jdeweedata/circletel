// app/api/admin/billing/reconciliation/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const runtime = 'nodejs';

export interface ReconciliationStatus {
  lastRun: {
    date: string;
    status: 'success' | 'partial' | 'failed';
    duration_ms: number;
  } | null;
  counts: {
    total: number;
    matched: number;
    alreadyPaid: number;
    newlyMatched: number;
    unmatched: number;
  };
  unmatchedTransactions: Array<{
    netcashRef: string;
    yourRef: string;
    amount: number;
    reason: string;
  }>;
}

type ExecutionDetails = {
  duration_ms?: number;
  total_transactions?: number;
  totalTransactions?: number;
  matched?: number;
  already_paid?: number;
  alreadyPaid?: number;
  newly_matched?: number;
  newlyMatched?: number;
  unmatched?: number;
  unmatched_details?: Array<{
    netcashRef?: string;
    yourRef?: string;
    amount?: number;
    reason?: string;
  }>;
  unmatchedDetails?: Array<{
    netcashRef?: string;
    yourRef?: string;
    amount?: number;
    reason?: string;
  }>;
};

function mapRunStatus(
  dbStatus: string | null | undefined
): 'success' | 'partial' | 'failed' {
  if (dbStatus === 'completed' || dbStatus === 'success') return 'success';
  if (dbStatus === 'completed_with_errors' || dbStatus === 'partial') {
    return 'partial';
  }
  return 'failed';
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const supabase = await createClient();

    // Schema uses execution_start / execution_details (not started_at / result)
    const { data: latestRun, error } = await supabase
      .from('cron_execution_log')
      .select(
        'status, execution_start, duration_seconds, execution_details, records_processed, records_failed'
      )
      .eq('job_name', 'paynow-reconciliation')
      .order('execution_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!latestRun) {
      return NextResponse.json<ReconciliationStatus>({
        lastRun: null,
        counts: {
          total: 0,
          matched: 0,
          alreadyPaid: 0,
          newlyMatched: 0,
          unmatched: 0,
        },
        unmatchedTransactions: [],
      });
    }

    const details =
      (latestRun.execution_details as ExecutionDetails | null) ?? {};
    const durationMs =
      Number(details.duration_ms ?? 0) ||
      (typeof latestRun.duration_seconds === 'number'
        ? Math.round(latestRun.duration_seconds * 1000)
        : 0);

    const unmatchedDetails =
      details.unmatchedDetails ?? details.unmatched_details ?? [];

    const status: ReconciliationStatus = {
      lastRun: {
        date: latestRun.execution_start,
        status: mapRunStatus(latestRun.status),
        duration_ms: durationMs,
      },
      counts: {
        total:
          Number(
            details.total_transactions ??
              details.totalTransactions ??
              latestRun.records_processed ??
              0
          ) || 0,
        matched: Number(details.matched ?? 0) || 0,
        alreadyPaid:
          Number(details.already_paid ?? details.alreadyPaid ?? 0) || 0,
        newlyMatched:
          Number(details.newly_matched ?? details.newlyMatched ?? 0) || 0,
        unmatched:
          Number(
            details.unmatched ?? latestRun.records_failed ?? 0
          ) || 0,
      },
      unmatchedTransactions: unmatchedDetails.map((d) => ({
        netcashRef: d.netcashRef ?? '',
        yourRef: d.yourRef ?? '',
        amount: Number(d.amount ?? 0),
        reason: d.reason ?? '',
      })),
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
