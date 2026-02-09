import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MTNDealerTechnology, MTNDealerContractTerm } from '@/lib/types/mtn-dealer-products';
import { apiLogger } from '@/lib/logging/logger';

interface ImportPromo {
  deal_id: string;
  promo_start_date_mm_dd_yyyy: string;
  promo_end_date_mm_dd_yyyy: string;
  oem_and_device: string;
  freebies_description_1_devices: string | null;
  freebie_description_2_priceplan: string | null;
  total_subscription_incl_vat: number;
  total_subscription_ex_vat: number;
  once_off_pay_in_incl_vat: number;
  device_status: string;
  price_plan: string;
  eppix_package: string;
  eppix_tariff: string;
  package_description: string;
  tariff_description: string;
  contract_term: number;
  free_sim: string;
  free_cli: string;
  free_itb: string;
  on_net_minute_bundle: string;
  anytime_minute_bundle: string;
  sms_bundle: string;
  data_bundle: string;
  bundle_description: string | null;
  inclusive_price_plan_minutes: string;
  inclusive_price_plan_data: string;
  inclusive_price_plan_sms: string;
  inclusive_price_plan_in_group_calling: string;
  inclusive_price_plan_on_net_minutes: string;
  ebu_inventory_status: string;
  channel: string;
  available_on_helios: string;
  available_on_ilula: string;
}

// Helper to detect technology from price plan name
function detectTechnology(pricePlan: string, tariffDescription: string): MTNDealerTechnology {
  const combined = `${pricePlan} ${tariffDescription}`.toLowerCase();
  if (combined.includes('5g')) {
    return '5G';
  }
  if (combined.includes('lte') && combined.includes('5g')) {
    return 'LTE/5G';
  }
  // Default to LTE for most MTN business plans
  return 'LTE';
}

// Helper to parse bundle value
function parseBundleValue(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/([0-9]+\.?[0-9]*)/);
  return match ? parseFloat(match[1]) : null;
}

// Helper to normalize contract term
function normalizeContractTerm(term: number): MTNDealerContractTerm {
  if (term === 0 || term === 1) return 0; // Month-to-month
  if (term === 12) return 12;
  if (term === 24) return 24;
  if (term === 36) return 36;
  // Default to 24 for unknown terms
  return 24;
}

// POST /api/admin/mtn-dealer-products/import - Bulk import products
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { promos, source_file, filters } = body as {
      promos: ImportPromo[];
      source_file: string;
      filters?: {
        contract_terms?: number[];
        has_device?: boolean;
        min_price?: number;
        max_price?: number;
        available_on_helios?: boolean;
        available_on_ilula?: boolean;
        current_deals_only?: boolean;
      };
    };

    if (!promos || !Array.isArray(promos)) {
      return NextResponse.json(
        { success: false, error: 'Invalid promos data' },
        { status: 400 }
      );
    }

    // Create import batch
    const batch_id = `IMPORT-${Date.now()}`;
    const { data: batch, error: batchError } = await supabase
      .from('mtn_dealer_import_batches')
      .insert({
        batch_id,
        source_file: source_file || 'Unknown',
        total_records: promos.length,
        imported_records: 0,
        skipped_records: 0,
        error_records: 0,
        status: 'processing',
      })
      .select()
      .single();

    if (batchError) {
      apiLogger.error('[MTN Import] Batch creation error', { error: batchError });
    }

    let imported = 0;
    let skipped = 0;
    let errors: { deal_id: string; error: string }[] = [];

    // Apply filters
    let filteredPromos = promos;

    if (filters) {
      if (filters.contract_terms && filters.contract_terms.length > 0) {
        filteredPromos = filteredPromos.filter(p => filters.contract_terms!.includes(p.contract_term));
      }
      if (filters.has_device !== undefined) {
        filteredPromos = filteredPromos.filter(p =>
          filters.has_device ? p.oem_and_device !== 'Use Your Own' : p.oem_and_device === 'Use Your Own'
        );
      }
      if (filters.min_price !== undefined) {
        filteredPromos = filteredPromos.filter(p => p.total_subscription_incl_vat >= filters.min_price!);
      }
      if (filters.max_price !== undefined) {
        filteredPromos = filteredPromos.filter(p => p.total_subscription_incl_vat <= filters.max_price!);
      }
      if (filters.available_on_helios) {
        filteredPromos = filteredPromos.filter(p => p.available_on_helios === 'Yes');
      }
      if (filters.available_on_ilula) {
        filteredPromos = filteredPromos.filter(p => p.available_on_ilula === 'Yes');
      }
      if (filters.current_deals_only) {
        const today = new Date().toISOString().split('T')[0];
        filteredPromos = filteredPromos.filter(p =>
          p.promo_start_date_mm_dd_yyyy <= today &&
          (!p.promo_end_date_mm_dd_yyyy || p.promo_end_date_mm_dd_yyyy >= today)
        );
      }
    }

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < filteredPromos.length; i += batchSize) {
      const promoBatch = filteredPromos.slice(i, i + batchSize);

      const productsToInsert = promoBatch.map(promo => {
        const hasDevice = promo.oem_and_device !== 'Use Your Own';

        return {
          deal_id: promo.deal_id,
          eppix_package: promo.eppix_package || null,
          eppix_tariff: promo.eppix_tariff || null,
          price_plan: promo.price_plan,
          package_description: promo.package_description || null,
          tariff_description: promo.tariff_description || null,
          technology: detectTechnology(promo.price_plan, promo.tariff_description || ''),
          contract_term: normalizeContractTerm(promo.contract_term),
          has_device: hasDevice,
          device_name: hasDevice ? promo.oem_and_device : null,
          device_status: promo.device_status || null,
          once_off_pay_in_incl_vat: promo.once_off_pay_in_incl_vat || 0,
          mtn_price_incl_vat: promo.total_subscription_incl_vat,
          mtn_price_excl_vat: promo.total_subscription_ex_vat,
          markup_type: 'percentage',
          markup_value: 0,
          data_bundle: promo.data_bundle || null,
          data_bundle_gb: parseBundleValue(promo.data_bundle),
          anytime_minutes: promo.anytime_minute_bundle || null,
          anytime_minutes_value: parseBundleValue(promo.anytime_minute_bundle),
          on_net_minutes: promo.on_net_minute_bundle || null,
          on_net_minutes_value: parseBundleValue(promo.on_net_minute_bundle),
          sms_bundle: promo.sms_bundle || null,
          sms_bundle_value: parseBundleValue(promo.sms_bundle),
          inclusive_minutes: promo.inclusive_price_plan_minutes || null,
          inclusive_data: promo.inclusive_price_plan_data || null,
          inclusive_sms: promo.inclusive_price_plan_sms || null,
          inclusive_in_group_calling: promo.inclusive_price_plan_in_group_calling || null,
          inclusive_on_net_minutes: promo.inclusive_price_plan_on_net_minutes || null,
          freebies_device: promo.freebies_description_1_devices || null,
          freebies_priceplan: promo.freebie_description_2_priceplan || null,
          free_sim: promo.free_sim === 'Yes',
          free_cli: promo.free_cli === 'Yes',
          free_itb: promo.free_itb === 'Yes',
          promo_start_date: promo.promo_start_date_mm_dd_yyyy || null,
          promo_end_date: promo.promo_end_date_mm_dd_yyyy || null,
          channel: promo.channel || 'EBU All',
          available_on_helios: promo.available_on_helios === 'Yes',
          available_on_ilula: promo.available_on_ilula === 'Yes',
          inventory_status: promo.ebu_inventory_status || 'Available',
          status: 'active',
          import_batch_id: batch_id,
          source_file: source_file || 'Unknown',
        };
      });

      // Upsert products (update if deal_id exists, insert if not)
      const { data: insertedProducts, error: insertError } = await supabase
        .from('mtn_dealer_products')
        .upsert(productsToInsert, {
          onConflict: 'deal_id',
          ignoreDuplicates: false,
        })
        .select('id, deal_id');

      if (insertError) {
        apiLogger.error('[MTN Import] Batch insert error', { error: insertError });
        errors.push(...promoBatch.map(p => ({ deal_id: p.deal_id, error: insertError.message })));
      } else {
        imported += insertedProducts?.length || 0;
      }
    }

    skipped = promos.length - filteredPromos.length;

    // Update batch status
    if (batch) {
      await supabase
        .from('mtn_dealer_import_batches')
        .update({
          imported_records: imported,
          skipped_records: skipped,
          error_records: errors.length,
          errors: errors.length > 0 ? errors : null,
          status: errors.length > 0 && imported === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batch.id);
    }

    // Log audit
    await supabase.from('mtn_dealer_product_audit_log').insert({
      action: 'import',
      changes: {
        batch_id,
        source_file,
        total_records: promos.length,
        filtered_records: filteredPromos.length,
        imported_records: imported,
        skipped_records: skipped,
        error_records: errors.length,
        filters,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        batch_id,
        total_records: promos.length,
        filtered_records: filteredPromos.length,
        imported_records: imported,
        skipped_records: skipped,
        error_records: errors.length,
        errors: errors.slice(0, 10), // Return first 10 errors
      },
    });
  } catch (error) {
    apiLogger.error('[MTN Import] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
