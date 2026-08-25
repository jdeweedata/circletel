import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { buildUsageReportArtifact } from '@/lib/usage-reports/artifacts';
import { fetchInclusionSiteRows } from '@/lib/usage-reports/inclusion';
import type { TdxPatientRow } from '@/lib/usage-reports/patient-wifi';
import { resolveReportPeriod } from '@/lib/usage-reports/periods';
import type { ReportPeriodPreset } from '@/lib/usage-reports/types';
import { uploadReportArtifact } from '@/lib/usage-reports/storage';

interface GenerateRequest {
  siteIds?: unknown;
  period?: unknown;
  custom?: { startDate?: unknown; endDate?: unknown };
  includeCsv?: unknown;
  patientRows?: unknown;
  format?: unknown;
}

const PERIOD_PRESETS = new Set<ReportPeriodPreset>([
  'weekly',
  'monthly',
  'sixty_day',
  'custom',
]);

class RequestValidationError extends Error {}

export const runtime = 'nodejs';

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

  let failedJobId: string | null = null;
  try {
    const body = (await request.json()) as GenerateRequest;
    const siteIds = Array.isArray(body.siteIds)
      ? [...new Set(body.siteIds.filter((id): id is string => typeof id === 'string'))]
      : [];
    if (siteIds.length < 1 || siteIds.length > 5) {
      return NextResponse.json(
        { error: 'Sync generation requires 1–5 unique site IDs; use jobs for more than 5' },
        { status: 400 }
      );
    }
    if (typeof body.period !== 'string' || !PERIOD_PRESETS.has(body.period as ReportPeriodPreset)) {
      return NextResponse.json({ error: 'Invalid report period preset' }, { status: 400 });
    }
    const format = body.format ?? 'pdf';
    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json({ error: "format must be 'pdf' or 'excel'" }, { status: 400 });
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
    const supabase = await createClient();
    const rows = await fetchInclusionSiteRows(supabase);
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const artifact = await buildUsageReportArtifact({
      sites: siteIds.map((id) => ({
        id,
        accountNumber: rowsById.get(id)?.account_number ?? id,
      })),
      period,
      patientRows,
      includeCsv: body.includeCsv === true,
      format,
    });

    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();
    const expiresAtIso = new Date(
      createdAt.getTime() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: job, error: insertError } = await supabase
      .from('site_usage_report_jobs')
      .insert({
        created_by: authResult.user.id,
        created_at: createdAtIso,
        updated_at: createdAtIso,
        status: 'succeeded',
        period_preset: period.preset,
        period_start: period.startUtc.toISOString(),
        period_end: period.endUtc.toISOString(),
        site_ids: siteIds,
        include_csv: body.includeCsv === true,
        primary_sources: artifact.primarySources,
        outcome: artifact.outcome,
        content_type: artifact.contentType,
        byte_size: artifact.bytes.length,
        expires_at: expiresAtIso,
      })
      .select('id')
      .single();
    if (insertError || !job) {
      throw new Error(`Failed to create report audit job: ${insertError?.message ?? 'No job returned'}`);
    }
    failedJobId = job.id;

    const storagePath = await uploadReportArtifact(
      supabase,
      `jobs/${job.id}/${artifact.filename}`,
      artifact.bytes,
      artifact.contentType
    );
    const { error: updateError } = await supabase
      .from('site_usage_report_jobs')
      .update({ storage_path: storagePath, updated_at: new Date().toISOString() })
      .eq('id', job.id);
    if (updateError) {
      throw new Error(`Failed to attach report artifact to job: ${updateError.message}`);
    }
    failedJobId = null;

    return new NextResponse(new Uint8Array(artifact.bytes), {
      headers: {
        'Content-Type': artifact.contentType,
        'Content-Disposition': `attachment; filename="${artifact.filename}"`,
        'Content-Length': String(artifact.bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Report-Job-Id': job.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UsageReportsGenerate] Generation failed:', error);
    if (failedJobId) {
      const supabase = await createClient();
      await supabase
        .from('site_usage_report_jobs')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failedJobId);
    }
    const status =
      error instanceof RequestValidationError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json(
      { error: status === 400 ? message : 'Failed to generate usage report' },
      { status }
    );
  }
}
