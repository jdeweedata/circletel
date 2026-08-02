import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { assembleSiteUsageReport } from '@/lib/usage-reports/assemble-report';
import { fetchInclusionSiteRows } from '@/lib/usage-reports/inclusion';
import {
  isTdxPatientRow,
  patientRowForSite,
  type TdxPatientRow,
} from '@/lib/usage-reports/patient-wifi';
import { resolveReportPeriod } from '@/lib/usage-reports/periods';
import type { ReportPeriodPreset } from '@/lib/usage-reports/types';

/**
 * Read-only preview of a single site's usage report.
 *
 * Returns the same `SiteUsageReportModel` the PDF renders from, so the dashboard
 * and the downloaded document can never disagree on figures. Writes nothing —
 * no `site_usage_report_jobs` row and no stored artifact, because nothing has
 * left the building yet (map #687 decision 4; audit intent from #668).
 *
 * POST rather than GET: uploaded TDX patient rows are a body, not a query
 * string, and the same shape must serve a 26-row Unjani upload.
 */

interface PreviewRequest {
  siteId?: unknown;
  period?: unknown;
  custom?: { startDate?: unknown; endDate?: unknown };
  patientRows?: unknown;
}

const PERIOD_PRESETS = new Set<ReportPeriodPreset>([
  'weekly',
  'monthly',
  'sixty_day',
  'custom',
]);

class RequestValidationError extends Error {}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const body = (await request.json()) as PreviewRequest;

    if (typeof body.siteId !== 'string' || body.siteId.trim() === '') {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }
    if (
      typeof body.period !== 'string' ||
      !PERIOD_PRESETS.has(body.period as ReportPeriodPreset)
    ) {
      return NextResponse.json(
        { error: 'Invalid report period preset' },
        { status: 400 }
      );
    }

    const patientRows: TdxPatientRow[] = Array.isArray(body.patientRows)
      ? body.patientRows.filter(isTdxPatientRow)
      : [];
    if (
      Array.isArray(body.patientRows) &&
      patientRows.length !== body.patientRows.length
    ) {
      return NextResponse.json(
        { error: 'Invalid patientRows payload' },
        { status: 400 }
      );
    }

    const custom =
      typeof body.custom?.startDate === 'string' &&
      typeof body.custom?.endDate === 'string'
        ? { startDate: body.custom.startDate, endDate: body.custom.endDate }
        : undefined;

    let period: ReturnType<typeof resolveReportPeriod>;
    try {
      period = resolveReportPeriod(
        body.period as ReportPeriodPreset,
        new Date(),
        custom
      );
    } catch (error) {
      throw new RequestValidationError(
        error instanceof Error ? error.message : 'Invalid report period'
      );
    }

    const siteId = body.siteId;
    const supabase = await createClient();
    const siteRow = (await fetchInclusionSiteRows(supabase)).find(
      (row) => row.id === siteId
    );

    const result = await assembleSiteUsageReport({
      siteId,
      period,
      patientRow: siteRow
        ? patientRowForSite(patientRows, siteRow.account_number)
        : null,
    });

    if (!result.ok) {
      // A site with no permitted source is a legitimate answer, not a failure:
      // 200 with the diagnosis so the dashboard can name each cause and its
      // unlock step (#689) instead of rendering an error.
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          siteId: result.siteId,
          siteLabel: result.siteLabel,
          diagnosis: result.diagnosis ?? null,
          period: {
            preset: period.preset,
            label: period.label,
            rangeLabel: period.rangeLabel,
          },
        },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      { ok: true, model: result.model },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UsageReportsPreview] Preview failed:', error);
    const status =
      error instanceof RequestValidationError || error instanceof SyntaxError
        ? 400
        : 500;
    return NextResponse.json(
      { error: status === 400 ? message : 'Failed to build report preview' },
      { status }
    );
  }
}
