import { createClient } from '@/lib/supabase/server';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import { writeSnapshot } from '@/lib/offers/snapshot-writer';
import type { UnifiedProduct, UnifiedProductSourceTable } from '@/lib/types/unified-product';
import type { OfferDraft, OfferSourceType, OfferCustomerType } from '@/lib/types/offer';

const SOURCE_TABLE_TO_OFFER_TYPE: Record<UnifiedProductSourceTable, OfferSourceType> = {
  admin_products: 'service_package',
  service_packages: 'service_package',
  mtn_dealer_products: 'mtn_deal',
  circletel_hardware_products: 'hardware',
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readCustomerType(raw: Record<string, unknown>): OfferCustomerType {
  const v = typeof raw.customer_type === 'string' ? raw.customer_type : '';
  if (v === 'consumer' || v === 'business' || v === 'both') return v;
  return 'both';
}

export function buildOfferDraftFromUnified(u: UnifiedProduct): OfferDraft {
  const raw = (u.raw ?? {}) as Record<string, unknown>;
  const sourceType = SOURCE_TABLE_TO_OFFER_TYPE[u.sourceTable];
  const slug = typeof raw.slug === 'string' && raw.slug.length > 0 ? raw.slug : slugify(u.name);

  return {
    slug,
    title: u.name,
    customerType: readCustomerType(raw),
    basePrice: u.price,
    channelVisibility: ['direct'],
    sourceUid: u.uid,
    sourceUpdatedAt: u.updatedAt,
    components: [
      {
        sourceType,
        sourceId: u.id,
        qty: 1,
        role: 'primary',
        unitCost: u.cost,
        unitPrice: u.price,
        label: u.name,
      },
    ],
  };
}

export async function persistOfferDraft(draft: OfferDraft): Promise<string> {
  const supabase = await createClient();

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .upsert(
      {
        slug: draft.slug,
        title: draft.title,
        customer_type: draft.customerType,
        channel_visibility: draft.channelVisibility,
        base_price: draft.basePrice,
        source_uid: draft.sourceUid,
        lifecycle_state: 'active',
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source_uid' },
    )
    .select('id')
    .single();
  if (offerErr || !offer) throw new Error(`persist offer failed: ${offerErr?.message}`);

  const offerId = offer.id as string;

  // Replace components (idempotent republish).
  const { error: delErr } = await supabase
    .from('offer_components')
    .delete()
    .eq('offer_id', offerId);
  if (delErr) throw new Error(`clear components failed: ${delErr.message}`);

  const rows = draft.components.map((c, i) => ({
    offer_id: offerId,
    source_type: c.sourceType,
    source_id: c.sourceId,
    qty: c.qty,
    role: c.role,
    unit_cost: c.unitCost,
    unit_price: c.unitPrice,
    label: c.label,
    position: i,
  }));
  const { error: insErr } = await supabase.from('offer_components').insert(rows);
  if (insErr) throw new Error(`insert components failed: ${insErr.message}`);

  return offerId;
}

export async function publishFromUnified(
  u: UnifiedProduct,
  opts: { marginFloorPct?: number } = {},
): Promise<string> {
  const draft = buildOfferDraftFromUnified(u);
  const offerId = await persistOfferDraft(draft);
  const snapshot = resolveOfferPricing(draft, opts);
  await writeSnapshot(offerId, snapshot);
  return offerId;
}
