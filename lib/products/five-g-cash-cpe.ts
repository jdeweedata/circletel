import type { ProductAddon, SelectedAddon } from '@/lib/order/types';
import { createClient } from '@/lib/supabase/server';
import { normalizeCategory } from '@/lib/hardware-catalogue/promote-suggestion';
import { HARDWARE_PRODUCTS_TABLE } from '@/lib/tenant';

/** Cash CPE add-on on month-to-month SIM-only 5G deals. Incl. VAT. */
export const FIVE_G_CASH_CPE_PRICE_INCL_VAT = 2999.99;

export const FIVE_G_CASH_CPE_STORAGE_KEY = 'five_g_cash_cpe';

export const FIVE_G_CASH_CPE_ALLOWED_SKUS = ['G5C'] as const;

export interface FiveGCashCpeSourceRow {
  sku?: string | null;
  name: string;
  image_url?: string | null;
  source_image_url?: string | null;
  in_stock?: boolean | null;
  stock_total?: number | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface FiveGCashCpeRouter {
  sku: string;
  name: string;
  imageUrl: string | null;
  inStock: boolean;
  sellInclVat: number;
}

export interface FiveGCashCpeSelection {
  dealSku: string;
  router: FiveGCashCpeRouter;
}

export function stripEsquireCdata(value: string | null | undefined): string {
  return normalizeCategory(value);
}

export function isAllowedCashCpeSku(sku: unknown): boolean {
  if (typeof sku !== 'string') return false;
  const normalized = stripEsquireCdata(sku).toUpperCase();
  return (FIVE_G_CASH_CPE_ALLOWED_SKUS as readonly string[]).includes(normalized);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function cashCpeSkuFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata) return null;
  if (isAllowedCashCpeSku(metadata.supplier_sku)) {
    return stripEsquireCdata(String(metadata.supplier_sku)).toUpperCase();
  }
  const nested = asRecord(metadata.cash_cpe);
  if (nested && isAllowedCashCpeSku(nested.sku)) {
    return stripEsquireCdata(String(nested.sku)).toUpperCase();
  }
  return null;
}

export function hasCashCpeCheckout(input: {
  cash_cpe?: unknown;
  router_sku?: unknown;
  metadata?: unknown;
}): boolean {
  if (input.cash_cpe === true) return true;
  if (isAllowedCashCpeSku(input.router_sku)) return true;
  const meta = asRecord(input.metadata);
  if (!meta) return false;
  if (meta.cash_cpe === true) return true;
  if (isAllowedCashCpeSku(meta.router_sku)) return true;
  return cashCpeSkuFromMetadata(meta) !== null;
}

export function selectFiveGCashCpeRouters(
  rows: FiveGCashCpeSourceRow[]
): FiveGCashCpeRouter[] {
  const bySku = new Map<string, FiveGCashCpeRouter>();

  for (const row of rows) {
    if (row.status && row.status !== 'published') continue;
    if (row.metadata?.cash_cpe !== true) continue;

    const sku = stripEsquireCdata(
      cashCpeSkuFromMetadata(row.metadata) || row.sku || ''
    ).toUpperCase();
    const name = stripEsquireCdata(row.name);
    if (!sku || !name || !isAllowedCashCpeSku(sku)) continue;

    const inStock = row.in_stock === true || Number(row.stock_total) > 0;
    if (!inStock) continue;

    const imageUrl =
      stripEsquireCdata(row.image_url || row.source_image_url || '') || null;
    if (bySku.has(sku)) continue;

    bySku.set(sku, {
      sku,
      name,
      imageUrl,
      inStock: true,
      sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
    });
  }

  return Array.from(bySku.values());
}

export function formatFiveGCashCpePrice(amount: number): string {
  return `R${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildFiveGCashCpeAddon(router: FiveGCashCpeRouter): ProductAddon {
  return {
    id: `cash-cpe:${router.sku}`,
    name: router.name,
    slug: router.sku.toLowerCase(),
    description: 'Approved 5G router. Paid once-off. Month-to-month SIM stays month-to-month.',
    short_description: 'Cash CPE',
    price: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
    price_incl_vat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
    price_type: 'once-off',
    compatible_product_categories: ['5G'],
    icon: router.imageUrl,
    sort_order: 0,
  };
}

export function hydrateCashCpeSelectedAddons(
  existing: SelectedAddon[] | undefined,
  session: FiveGCashCpeSelection | null
): SelectedAddon[] {
  const current = existing || [];
  const withoutCashCpe = current.filter((row) => !row.addon.id.startsWith('cash-cpe:'));
  const fromExisting = current.find((row) => row.addon.id.startsWith('cash-cpe:'));
  if (fromExisting) return [...withoutCashCpe, fromExisting];
  if (session?.router) {
    return [...withoutCashCpe, { addon: buildFiveGCashCpeAddon(session.router), quantity: 1 }];
  }
  return withoutCashCpe;
}

export function onceOffFromSelectedAddons(addons: SelectedAddon[]): number {
  return addons
    .filter((row) => row.addon.price_type === 'once-off')
    .reduce((sum, row) => sum + row.addon.price_incl_vat * row.quantity, 0);
}

export function cashCpeRouterFromAddons(
  addons: SelectedAddon[] | undefined
): FiveGCashCpeRouter | null {
  const row = (addons || []).find((item) => item.addon.id.startsWith('cash-cpe:'));
  if (!row) return null;
  const sku = row.addon.id.replace(/^cash-cpe:/, '');
  if (!isAllowedCashCpeSku(sku)) return null;
  return {
    sku,
    name: row.addon.name,
    imageUrl: row.addon.icon,
    inStock: true,
    sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
  };
}

export function writeFiveGCashCpeSelection(dealSku: string, router: FiveGCashCpeRouter): void {
  if (typeof window === 'undefined') return;
  const payload: FiveGCashCpeSelection = { dealSku, router };
  sessionStorage.setItem(FIVE_G_CASH_CPE_STORAGE_KEY, JSON.stringify(payload));
}

export function readFiveGCashCpeSelection(dealSku: string): FiveGCashCpeRouter | null {
  const peeked = peekFiveGCashCpeSelection();
  if (!peeked || peeked.dealSku !== dealSku) return null;
  return peeked.router;
}

export function peekFiveGCashCpeSelection(): FiveGCashCpeSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(FIVE_G_CASH_CPE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FiveGCashCpeSelection;
    if (!parsed.router?.sku || !isAllowedCashCpeSku(parsed.router.sku)) return null;
    return {
      dealSku: parsed.dealSku,
      router: {
        ...parsed.router,
        sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      },
    };
  } catch {
    return null;
  }
}

export function clearFiveGCashCpeSelection(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FIVE_G_CASH_CPE_STORAGE_KEY);
}

export async function getFiveGCashCpeRouters(): Promise<FiveGCashCpeRouter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(HARDWARE_PRODUCTS_TABLE)
    .select(
      `
      name,
      image_url,
      status,
      metadata,
      hardware_product_suppliers (
        is_preferred,
        supplier_product:supplier_products (
          sku,
          in_stock,
          stock_total,
          source_image_url
        )
      )
    `
    )
    .eq('status', 'published');

  if (error) {
    console.error('getFiveGCashCpeRouters storefront query failed', error);
    return [];
  }

  const rows: FiveGCashCpeSourceRow[] = (data || []).map((product) => {
    const links = (product.hardware_product_suppliers || []) as Array<{
      is_preferred?: boolean;
      supplier_product?: {
        sku?: string | null;
        in_stock?: boolean | null;
        stock_total?: number | null;
        source_image_url?: string | null;
      } | null;
    }>;
    const preferred =
      links.find((link) => link.is_preferred && link.supplier_product) ||
      links.find((link) => link.supplier_product);
    const supplierProduct = preferred?.supplier_product;
    const metadata = (product.metadata as Record<string, unknown> | null) || {};

    return {
      sku: cashCpeSkuFromMetadata(metadata) || supplierProduct?.sku || null,
      name: product.name,
      image_url: product.image_url,
      source_image_url: supplierProduct?.source_image_url,
      in_stock: supplierProduct?.in_stock,
      stock_total: supplierProduct?.stock_total,
      status: product.status,
      metadata,
    };
  });

  return selectFiveGCashCpeRouters(rows);
}
