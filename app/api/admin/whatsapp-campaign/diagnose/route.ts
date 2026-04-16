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
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CURRENT_SEARCH_TERMS = ['fb.me/', 'lnk.ms/', 'Hello! Can I get more info on this?'];

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const campaignService = createCampaignZohoDeskService();
  const supabase = await createClient();

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
