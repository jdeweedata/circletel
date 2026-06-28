// scripts/offers/verify-storefront.ts
// Run against a RUNNING server. Override with OFFERS_VERIFY_BASE_URL (e.g. https://www.circletel.co.za).
const BASE = process.env.OFFERS_VERIFY_BASE_URL ?? 'http://localhost:3000';
const FORBIDDEN = ['resolved_price', 'priceExclVat', 'total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'source_type'];

function assertNoLeak(label: string, payload: string) {
  for (const k of FORBIDDEN) {
    if (payload.includes(k)) throw new Error(`LEAK: forbidden key "${k}" present in ${label}`);
  }
}

async function getJson(path: string): Promise<{ status: number; text: string; json: any }> {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  return { status: res.status, text, json: text ? JSON.parse(text) : null };
}

async function main() {
  const list = await getJson('/api/offers?segment=all');
  if (list.status !== 200) throw new Error(`GET /api/offers -> ${list.status}`);
  const offers = list.json.offers as Array<{ slug: string; priceInclVat: number; vatLabel: string }>;
  console.log(`GET /api/offers -> 200, ${offers.length} offer(s)`);
  if (offers.length === 0) throw new Error('No public offers — publish at least one active service_packages offer first');
  assertNoLeak('list response', list.text);

  const first = offers[0];
  if (typeof first.priceInclVat !== 'number' || first.vatLabel !== 'incl. VAT') {
    throw new Error('VAT contract violated on list output');
  }

  const detail = await getJson(`/api/offers/${encodeURIComponent(first.slug)}`);
  if (detail.status !== 200) throw new Error(`GET /api/offers/${first.slug} -> ${detail.status}`);
  assertNoLeak('detail response', detail.text);
  console.log('Detail:', JSON.stringify(detail.json.offer, null, 2));

  // Negative check: an unknown slug must 404, not leak.
  const missing = await getJson('/api/offers/__definitely_not_a_real_slug__');
  if (missing.status !== 404) throw new Error(`expected 404 for unknown slug, got ${missing.status}`);

  console.log('VERIFY OK — VAT-inclusive, no leakage, 404 on unknown');
}
main().catch((e) => { console.error(e); process.exit(1); });
