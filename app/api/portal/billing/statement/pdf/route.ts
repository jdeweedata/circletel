import { NextRequest, NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import { assembleCorporateStatementData } from '@/lib/billing/corporate-statement-data';
import { generateStatementPDFBuffer } from '@/lib/billing/statement-pdf-generator';
import { parsePortalStatementOptions, pdfDisposition } from '@/lib/portal/billing-period';

export async function GET(request: NextRequest) {
  const auth = await requirePortalCapability('billing.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const searchParams = new URL(request.url).searchParams;
  const options = parsePortalStatementOptions(searchParams);
  const disposition = pdfDisposition(searchParams.get('disposition'));

  try {
    const { statement } = await assembleCorporateStatementData(
      adminDb,
      portalUser.organisation_id,
      options
    );

    const pdfBuffer = generateStatementPDFBuffer(statement);
    const month = searchParams.get('month');
    const period = searchParams.get('period');
    const suffix = month || period || statement.statementDate;
    const filename = `statement-${portalUser.organisation_code || 'org'}-${suffix}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
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
