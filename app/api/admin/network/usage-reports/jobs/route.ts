import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';
import type { TdxPatientRow } from '@/lib/usage-reports/patient-wifi';
import { resolveReportPeriod } from '@/lib/usage-reports/periods';
import type { ReportPeriodPreset } from '@/lib/usage-reports/types';

interface JobRequest {
  siteIds?: unknown;
  period?: unknown;
  custom?: { startDate?: unknown; endDate?: unknown };
  includeCsv?: unknown;
  patientRows?: unknown;
}

const PERIOD_PRESETS = new Set<ReportPeriodPreset>([
  'weekly',
  'monthly',
  'sixty_day',
  'custom',
]);

class RequestValidationError extends Error {}

function isPatientRow(value: unknown): value is TdxPatientRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.siteCode === 'string' &&
    typeof row.uniqueUsers === 'number' &&
    Number.isFinite(row.uniqueUsers) &&
    row.uniqueUsers >= 0 &&
    typeof row.loginSessions === 'number' &&
    Number.isFinite(row.loginSessions) &&
    row.loginSessions >= 0 &&
    typeof row.downloadGb === 'number' &&
    Number.isFinite(row.downloadGb) &&
    row.downloadGb >= 0
  );
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  let jobId: string | null = null;
  try {
    const body = (await request.json()) as JobRequest;
    const siteIds = Array.isArray(body.siteIds)
      ? [...new Set(body.siteIds.filter((id): id is string => typeof id === 'string'))]
      : [];
    if (siteIds.length <= 5) {
      return NextResponse.json(
        { error: 'Async generation requires more than 5 unique site IDs' },
        { status: 400 }
      );
    }
    if (typeof body.period !== 'string' || !PERIOD_PRESETS.has(body.period as ReportPeriodPreset)) {
      return NextResponse.json({ error: 'Invalid report period preset' }, { status: 400 });
    }
    const patientRows = Array.isArray(body.patientRows)
      ? body.patientRows.filter(isPatientRow)
      : [];
    if (Array.isArray(body.patientRows) && patientRows.length !== body.patientRows.length) {
      return NextResponse.json({ error: 'Invalid patientRows payload' }, { status: 400 });
    }

    const custom =
      typeof body.custom?.startDate === 'string' && typeof body.custom?.endDate === 'string'
        ? { startDate: body.custom.startDate, endDate: body.custom.endDate }
        : undefined;
    let period: ReturnType<typeof resolveReportPeriod>;
    try {
      period = resolveReportPeriod(body.period as ReportPeriodPreset, new Date(), custom);
    } catch (error) {
      throw new RequestValidationError(
        error instanceof Error ? error.message : 'Invalid report period'
      );
    }
    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();
    const expiresAtIso = new Date(
      createdAt.getTime() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const supabase = await createClient();
    const { data: job, error: insertError } = await supabase
      .from('site_usage_report_jobs')
      .insert({
        created_by: authResult.user.id,
        created_at: createdAtIso,
        updated_at: createdAtIso,
        status: 'queued',
        period_preset: period.preset,
        period_start: period.startUtc.toISOString(),
        period_end: period.endUtc.toISOString(),
        site_ids: siteIds,
        include_csv: body.includeCsv === true,
        primary_sources: {},
        outcome: { progress: 0 },
        expires_at: expiresAtIso,
      })
      .select('id')
      .single();
    if (insertError || !job) {
      throw new Error(`Failed to queue report job: ${insertError?.message ?? 'No job returned'}`);
    }
    jobId = job.id;

    await inngest.send({
      name: 'usage-reports/zip.requested',
      data: { jobId, patientRows },
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UsageReportsJobs] Failed to queue job:', error);
    if (jobId) {
      const supabase = await createClient();
      await supabase
        .from('site_usage_report_jobs')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
    const status =
      error instanceof RequestValidationError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json(
      { error: status === 400 ? message : 'Failed to queue usage report job' },
      { status }
    );
  }
}
