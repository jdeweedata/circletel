import { NextRequest, NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import { assembleCorporateStatementData } from '@/lib/billing/corporate-statement-data';
import { parsePortalStatementOptions } from '@/lib/portal/billing-period';

export async function GET(request: NextRequest) {
  const auth = await requirePortalCapability('billing.read');
  if (!auth.ok) return auth.response;

  // Site users can view org billing (existing portal behaviour); Super User + site_user
  const { portalUser, adminDb } = auth;
  const options = parsePortalStatementOptions(new URL(request.url).searchParams);

  try {
    const { statement, organisationName } = await assembleCorporateStatementData(
      adminDb,
      portalUser.organisation_id,
      options
    );

    return NextResponse.json({
      success: true,
      statement,
      organisation: { name: organisationName, id: portalUser.organisation_id },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Portal /billing/statement]', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate statement' },
      { status: 500 }
    );
  }
}
