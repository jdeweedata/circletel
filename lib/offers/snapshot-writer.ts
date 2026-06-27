import { createClient } from '@/lib/supabase/server';
import type { OfferPricingSnapshotInput } from '@/lib/types/offer';

export async function writeSnapshot(
  offerId: string,
  input: OfferPricingSnapshotInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('offer_pricing_snapshot')
    .upsert(
      {
        offer_id: offerId,
        resolved_price: input.resolvedPrice,
        cost_buildup: input.costBuildup,
        total_cost: input.totalCost,
        margin_pct: input.marginPct,
        guardrail_status: input.guardrailStatus,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'offer_id' },
    );
  if (error) throw new Error(`writeSnapshot failed for ${offerId}: ${error.message}`);
}
