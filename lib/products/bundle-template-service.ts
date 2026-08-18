/**
 * Flyer (bundle template) service. Admin APIs only.
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProductBundleComponent,
  ProductLine,
  ProductLineWithRelations,
  PublishedFlyerDefaults,
} from '@/lib/types/product-lines';
import {
  bundleTemplateFromLine,
  inclToExcl,
  priceBundle,
  workingBundleTemplateFromLine,
  type BundleTemplate,
} from '@/lib/products/bundle-pricing';
import { evaluateDraftToActive } from '@/lib/products/product-line-gates';
import { getProductLine, transitionProductLine } from '@/lib/products/product-line-service';
import { generateFlyerDocs } from '@/lib/products/bundle-doc-generator';
import { slugifyFlyerCode, type FlyerWizardFields } from '@/lib/products/bundle-doc-fields';
import { persistOfferDraft } from '@/lib/offers/publisher';
import { writeSnapshot } from '@/lib/offers/snapshot-writer';

export const SEEDED_FLYER_CODES = ['otg', 'circleconnect-5g-essential'] as const;

export type FlyerChip =
  | 'working'
  | 'waiting'
  | 'ready'
  | 'price_change'
  | 'paused';

export function flyerChip(line: ProductLine): FlyerChip {
  if (line.lifecycle_stage === 'inactive' || line.lifecycle_stage === 'archived') {
    return 'paused';
  }
  if (line.lifecycle_stage === 'active' && line.published_defaults) {
    if (line.submitted_for_approval_at && !line.finance_approved_at) {
      return 'price_change';
    }
    return 'ready';
  }
  if (line.submitted_for_approval_at && !line.finance_approved_at) {
    return 'waiting';
  }
  return 'working';
}

export function isFlyerLine(line: ProductLineWithRelations): boolean {
  if (SEEDED_FLYER_CODES.includes(line.code as (typeof SEEDED_FLYER_CODES)[number])) {
    return true;
  }
  return line.bundle_components.length > 0 || line.billed_incl_vat_zar != null;
}

const COMMERCIAL_KEYS = [
  'billed_incl_vat_zar',
  'default_term_months',
  'default_helios_includes_cpe',
  'default_m365_seats',
  'default_connectivity_cost_excl',
] as const;

export interface CreateFlyerInput {
  name: string;
  code?: string;
  target_market?: string;
  sales_blurb?: string;
  billed_incl_vat_zar: number;
  default_term_months: 12 | 24 | 36;
  default_helios_includes_cpe: boolean;
  default_m365_seats: number;
  default_connectivity_cost_excl: number;
  components?: Array<{
    component_role: ProductBundleComponent['component_role'];
    name: string;
    source: ProductBundleComponent['source'];
    helios_includes_cpe?: boolean;
    default_cost_excl?: number | null;
    amortise_months?: number | null;
    package_sku?: string | null;
  }>;
}

export interface UpdateFlyerInput {
  name?: string;
  sales_blurb?: string;
  target_market?: string;
  billed_incl_vat_zar?: number;
  default_term_months?: 12 | 24 | 36;
  default_helios_includes_cpe?: boolean;
  default_m365_seats?: number;
  default_connectivity_cost_excl?: number;
  code?: string;
  needsNewIt?: boolean;
}

export async function listBundleTemplates(
  supabase: SupabaseClient,
  opts?: { sellable?: boolean }
): Promise<ProductLineWithRelations[]> {
  const { data, error } = await supabase.from('product_lines').select('*').order('name');
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.id);
  const { data: components } = await supabase
    .from('product_bundle_components')
    .select('*')
    .in('product_line_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    .order('sort_order');
  const { data: skus } = await supabase
    .from('product_line_skus')
    .select('*')
    .in('product_line_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

  const lines: ProductLineWithRelations[] = [];
  for (const raw of data ?? []) {
    const full = await getProductLine(supabase, raw.id);
    if (!full) continue;
    full.bundle_components = (components ?? []).filter((c) => c.product_line_id === full.id);
    full.skus = (skus ?? []).filter((s) => s.product_line_id === full.id);
    if (!isFlyerLine(full)) continue;
    if (opts?.sellable && flyerChip(full) !== 'ready' && flyerChip(full) !== 'price_change') {
      continue;
    }
    lines.push(full);
  }
  return lines;
}

export async function createBundleTemplate(
  supabase: SupabaseClient,
  input: CreateFlyerInput,
  _userId: string
): Promise<ProductLineWithRelations> {
  const code = (input.code?.trim() || slugifyFlyerCode(input.name)).toLowerCase();
  if (!code) throw new Error('A short flyer code is required');

  const { data: existing } = await supabase
    .from('product_lines')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (existing) throw new Error('That flyer code is already in use');

  const excl = inclToExcl(input.billed_incl_vat_zar);
  const { data, error } = await supabase
    .from('product_lines')
    .insert({
      code,
      name: input.name.trim(),
      lifecycle_stage: 'draft',
      sellability: 'sell_now',
      revenue_model: 'hybrid',
      channel: 'skytel_dealer',
      gate1_eligible: true,
      brd_required: true,
      fsd_required: false,
      target_market: input.target_market ?? null,
      sales_blurb: input.sales_blurb ?? null,
      billed_incl_vat_zar: input.billed_incl_vat_zar,
      list_arpu_incl_vat_zar: input.billed_incl_vat_zar,
      list_arpu_zar: excl,
      default_term_months: input.default_term_months,
      default_helios_includes_cpe: input.default_helios_includes_cpe,
      default_m365_seats: input.default_m365_seats,
      default_connectivity_cost_excl: input.default_connectivity_cost_excl,
      min_margin_pct: 25,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Could not save flyer');

  const comps = input.components ?? [];
  if (comps.length) {
    const { error: cErr } = await supabase.from('product_bundle_components').insert(
      comps.map((c, i) => ({
        product_line_id: data.id,
        component_role: c.component_role,
        name: c.name,
        source: c.source,
        helios_includes_cpe: Boolean(c.helios_includes_cpe),
        default_cost_excl: c.default_cost_excl ?? null,
        amortise_months: c.amortise_months ?? null,
        package_sku: c.package_sku ?? null,
        sort_order: i,
        component_config: {},
      }))
    );
    if (cErr) throw new Error(cErr.message);
  }

  const line = await getProductLine(supabase, data.id);
  if (!line) throw new Error('Flyer saved but could not be reloaded');
  return line;
}

export async function updateTemplate(
  supabase: SupabaseClient,
  code: string,
  patch: UpdateFlyerInput
): Promise<ProductLineWithRelations> {
  const current = await getProductLine(supabase, code);
  if (!current) throw new Error('Flyer not found');
  if (patch.code && patch.code !== current.code) {
    throw new Error('The flyer code cannot be changed');
  }

  const commercialChanged = COMMERCIAL_KEYS.some((key) => {
    const next = patch[key];
    return next !== undefined && next !== current[key];
  });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.sales_blurb !== undefined) update.sales_blurb = patch.sales_blurb;
  if (patch.target_market !== undefined) update.target_market = patch.target_market;
  if (patch.billed_incl_vat_zar !== undefined) {
    update.billed_incl_vat_zar = patch.billed_incl_vat_zar;
    update.list_arpu_incl_vat_zar = patch.billed_incl_vat_zar;
    update.list_arpu_zar = inclToExcl(patch.billed_incl_vat_zar);
  }
  if (patch.default_term_months !== undefined) update.default_term_months = patch.default_term_months;
  if (patch.default_helios_includes_cpe !== undefined) {
    update.default_helios_includes_cpe = patch.default_helios_includes_cpe;
  }
  if (patch.default_m365_seats !== undefined) update.default_m365_seats = patch.default_m365_seats;
  if (patch.default_connectivity_cost_excl !== undefined) {
    update.default_connectivity_cost_excl = patch.default_connectivity_cost_excl;
  }
  if (patch.needsNewIt === true) update.fsd_required = true;
  if (patch.needsNewIt === false) update.fsd_required = false;

  const wasReady = flyerChip(current) === 'ready' || flyerChip(current) === 'price_change';
  if (commercialChanged && wasReady) {
    update.submitted_for_approval_at = new Date().toISOString();
    update.finance_approved_at = null;
    update.finance_approved_by = null;
  }

  const { error } = await supabase.from('product_lines').update(update).eq('id', current.id);
  if (error) throw new Error(error.message);

  if (!commercialChanged && patch.sales_blurb !== undefined && current.published_package_id) {
    await supabase
      .from('offers')
      .update({
        media: { description: patch.sales_blurb },
        title: patch.name ?? current.name,
        updated_at: new Date().toISOString(),
      })
      .eq('source_uid', `service_packages:${current.published_package_id}`);
  }

  const next = await getProductLine(supabase, current.id);
  if (!next) throw new Error('Flyer not found after save');
  return next;
}

export async function submitForReview(
  supabase: SupabaseClient,
  code: string,
  userId: string,
  fields: FlyerWizardFields,
  repoRoot = process.cwd()
): Promise<ProductLineWithRelations> {
  const line = await updateTemplate(supabase, code, {
    name: fields.name,
    sales_blurb: fields.salesBlurb,
    billed_incl_vat_zar: fields.billedInclVat,
    default_term_months: fields.termMonths,
    default_helios_includes_cpe: fields.heliosIncludesCpe,
    default_m365_seats: fields.m365Seats,
    default_connectivity_cost_excl: fields.connectivityCostExcl,
    needsNewIt: fields.needsNewIt,
  });

  const docs = generateFlyerDocs(fields, workingBundleTemplateFromLine(line));
  await mkdir(path.join(repoRoot, 'products/bundles/sales-collateral'), { recursive: true });
  await writeFile(path.join(repoRoot, docs.cpsPath), docs.cpsMarkdown, 'utf8');
  await writeFile(path.join(repoRoot, docs.brdPath), docs.brdMarkdown, 'utf8');
  await writeFile(path.join(repoRoot, docs.onePagerPath), docs.onePagerMarkdown, 'utf8');

  const { error } = await supabase
    .from('product_lines')
    .update({
      submitted_for_approval_at: new Date().toISOString(),
      submitted_for_approval_by: userId,
      cps_path: docs.cpsPath,
      brd_path: docs.brdPath,
      cps_status: 'draft',
      brd_status: 'draft',
      cps_version: '1.0',
      brd_version: '1.0',
      updated_at: new Date().toISOString(),
    })
    .eq('id', line.id);
  if (error) throw new Error(error.message);

  const next = await getProductLine(supabase, line.id);
  if (!next) throw new Error('Flyer not found after send');
  return next;
}

export async function rejectTemplate(
  supabase: SupabaseClient,
  code: string,
  note: string
): Promise<ProductLineWithRelations> {
  const current = await getProductLine(supabase, code);
  if (!current) throw new Error('Flyer not found');
  const { error } = await supabase
    .from('product_lines')
    .update({
      submitted_for_approval_at: null,
      submitted_for_approval_by: null,
      finance_approval_notes: note,
      notes: [current.notes, note].filter(Boolean).join('\n'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);
  if (error) throw new Error(error.message);
  const next = await getProductLine(supabase, current.id);
  if (!next) throw new Error('Flyer not found');
  return next;
}

export async function signOffTemplate(
  supabase: SupabaseClient,
  code: string,
  userId: string,
  notes?: string
): Promise<ProductLineWithRelations> {
  const current = await getProductLine(supabase, code);
  if (!current) throw new Error('Flyer not found');
  const { error } = await supabase
    .from('product_lines')
    .update({
      finance_approved_at: new Date().toISOString(),
      finance_approved_by: userId,
      finance_approval_notes: notes ?? current.finance_approval_notes,
      cps_status: current.cps_path ? 'current' : current.cps_status,
      brd_status: current.brd_path ? 'current' : current.brd_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);
  if (error) throw new Error(error.message);
  const next = await getProductLine(supabase, current.id);
  if (!next) throw new Error('Flyer not found');
  return next;
}

export function publishedDefaultsFromLine(line: ProductLineWithRelations): PublishedFlyerDefaults {
  return {
    termMonths: line.default_term_months,
    heliosIncludesCpe: line.default_helios_includes_cpe,
    m365Seats: line.default_m365_seats,
    connectivityCostExcl: line.default_connectivity_cost_excl ?? 0,
    billedInclVat: line.billed_incl_vat_zar ?? 0,
    packageSku:
      line.code === 'circleconnect-5g-essential'
        ? 'CC-5G-CON-035'
        : line.skus.find((s) => s.sku)?.sku ?? line.code.toUpperCase(),
  };
}

export async function publishServicePackage(
  supabase: SupabaseClient,
  line: ProductLineWithRelations
): Promise<string> {
  const sku =
    line.code === 'circleconnect-5g-essential'
      ? 'CC-5G-CON-035'
      : line.skus.find((s) => s.sku)?.sku ||
        (line.code === 'otg' ? 'OTG-20GB' : line.code.toUpperCase());
  const monthlyExcl = inclToExcl(line.billed_incl_vat_zar ?? 0);
  const slug = line.code;
  const payload = {
    name: line.name,
    slug,
    sku,
    service_type: '5G',
    product_category: 'connectivity',
    customer_type: 'business',
    speed_down: line.code === 'otg' ? 0 : 35,
    speed_up: 0,
    price: monthlyExcl,
    cost_price_zar: line.default_connectivity_cost_excl ?? 0,
    active: true,
    status: 'active',
    description: line.sales_blurb,
    features: [
      line.sales_blurb || line.name,
      `${line.default_term_months} month term`,
    ].filter(Boolean),
    metadata: {
      contract_months: line.default_term_months,
      flyer_code: line.code,
      helios_includes_cpe: line.default_helios_includes_cpe,
    },
  };

  let packageId = line.published_package_id;
  if (packageId) {
    const { error } = await supabase.from('service_packages').update(payload).eq('id', packageId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existing } = await supabase
      .from('service_packages')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();
    if (existing?.id) {
      packageId = existing.id;
      const { error } = await supabase.from('service_packages').update(payload).eq('id', packageId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from('service_packages')
        .insert(payload)
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message || 'Could not publish catalogue row');
      packageId = data.id;
    }
  }

  await supabase
    .from('product_line_skus')
    .upsert(
      {
        product_line_id: line.id,
        source_table: 'service_packages',
        source_id: packageId,
        sku,
      },
      { onConflict: 'source_table,source_id' }
    );

  await supabase
    .from('product_lines')
    .update({
      published_package_id: packageId,
      published_defaults: publishedDefaultsFromLine({
        ...line,
        skus: [{ id: '', product_line_id: line.id, source_table: 'service_packages', source_id: packageId, sku }],
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', line.id);

  return packageId;
}

export async function publishPublicOffer(
  line: ProductLineWithRelations,
  packageId: string,
  pricing: ReturnType<typeof priceBundle>
): Promise<void> {
  const billedExcl = inclToExcl(line.billed_incl_vat_zar ?? 0);
  const siteCheck = line.notes?.includes('site-check') ?? false;
  const ctaPath =
    line.channel === 'skytel_dealer' && !siteCheck
      ? `/get-started?src=offer&template=${encodeURIComponent(line.code)}`
      : undefined;

  const offerId = await persistOfferDraft({
    slug: line.code,
    title: line.name,
    customerType: 'business',
    basePrice: billedExcl,
    channelVisibility: ['direct'],
    sourceUid: `service_packages:${packageId}`,
    sourceUpdatedAt: new Date().toISOString(),
    components: [
      {
        sourceType: 'service_package',
        sourceId: packageId,
        qty: 1,
        role: 'primary',
        unitCost: pricing.directCostExcl,
        unitPrice: billedExcl,
        label: line.name,
      },
    ],
  });

  await writeSnapshot(offerId, {
    resolvedPrice: billedExcl,
    costBuildup: [
      {
        label: 'Connectivity',
        sourceType: 'service_package',
        unitCost: pricing.connectivityCostExcl,
        qty: 1,
        lineCost: pricing.connectivityCostExcl,
      },
    ],
    totalCost: pricing.directCostExcl,
    marginPct: Math.round(pricing.marginPct),
    guardrailStatus: pricing.belowFloor ? 'fail' : 'pass',
  });

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  await supabase
    .from('offers')
    .update({
      media: {
        description: line.sales_blurb ?? '',
        ...(ctaPath ? { cta_path: ctaPath } : {}),
      },
    })
    .eq('id', offerId);
}

export async function activateTemplate(
  supabase: SupabaseClient,
  code: string,
  userId: string,
  notes?: string
): Promise<ProductLineWithRelations> {
  const before = await getProductLine(supabase, code);
  if (!before) throw new Error('Flyer not found');
  if (!before.cps_path) {
    throw new Error('Send this flyer to finance first so the numbers are on file.');
  }

  const signed = await signOffTemplate(supabase, code, userId, notes);
  const working = workingBundleTemplateFromLine(signed);
  const preview = priceBundle({
    template: working,
    termMonths: signed.default_term_months,
    billedInclVat: signed.billed_incl_vat_zar ?? working.billedInclVat,
    heliosIncludesCpe: signed.default_helios_includes_cpe,
    cpeCostExcl:
      signed.bundle_components.find((c) => c.component_role === 'cpe')?.default_cost_excl ?? 0,
    addCpeUpgrade: false,
    m365Seats: signed.default_m365_seats,
    connectivityCostExcl: signed.default_connectivity_cost_excl ?? undefined,
  });

  if (preview.belowFloor && !notes?.trim()) {
    throw new Error('This deal is under the 25% floor. Add a note before Ready to sell.');
  }

  const gate = evaluateDraftToActive(signed);
  if (!gate.allowed) {
    const detail = gate.items
      .filter((i) => i.blocking && !i.ok)
      .map((i) => i.label)
      .join(', ');
    throw new Error(detail || 'This flyer is not ready to sell');
  }

  if (signed.lifecycle_stage !== 'active') {
    const moved = await transitionProductLine(supabase, signed.id, 'active');
    if (!moved.gate.allowed) {
      throw new Error(moved.gate.items.map((i) => i.label).join(', ') || 'Cannot make ready to sell');
    }
  }

  const fresh = await getProductLine(supabase, signed.id);
  if (!fresh) throw new Error('Flyer not found');
  const packageId = await publishServicePackage(supabase, fresh);
  const published = await getProductLine(supabase, fresh.id);
  if (!published) throw new Error('Flyer not found after publish');
  await publishPublicOffer(published, packageId, preview);
  const next = await getProductLine(supabase, fresh.id);
  if (!next) throw new Error('Flyer not found');
  return next;
}

export function sellableTemplates(lines: ProductLineWithRelations[]): BundleTemplate[] {
  return lines
    .filter((line) => flyerChip(line) === 'ready' || flyerChip(line) === 'price_change')
    .map((line) => bundleTemplateFromLine(line));
}
