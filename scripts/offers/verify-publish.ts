import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import { publishFromUnified } from '@/lib/offers/publisher';
import { createClient } from '@/lib/supabase/server';

async function main() {
  // Take one active service package via the unified read model.
  const { products } = await unifiedProductAggregator.aggregateAll({
    source: 'CircleTel', status: 'active', page: 1, perPage: 1,
  } as any);
  if (!products.length) throw new Error('No active CircleTel products to publish');

  const offerId = await publishFromUnified(products[0]);
  console.log('Published offerId:', offerId, 'from', products[0].uid);

  const supabase = await createClient();
  const { data: snap, error } = await supabase
    .from('offer_pricing_snapshot')
    .select('*')
    .eq('offer_id', offerId)
    .single();
  if (error || !snap) throw new Error('No snapshot written');
  console.log('Snapshot:', JSON.stringify(snap, null, 2));
  if (typeof snap.margin_pct !== 'number') throw new Error('margin_pct missing');
  console.log('VERIFY OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
