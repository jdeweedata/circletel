/**
 * Recompute Offer Pricing Inngest Function
 *
 * Recomputes pricing snapshots for offers when components change,
 * triggered by source updates or manual reconciliation.
 */

import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import { writeSnapshot } from '@/lib/offers/snapshot-writer';
import type { OfferDraft, OfferComponentDraft, OfferSourceType, OfferComponentRole } from '@/lib/types/offer';

/**
 * Load offer draft with all components
 */
async function loadDraft(offerId: string): Promise<OfferDraft | null> {
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from('offers')
    .select('id, slug, title, customer_type, channel_visibility, base_price, source_uid, updated_at')
    .eq('id', offerId)
    .single();
  if (!offer) return null;

  const { data: comps } = await supabase
    .from('offer_components')
    .select('source_type, source_id, qty, role, unit_cost, unit_price, label')
    .eq('offer_id', offerId)
    .order('position', { ascending: true });

  const components: OfferComponentDraft[] = (comps ?? []).map((c) => ({
    sourceType: c.source_type as OfferSourceType,
    sourceId: String(c.source_id),
    qty: c.qty as number,
    role: c.role as OfferComponentRole,
    unitCost: Number(c.unit_cost),
    unitPrice: Number(c.unit_price),
    label: c.label as string,
  }));

  return {
    slug: offer.slug,
    title: offer.title,
    customerType: offer.customer_type,
    basePrice: Number(offer.base_price),
    channelVisibility: (offer.channel_visibility as string[]) ?? ['direct'],
    sourceUid: offer.source_uid ?? '',
    sourceUpdatedAt: offer.updated_at ?? null,
    components,
  };
}

export const recomputeOfferPricing = inngest.createFunction(
  {
    id: 'recompute-offer-pricing',
    name: 'Recompute Offer Pricing Snapshot',
    retries: 2,
  },
  { event: 'offer/pricing.recompute.requested' },
  async ({ event, step }) => {
    const { offerId, all, triggeredBy } = event.data;

    // Resolve which offers to recompute
    const ids = await step.run('resolve-target-ids', async () => {
      if (offerId) return [offerId];
      if (all) {
        const supabase = await createClient();
        const { data } = await supabase
          .from('offers')
          .select('id')
          .eq('status', 'active');
        return (data ?? []).map((r) => r.id as string);
      }
      return [];
    });

    let recomputed = 0;
    let failed = 0;

    // Recompute pricing for each offer
    for (const id of ids) {
      try {
        await step.run(`recompute-${id}`, async () => {
          const draft = await loadDraft(id);
          if (!draft) throw new Error(`offer ${id} not found`);
          const snapshot = resolveOfferPricing(draft);
          await writeSnapshot(id, snapshot);
        });
        recomputed++;
      } catch {
        failed++;
      }
    }

    // Send completion event
    await step.sendEvent('recompute-completed', {
      name: 'offer/pricing.recompute.completed',
      data: {
        recomputed,
        failed,
        triggeredBy: triggeredBy ?? 'manual',
      },
    });

    return { recomputed, failed };
  }
);
