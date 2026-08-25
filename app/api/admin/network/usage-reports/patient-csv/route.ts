import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { parseTdxPatientCsv } from '@/lib/usage-reports/patient-wifi';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
      return NextResponse.json(
        { error: 'Patient CSV must not exceed 2MB' },
        { status: 413 }
      );
    }
    const formData = await request.formData();
    const value = formData.get('file');
    if (!value || typeof value === 'string') {
      return NextResponse.json({ error: 'A CSV file is required' }, { status: 400 });
    }
    if (value.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Patient CSV must not exceed 2MB' },
        { status: 413 }
      );
    }
    const isCsv =
      value.type === 'text/csv' || value.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      return NextResponse.json({ error: 'The uploaded file must be a CSV' }, { status: 415 });
    }

    const rows = parseTdxPatientCsv(await value.text());
    const hasInvalidMetrics = rows.some(
      (row) =>
        !Number.isFinite(row.uniqueUsers) ||
        !Number.isFinite(row.loginSessions) ||
        !Number.isFinite(row.downloadGb) ||
        row.uniqueUsers < 0 ||
        row.loginSessions < 0 ||
        row.downloadGb < 0
    );
    if (hasInvalidMetrics) {
      return NextResponse.json(
        { error: 'Patient CSV contains invalid or negative metrics' },
        { status: 400 }
      );
    }
    return NextResponse.json({ rows });
  } catch (error) {
    console.error('[UsageReportsPatientCsv] Failed to parse upload:', error);
    return NextResponse.json({ error: 'Failed to parse patient CSV' }, { status: 400 });
  }
}
