/**
 * Network Analytics export
 * GET /api/admin/network/analytics/export
 *   ?groupId=&deviceSn=&hours=24|startDate=&endDate=&format=pdf|excel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';
import {
  analyticsExportFilename,
  buildAnalyticsExportModel,
} from '@/lib/network/analytics-export';
import { generateAnalyticsReportPdf } from '@/lib/network/analytics-report-pdf';
import { generateAnalyticsReportExcel } from '@/lib/network/analytics-report-excel';

export const dynamic = 'force-dynamic';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json(
        { error: "format must be 'pdf' or 'excel'" },
        { status: 400 }
      );
    }

    const model = await buildAnalyticsExportModel({
      groupId: searchParams.get('groupId'),
      deviceSn: searchParams.get('deviceSn'),
      hoursRaw: searchParams.get('hours'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!model) {
      return NextResponse.json(
        { error: 'No network group available for export' },
        { status: 404 }
      );
    }

    const supabase = await createClient();
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: authResult.adminUser.id,
      device_sn: model.device?.sn ?? null,
      action: 'analytics_export',
      action_detail: {
        format,
        scope: model.scope,
        groupId: model.group.id,
        period: model.period,
      },
      ip_address: clientIp,
      status: 'success',
    });

    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = analyticsExportFilename({
      scope: model.scope,
      groupName: model.group.name,
      deviceSn: model.device?.sn ?? null,
      period: model.period,
      extension,
    });

    if (format === 'pdf') {
      const buffer = generateAnalyticsReportPdf(model);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const excel = await generateAnalyticsReportExcel(model);
    return new NextResponse(new Uint8Array(excel), {
      headers: {
        'Content-Type': EXCEL_MIME,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    apiLogger.error('Analytics export failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
