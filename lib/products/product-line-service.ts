/**
 * Product-line governance service. Admin APIs only (service-role client).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LifecycleGateResult,
  ProductLine,
  ProductLineLifecycle,
  ProductLineWithRelations,
  ProductDocStatus,
} from '@/lib/types/product-lines';
import {
  evaluateDocsSellability,
  evaluateDraftToActive,
  evaluateTransition,
} from '@/lib/products/product-line-gates';

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function mapLine(row: Record<string, unknown>): ProductLine {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    lifecycle_stage: row.lifecycle_stage as ProductLine['lifecycle_stage'],
    sellability: row.sellability as ProductLine['sellability'],
    revenue_model: row.revenue_model as ProductLine['revenue_model'],
    channel: row.channel as ProductLine['channel'],
    gate1_eligible: Boolean(row.gate1_eligible),
    msc_flag: Boolean(row.msc_flag),
    target_market: (row.target_market as string) ?? null,
    list_arpu_zar: num(row.list_arpu_zar),
    list_arpu_incl_vat_zar: num(row.list_arpu_incl_vat_zar),
    min_margin_pct: num(row.min_margin_pct) ?? 25,
    cps_path: (row.cps_path as string) ?? null,
    brd_path: (row.brd_path as string) ?? null,
    fsd_path: (row.fsd_path as string) ?? null,
    cps_status: row.cps_status as ProductDocStatus,
    brd_status: row.brd_status as ProductDocStatus,
    fsd_status: row.fsd_status as ProductDocStatus,
    cps_version: (row.cps_version as string) ?? null,
    brd_version: (row.brd_version as string) ?? null,
    fsd_version: (row.fsd_version as string) ?? null,
    brd_required: Boolean(row.brd_required),
    fsd_required: Boolean(row.fsd_required),
    finance_approved_at: (row.finance_approved_at as string) ?? null,
    finance_approved_by: (row.finance_approved_by as string) ?? null,
    finance_approval_notes: (row.finance_approval_notes as string) ?? null,
    live_mrr_match: (row.live_mrr_match as string) ?? null,
    price_drift_notes: (row.price_drift_notes as string) ?? null,
    notes: (row.notes as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listProductLines(
  supabase: SupabaseClient,
  opts?: { gate1Only?: boolean }
): Promise<ProductLineWithRelations[]> {
  let query = supabase.from('product_lines').select('*').order('name');
  if (opts?.gate1Only) {
    query = query.eq('gate1_eligible', true);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const lines = (data ?? []).map((r) => mapLine(r as Record<string, unknown>));
  const ids = lines.map((l) => l.id);

  const [{ data: skus }, { data: components }, mrrByMatch] = await Promise.all([
    supabase.from('product_line_skus').select('*').in('product_line_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    supabase.from('product_bundle_components').select('*').in('product_line_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).order('sort_order'),
    loadLiveMrr(supabase, lines),
  ]);

  return lines.map((line) => ({
    ...line,
    skus: (skus ?? []).filter((s) => s.product_line_id === line.id),
    bundle_components: (components ?? []).filter((c) => c.product_line_id === line.id),
    live_mrr_zar: mrrByMatch.get(line.code) ?? 0,
    billed_vs_list_drift: line.price_drift_notes,
  }));
}

async function loadLiveMrr(
  supabase: SupabaseClient,
  lines: ProductLine[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const { data, error } = await supabase
    .from('customer_services')
    .select('package_name, monthly_price, status')
    .in('status', ['active', 'pending']);
  if (error || !data) return result;

  for (const line of lines) {
    if (!line.live_mrr_match) {
      result.set(line.code, 0);
      continue;
    }
    const needle = line.live_mrr_match.toLowerCase();
    const sum = data
      .filter((row) => String(row.package_name || '').toLowerCase().includes(needle))
      .reduce((acc, row) => acc + (parseFloat(String(row.monthly_price || '0')) || 0), 0);
    result.set(line.code, Math.round(sum * 100) / 100);
  }
  return result;
}

export async function getProductLine(
  supabase: SupabaseClient,
  idOrCode: string
): Promise<ProductLineWithRelations | null> {
  const byId = idOrCode.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  const { data, error } = await supabase
    .from('product_lines')
    .select('*')
    .eq(byId ? 'id' : 'code', idOrCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const line = mapLine(data as Record<string, unknown>);
  const [skus, components, mrr] = await Promise.all([
    supabase.from('product_line_skus').select('*').eq('product_line_id', line.id),
    supabase.from('product_bundle_components').select('*').eq('product_line_id', line.id).order('sort_order'),
    loadLiveMrr(supabase, [line]),
  ]);

  return {
    ...line,
    skus: skus.data ?? [],
    bundle_components: components.data ?? [],
    live_mrr_zar: mrr.get(line.code) ?? 0,
    billed_vs_list_drift: line.price_drift_notes,
  };
}

export type ProductLinePatch = Partial<
  Pick<
    ProductLine,
    | 'name'
    | 'sellability'
    | 'cps_path'
    | 'brd_path'
    | 'fsd_path'
    | 'cps_status'
    | 'brd_status'
    | 'fsd_status'
    | 'cps_version'
    | 'brd_version'
    | 'fsd_version'
    | 'list_arpu_zar'
    | 'list_arpu_incl_vat_zar'
    | 'notes'
    | 'price_drift_notes'
    | 'finance_approval_notes'
  >
>;

export async function patchProductLine(
  supabase: SupabaseClient,
  id: string,
  patch: ProductLinePatch
): Promise<ProductLine> {
  const { data, error } = await supabase
    .from('product_lines')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapLine(data as Record<string, unknown>);
}

export async function approveProductLine(
  supabase: SupabaseClient,
  id: string,
  adminUserId: string,
  notes?: string
): Promise<ProductLine> {
  const { data, error } = await supabase
    .from('product_lines')
    .update({
      finance_approved_at: new Date().toISOString(),
      finance_approved_by: adminUserId,
      finance_approval_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapLine(data as Record<string, unknown>);
}

export async function transitionProductLine(
  supabase: SupabaseClient,
  id: string,
  to: ProductLineLifecycle,
  extras?: { reason?: string }
): Promise<{ line: ProductLine; gate: LifecycleGateResult }> {
  const current = await getProductLine(supabase, id);
  if (!current) throw new Error('Product line not found');

  let openQuotes = 0;
  if (to === 'archived') {
    const { count } = await supabase
      .from('business_quotes')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'expired')
      .neq('status', 'rejected');
    openQuotes = count ?? 0;
  }

  const gate = evaluateTransition(current, to, { reason: extras?.reason, openQuotes });
  if (!gate.allowed) {
    return { line: current, gate };
  }

  const { data, error } = await supabase
    .from('product_lines')
    .update({
      lifecycle_stage: to,
      notes: extras?.reason
        ? [current.notes, extras.reason].filter(Boolean).join('\n')
        : current.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return { line: mapLine(data as Record<string, unknown>), gate };
}

export function redactProductLineCosts(
  line: ProductLineWithRelations
): ProductLineWithRelations {
  return {
    ...line,
    bundle_components: line.bundle_components.map((c) => ({
      ...c,
      default_cost_excl: null,
    })),
  };
}

/**
 * Resolve a catalogue row (`source_table` + `source_id`, then SKU fallback)
 * to a product_line_skus.product_line_id. Returns null when unlinked.
 */
export async function findProductLineIdForSource(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceId: string,
  sku?: string | null
): Promise<string | null> {
  const { data: bySource } = await supabase
    .from('product_line_skus')
    .select('product_line_id')
    .eq('source_table', sourceTable)
    .eq('source_id', sourceId)
    .limit(1)
    .maybeSingle();

  if (bySource?.product_line_id) return String(bySource.product_line_id);

  if (sku) {
    const { data: bySku } = await supabase
      .from('product_line_skus')
      .select('product_line_id')
      .eq('sku', sku)
      .limit(1)
      .maybeSingle();
    if (bySku?.product_line_id) return String(bySku.product_line_id);
  }

  return null;
}

export async function getProductLineForSource(
  supabase: SupabaseClient,
  sourceTable: string,
  sourceId: string,
  sku?: string | null
): Promise<ProductLineWithRelations | null> {
  const lineId = await findProductLineIdForSource(supabase, sourceTable, sourceId, sku);
  if (!lineId) return null;
  return getProductLine(supabase, lineId);
}

export async function getPublishGateForSku(
  supabase: SupabaseClient,
  skuOrPackageId: string
): Promise<{
  line: ProductLine | null;
  gate: LifecycleGateResult | null;
  docs_gate: LifecycleGateResult;
}> {
  const { data: link } = await supabase
    .from('product_line_skus')
    .select('product_line_id')
    .or(`sku.eq.${skuOrPackageId},source_id.eq.${skuOrPackageId}`)
    .limit(1)
    .maybeSingle();

  if (!link) {
    return { line: null, gate: null, docs_gate: evaluateDocsSellability(null) };
  }

  const line = await getProductLine(supabase, link.product_line_id);
  if (!line) {
    return { line: null, gate: null, docs_gate: evaluateDocsSellability(null) };
  }

  const docs_gate = evaluateDocsSellability(line);

  if (line.lifecycle_stage === 'archived') {
    return {
      line,
      docs_gate: {
        allowed: false,
        items: [
          ...docs_gate.items,
          {
            label: 'Parent line archived',
            ok: false,
            blocking: true,
            detail: 'Restore the product line before quoting this SKU',
          },
        ],
      },
      gate: {
        allowed: false,
        items: [
          {
            label: 'Parent line archived',
            ok: false,
            blocking: true,
            detail: 'Restore the product line before publishing this SKU',
          },
        ],
      },
    };
  }

  // Editorial Publish to Catalogue still requires finance; quotes use docs_gate.
  return { line, gate: evaluateDraftToActive(line), docs_gate };
}
