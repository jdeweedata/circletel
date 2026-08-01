import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  fetchInclusionSiteRows,
  filterEligibleSites,
} from '@/lib/usage-reports/inclusion';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const includeProvisioned =
      request.nextUrl.searchParams.get('includeProvisioned') === '1';
    const unjaniOnly = request.nextUrl.searchParams.get('unjaniOnly') === '1';
    const supabase = await createClient();
    const rows = await fetchInclusionSiteRows(supabase);
    const sites = filterEligibleSites(rows, { includeProvisioned, unjaniOnly });

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('[UsageReportsSites] Failed to list sites:', error);
    return NextResponse.json({ error: 'Failed to load eligible sites' }, { status: 500 });
  }
}
