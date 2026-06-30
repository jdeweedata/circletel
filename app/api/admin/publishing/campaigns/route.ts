import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  buildCampaignInsert,
  buildCampaignSlotInserts,
  type CampaignOfferSelection,
} from '@/lib/publishing/admin';

export const dynamic = 'force-dynamic';

const ADMIN_CAMPAIGN_SELECT =
  '*,campaign_offer_slots(id,position,label,badge,cta_label,offer_id,offers(id,slug,title,status,lifecycle_state))';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const pageType = searchParams.get('page_type');

  let query = supabase
    .from('campaigns')
    .select(ADMIN_CAMPAIGN_SELECT, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') query = query.eq('status', status);
  if (pageType && pageType !== 'all') query = query.eq('page_type', pageType);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, campaigns: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const supabase = await createClient();
    const body = await request.json();
    const offers = Array.isArray(body.offers) ? body.offers as CampaignOfferSelection[] : [];

    const campaignInsert = buildCampaignInsert({
      title: body.title,
      slug: body.slug,
      pageType: body.pageType,
      template: body.template,
      status: body.status,
      summary: body.summary,
      content: body.content,
      seo: body.seo,
      channelVisibility: body.channelVisibility,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      actorId: authResult.adminUser.id,
    });

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(campaignInsert)
      .select('*')
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: campaignError?.message ?? 'Failed to create campaign' },
        { status: 500 },
      );
    }

    const slots = buildCampaignSlotInserts(campaign.id as string, offers);
    const { error: slotsError } = await supabase.from('campaign_offer_slots').insert(slots);
    if (slotsError) {
      await supabase.from('campaigns').delete().eq('id', campaign.id);
      return NextResponse.json({ success: false, error: slotsError.message }, { status: 500 });
    }

    await supabase.from('publishing_events').insert({
      entity_type: 'campaign',
      entity_id: campaign.id,
      event_type: campaign.status === 'published' ? 'published' : 'created',
      actor_id: authResult.adminUser.id,
      notes: 'Campaign created from Product Publishing Studio',
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid campaign payload';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
