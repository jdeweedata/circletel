// app/api/admin/billing/reconciliation/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get latest reconciliation run
    const { data: latestRun, error } = await supabase
      .from('cron_execution_log')
      .select('*')
      .eq('job_name', 'paynow-reconciliation')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!latestRun) {
      return NextResponse.json<ReconciliationStatus>({
        lastRun: null,
        counts: { total: 0, matched: 0, alreadyPaid: 0, newlyMatched: 0, unmatched: 0 },
        unmatchedTransactions: [],
      });
    }

    const result = latestRun.result as any;

    const status: ReconciliationStatus = {
      lastRun: {
        date: latestRun.started_at,
        status: latestRun.status === 'completed' ? 'success' :
                latestRun.status === 'completed_with_errors' ? 'partial' : 'failed',
        duration_ms: result?.duration_ms || 0,
      },
      counts: {
        total: result?.totalTransactions || result?.total_transactions || 0,
        matched: result?.matched || 0,
        alreadyPaid: result?.alreadyPaid || result?.already_paid || 0,
        newlyMatched: result?.newlyMatched || result?.newly_matched || 0,
        unmatched: result?.unmatched || 0,
      },
      unmatchedTransactions: result?.unmatchedDetails || result?.unmatched_details || [],
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
