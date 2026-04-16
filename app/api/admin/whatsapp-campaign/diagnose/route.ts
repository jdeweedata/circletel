// app/api/admin/whatsapp-campaign/diagnose/route.ts
/**
 * GET /api/admin/whatsapp-campaign/diagnose
 *
 * Diagnostic endpoint to check Zoho Desk connectivity and identify
 * what campaign ticket subjects actually look like, so we can fix
 * the SEARCH_TERMS in fetchAllCampaignTickets().
 *
 * Authentication: Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createCampaignZohoDeskService } from '@/lib/integrations/zoho/desk-campaign-service';
import { createZohoDeskAuthService } from '@/lib/integrations/zoho/auth-service';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CURRENT_SEARCH_TERMS = ['fb.me/', 'lnk.ms/', 'Hello! Can I get more info on this?'];

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();

  // 0. Explicit Zoho Desk auth check — surfaces the real error instead of silently returning []
  const envCheck = {
    ZOHO_CLIENT_ID: !!process.env.ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET: !!process.env.ZOHO_CLIENT_SECRET,
    ZOHO_DESK_REFRESH_TOKEN: !!process.env.ZOHO_DESK_REFRESH_TOKEN,
    ZOHO_REFRESH_TOKEN: !!process.env.ZOHO_REFRESH_TOKEN,
    ZOHO_DESK_ORG_ID: process.env.ZOHO_DESK_ORG_ID ?? '(not set)',
    ZOHO_REGION: process.env.ZOHO_REGION ?? '(not set — defaults to US)',
  };

  let zohoAuthStatus: 'ok' | 'config_error' | 'token_error';
  let zohoAuthError: string | undefined;
  try {
    const authService = createZohoDeskAuthService();
    await authService.getAccessToken();
    zohoAuthStatus = 'ok';
  } catch (err) {
    zohoAuthError = err instanceof Error ? err.message : String(err);
    zohoAuthStatus = zohoAuthError.includes('credentials not configured') ? 'config_error' : 'token_error';
  }

  // If auth is broken, return early with diagnostic — skip API calls that would all fail
  if (zohoAuthStatus !== 'ok') {
    const { count } = await supabase
      .from('campaign_ticket_snapshots')
      .select('*', { count: 'exact', head: true });
    return NextResponse.json({
      zohoAuth: { status: zohoAuthStatus, error: zohoAuthError, envCheck },
      dbSnapshot: { rowCount: count ?? 0 },
      zohoSearchTerms: [],
      recentZohoTickets: [],
      summary: { dbHasData: (count ?? 0) > 0, anySearchTermMatches: false, totalFoundViaCurrentTerms: 0 },
    });
  }

  const campaignService = createCampaignZohoDeskService();

  // 1. Check DB row count
  const { count } = await supabase
    .from('campaign_ticket_snapshots')
    .select('*', { count: 'exact', head: true });
  const dbRowCount = count ?? 0;

  // 2. Test each current search term against Zoho
  const zohoSearchTerms: Array<{ term: string; count: number; sampleSubjects: string[] }> = [];
  for (const term of CURRENT_SEARCH_TERMS) {
    try {
      const tickets = await campaignService.searchTicketsBySubject(term);
      zohoSearchTerms.push({
        term,
        count: tickets.length,
        sampleSubjects: tickets.slice(0, 5).map((t) => t.subject ?? '(no subject)'),
      });
    } catch (err) {
      zohoSearchTerms.push({
        term,
        count: -1,
        sampleSubjects: [`ERROR: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  }

  // 3. Fetch the 15 most recent tickets from Zoho to identify subject patterns
  let recentZohoTickets: Array<{ id: string; subject: string; status: string; createdTime: string }> = [];
  let recentError: string | undefined;
  try {
    recentZohoTickets = await campaignService.fetchRecentTickets(15);
  } catch (err) {
    recentError = `Recent tickets fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    zohoAuth: { status: zohoAuthStatus, envCheck },
    dbSnapshot: { rowCount: dbRowCount },
    zohoSearchTerms,
    recentZohoTickets,
    ...(recentError ? { recentError } : {}),
    summary: {
      dbHasData: dbRowCount > 0,
      anySearchTermMatches: zohoSearchTerms.some((t) => t.count > 0),
      totalFoundViaCurrentTerms: zohoSearchTerms.reduce((sum, t) => sum + Math.max(t.count, 0), 0),
    },
  });
}
