/**
 * Promote Esquire G5C as a deal-addon-only storefront SKU.
 *
 * Standalone Promote floor is R3,065. Cash CPE sells at R2,999.99 with an
 * explicit MD exception and is excluded from /products/hardware.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/promote-g5c-cash-cpe.ts
 */

import { createClient } from '@supabase/supabase-js';
import { FIVE_G_CASH_CPE_PRICE_INCL_VAT } from '../lib/products/five-g-cash-cpe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SLUG = 'zte-g5c';
const IMAGE_URL = '/images/hardware/cpe/zte-g5c.png';

async function main() {
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, code')
    .eq('code', 'ESQUIRE')
    .maybeSingle();

  if (supplierError || !supplier) {
    throw new Error(`Esquire supplier not found: ${supplierError?.message}`);
  }

  const { data: feedRows, error: feedError } = await supabase
    .from('supplier_products')
    .select('id, sku, name, cost_price, source_image_url, in_stock, stock_total, is_active')
    .eq('supplier_id', supplier.id)
    .eq('sku', 'G5C')
    .eq('is_active', true);

  if (feedError) throw new Error(feedError.message);

  const cleanRow = (feedRows || []).find((row) => row.sku === 'G5C' && !String(row.sku).includes('CDATA'));
  if (!cleanRow) {
    throw new Error('Clean Esquire G5C supplier_products row not found');
  }

  const metadata = {
    cash_cpe: true,
    deal_addon_only: true,
    supplier_sku: 'G5C',
    md_exception: true,
    md_exception_reason: 'Deal-addon cash CPE priced at R2,999.99 incl VAT. Not a shop SKU.',
    lead_time_business_days: { min: 5, max: 7 },
  };

  const { data: existing } = await supabase
    .from('circletel_hardware_products')
    .select('id')
    .eq('slug', SLUG)
    .maybeSingle();

  const fields = {
    name: 'ZTE G5C 5G CPE WiFi Router',
    slug: SLUG,
    description:
      'Approved 5G router for month-to-month SIM-only deals. Paid once-off. Lead time 5–7 business days.',
    category: 'CPE',
    image_url: IMAGE_URL,
    retail_price: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
    cost_price: Number(cleanRow.cost_price) || 1999,
    status: 'published',
    is_featured: false,
    primary_supplier_code: 'ESQUIRE',
    metadata,
    published_at: new Date().toISOString(),
    warranty_months: 12,
  };

  let hardwareId = existing?.id;
  if (hardwareId) {
    const { error } = await supabase
      .from('circletel_hardware_products')
      .update(fields)
      .eq('id', hardwareId);
    if (error) throw new Error(`Update failed: ${error.message}`);
  } else {
    const { data: created, error } = await supabase
      .from('circletel_hardware_products')
      .insert(fields)
      .select('id')
      .single();
    if (error || !created) throw new Error(`Insert failed: ${error?.message}`);
    hardwareId = created.id;
  }

  const { data: link } = await supabase
    .from('hardware_product_suppliers')
    .select('id')
    .eq('hardware_product_id', hardwareId)
    .eq('supplier_product_id', cleanRow.id)
    .maybeSingle();

  if (!link) {
    const { error: linkError } = await supabase.from('hardware_product_suppliers').insert({
      hardware_product_id: hardwareId,
      supplier_product_id: cleanRow.id,
      supplier_cost: Number(cleanRow.cost_price) || 1999,
      is_preferred: true,
      last_synced_cost: Number(cleanRow.cost_price) || 1999,
      cost_updated_at: new Date().toISOString(),
    });
    if (linkError) throw new Error(`Supplier link failed: ${linkError.message}`);
  }

  const { data: terms } = await supabase
    .from('hardware_product_terms')
    .select('id')
    .eq('hardware_product_id', hardwareId)
    .maybeSingle();

  if (!terms) {
    const { error: termsError } = await supabase.from('hardware_product_terms').insert({
      hardware_product_id: hardwareId,
      warranty_period: '12 months manufacturer warranty',
      return_policy: '7-day return for defects',
      delivery_estimate: '5–7 business days',
      is_back_to_back: true,
      source_supplier_code: 'ESQUIRE',
      effective_from: new Date().toISOString(),
    });
    if (termsError) throw new Error(`Terms insert failed: ${termsError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        hardware_product_id: hardwareId,
        slug: SLUG,
        supplier_product_id: cleanRow.id,
        sku: 'G5C',
        retail_price: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
        deal_addon_only: true,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
