// app/api/admin/whatsapp-campaign/report/route.ts
/**
 * GET /api/admin/whatsapp-campaign/report
 *
 * Query params:
 *   ?date=YYYY-MM-DD   — fetch snapshot for a specific date (default: today)
 *   ?live=true         — bypass Supabase cache, re-run against Zoho Desk live
 *
 * Authentication: Admin (service role via authenticateAdmin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  createCampaignZohoDeskService,
  ConversationIntelligence,
} from '@/lib/integrations/zoho/desk-campaign-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const isLive = searchParams.get('live') === 'true';

  const reportDate = dateParam ?? new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  // Live mode: re-fetch from Zoho and return enriched tickets (no DB write)
  if (isLive) {
    const campaignService = createCampaignZohoDeskService();
    const allTickets = await campaignService.fetchAllCampaignTickets();

    const ticketData = await Promise.allSettled(
      allTickets.map(async (ticket) => {
        const conversations = await campaignService.fetchConversations(ticket.id);
        const ci = new ConversationIntelligence(conversations, ticket.status);
        const profile = ci.extractLeadProfile();
        const insightStatus = ci.deriveInsightStatus({ isSigned_up: false });
        return { ticket, conversations, profile, insightStatus };
      })
    );

    const tickets = ticketData
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ ticket: typeof allTickets[number]; conversations: Awaited<ReturnType<typeof campaignService.fetchConversations>>; profile: ReturnType<InstanceType<typeof ConversationIntelligence>['extractLeadProfile']>; insightStatus: ReturnType<InstanceType<typeof ConversationIntelligence>['deriveInsightStatus']> }>).value);

    return NextResponse.json({
      snapshot: null,
      tickets,
      generatedAt: new Date().toISOString(),
      isLive: true,
    });
  }

  // Standard mode: read from Supabase
  const [snapshotResult, ticketsResult] = await Promise.all([
    supabase
      .from('campaign_report_snapshots')
      .select('*')
      .eq('report_date', reportDate)
      .maybeSingle(),
    supabase
      .from('campaign_ticket_snapshots')
      .select('*')
      .order('zoho_created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    snapshot: snapshotResult.data ?? null,
    tickets: ticketsResult.data ?? [],
    generatedAt: snapshotResult.data?.generated_at ?? new Date().toISOString(),
    isLive: false,
  });
}
