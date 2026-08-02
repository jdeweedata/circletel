/**
 * Device Report Export API
 * GET /api/ruijie/devices/[sn]/export?hours=24&format=pdf|excel
 *
 * Streams a full device dossier — summary, traffic window, clients, logs —
 * as a PDF or Excel attachment. Data is gathered server-side via the same
 * lib/ruijie functions the tab APIs use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  buildDeviceExportModel,
  clampHours,
  exportFilename,
} from '@/lib/ruijie/device-export';
import { generateDeviceReportPdf } from '@/lib/ruijie/device-report-pdf';
import { generateDeviceReportExcel } from '@/lib/ruijie/device-report-excel';

export const dynamic = 'force-dynamic';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;

    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check (bypasses RLS)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    if (format !== 'pdf' && format !== 'excel') {
      return NextResponse.json(
        { error: "format must be 'pdf' or 'excel'" },
        { status: 400 }
      );
    }
    const hours = clampHours(Number(searchParams.get('hours')));

    const model = await buildDeviceExportModel(sn, hours);
    if (!model) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Audit log — same pattern as the manual sync trigger
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    await supabaseAdmin.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: sn,
      action: 'export',
      action_detail: { format, hours },
      ip_address: clientIp,
      status: 'success',
    });

    if (format === 'pdf') {
      const pdf = generateDeviceReportPdf(model);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${exportFilename(sn, hours, 'pdf')}"`,
          'Content-Length': String(pdf.byteLength),
          'Cache-Control': 'private, no-store',
        },
      });
    }

    const workbook = await generateDeviceReportExcel(model);
    return new NextResponse(new Uint8Array(workbook), {
      status: 200,
      headers: {
        'Content-Type': EXCEL_MIME,
        'Content-Disposition': `attachment; filename="${exportFilename(sn, hours, 'xlsx')}"`,
        'Content-Length': String(workbook.byteLength),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    apiLogger.error('Ruijie device export API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to generate device report' }, { status: 500 });
  }
}
