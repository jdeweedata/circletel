import { NextRequest, NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import { assembleCorporateStatementData } from '@/lib/billing/corporate-statement-data';
import { generateStatementPDFBuffer } from '@/lib/billing/statement-pdf-generator';
import type { StatementOptions } from '@/lib/billing/statement-data';

export async function GET(request: NextRequest) {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const { searchParams } = new URL(request.url);

  const options: StatementOptions = {};
  const period = searchParams.get('period');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (from && to) {
    options.from = from;
    options.to = to;
  } else if (period === '3m' || period === '6m' || period === '12m' || period === 'all') {
    options.period = period;
  } else {
    options.period = '12m';
  }

  try {
    const { statement } = await assembleCorporateStatementData(
      adminDb,
      portalUser.organisation_id,
      options
    );

    const pdfBuffer = generateStatementPDFBuffer(statement);
    const filename = `statement-${portalUser.organisation_code || 'org'}-${statement.statementDate}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Portal /billing/statement/pdf]', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate statement PDF' },
      { status: 500 }
    );
  }
}
