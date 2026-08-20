/**
 * New signup follow-up cron
 *
 * Finds customers who registered a CircleTel account but never progressed — no
 * order, no service, no onboarding submission — opens one Zoho Desk ticket per
 * person in the SALES department, and sends one digest to the internal sales
 * WhatsApp number.
 *
 * Why: a review of 13–20 Aug 2026 found six such accounts, none contacted by
 * anyone. Without this the gap reopens every week.
 *
 * Schedule: daily 08:30 SAST = 06:30 UTC (vercel.json + host crontab from
 * ops/scheduler/generate-crontab.sh)
 *
 * Auth: Authorization: Bearer $CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOB_NAME = 'new-signup-followup';

function authorize(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    cronLogger.error('[NewSignupFollowup] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    cronLogger.error('[NewSignupFollowup] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

async function run(request: NextRequest): Promise<NextResponse> {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';
  const supabase = await createClient();

  // Open a run log. Logging must never sink the run.
  let logId: string | null = null;
  const { data: logRow, error: logError } = await supabase
    .from('cron_execution_log')
    .insert({
      job_name: JOB_NAME,
      status: 'running',
      trigger_source: 'scheduled',
      environment: process.env.NODE_ENV ?? 'unknown',
    })
    .select('id')
    .single();

  if (logError) {
    cronLogger.error(`[NewSignupFollowup] Could not open run log: ${logError.message}`);
  } else {
    logId = logRow.id;
  }

  try {
    const { findUnflaggedSignups, runNewSignupFollowup } = await import(
      '@/lib/sales-engine/new-signup-followup-service'
    );

    if (dryRun) {
      const candidates = await findUnflaggedSignups({});
      if (logId) {
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            execution_end: new Date().toISOString(),
            records_skipped: candidates.length,
            execution_details: { dry_run: true, candidates: candidates.length },
          })
          .eq('id', logId);
      }
      return NextResponse.json({
        success: true,
        dryRun: true,
        candidates: candidates.length,
        preview: candidates.map((c) => ({
          name: c.fullName,
          email: c.email,
          days: c.daysSinceSignup,
        })),
      });
    }

    const result = await runNewSignupFollowup({});

    cronLogger.info(
      `[NewSignupFollowup] ${result.candidates} candidate(s), ${result.ticketed.length} ticketed, ` +
        `${result.errors.length} failed, digest ${result.whatsappSent ? 'sent' : 'not sent'}`
    );

    if (logId) {
      await supabase
        .from('cron_execution_log')
        .update({
          status: result.errors.length ? 'partial' : 'completed',
          execution_end: new Date().toISOString(),
          duration_seconds: Math.round(result.durationMs / 1000),
          records_processed: result.ticketed.length,
          records_failed: result.errors.length,
          error_message: result.errors.length
            ? result.errors.join('; ').slice(0, 1000)
            : null,
          execution_details: {
            candidates: result.candidates,
            ticketed: result.ticketed.length,
            whatsapp_sent: result.whatsappSent,
          },
        })
        .eq('id', logId);
    }

    return NextResponse.json({
      success: true,
      candidates: result.candidates,
      ticketed: result.ticketed.length,
      failed: result.errors.length,
      whatsappSent: result.whatsappSent,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.error(`[NewSignupFollowup] Run failed: ${message}`);

    if (logId) {
      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: message,
        })
        .eq('id', logId);
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
