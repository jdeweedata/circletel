import { NextRequest, NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import { assembleCorporateStatementData } from '@/lib/billing/corporate-statement-data';
import type { StatementOptions } from '@/lib/billing/statement-data';

export async function GET(request: NextRequest) {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  // Site users can view org billing (existing portal behaviour); Super User + site_user
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
