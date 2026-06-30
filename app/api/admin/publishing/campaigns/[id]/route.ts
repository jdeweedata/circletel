import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  buildCampaignSlotInserts,
  buildCampaignUpdate,
  type CampaignOfferSelection,
} from '@/lib/publishing/admin';

export const dynamic = 'force-dynamic';

const ADMIN_CAMPAIGN_SELECT =
  '*,campaign_offer_slots(id,position,label,badge,cta_label,offer_id,offers(id,slug,title,status,lifecycle_state))';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select(ADMIN_CAMPAIGN_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, campaign: data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = await createClient();

    const update = buildCampaignUpdate({
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

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !campaign) {
      return NextResponse.json(
        { success: false, error: error?.message ?? 'Campaign not found' },
        { status: error ? 500 : 404 },
      );
    }

    if (Array.isArray(body.offers)) {
      await supabase.from('campaign_offer_slots').delete().eq('campaign_id', id);
      const slots = buildCampaignSlotInserts(id, body.offers as CampaignOfferSelection[]);
      const { error: slotError } = await supabase.from('campaign_offer_slots').insert(slots);
      if (slotError) {
        return NextResponse.json({ success: false, error: slotError.message }, { status: 500 });
      }
    }

    await supabase.from('publishing_events').insert({
      entity_type: 'campaign',
      entity_id: id,
      event_type: body.status === 'published' ? 'published' : 'updated',
      actor_id: authResult.adminUser.id,
      notes: 'Campaign updated from Product Publishing Studio',
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid campaign payload';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
