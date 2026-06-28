import 'server-only';
import { addVat, VAT_RATE } from '@/lib/billing/vat';
import type { PublicOffer, OfferCustomerType } from '@/lib/types/offer';
import { apiLogger } from '@/lib/logging/logger';

export type { PublicOffer, PublicOfferDetail } from '@/lib/types/offer';

/** Raw row shape returned by the storefront query (see listPublicOffers). */
export interface OfferReadRow {
  slug: string;
  title: string;
  customer_type: OfferCustomerType;
  source_uid: string | null;
  media: Record<string, unknown> | null;
  offer_pricing_snapshot:
    | { resolved_price: number }
    | { resolved_price: number }[]
    | null;
  offer_components: { role: string; source_type: string }[] | null;
}

const VAT_LABEL = 'incl. VAT';

function firstSnapshot(s: OfferReadRow['offer_pricing_snapshot']): { resolved_price: number } | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

function whitelistedString(media: Record<string, unknown> | null, key: string): string | undefined {
  const v = media?.[key];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Pure sanitization + VAT + VAT-basis guard. Returns null when the offer is not
 * a service_packages-sourced row (the only ex-VAT basis we may expose) or has no price.
 */
export function mapOfferRow(row: OfferReadRow): PublicOffer | null {
  // VAT-basis guard: source_uid prefix is the source-table proof; component type alone
  // is insufficient (admin_products also maps to source_type 'service_package').
  const fromServicePackages = (row.source_uid ?? '').startsWith('service_packages:');
  const primary = (row.offer_components ?? []).find((c) => c.role === 'primary');
  const primaryIsServicePackage = primary?.source_type === 'service_package';
  if (!fromServicePackages || !primaryIsServicePackage) {
    apiLogger.warn('[offers/public-read] excluded non-service_package offer', { slug: row.slug, sourceUid: row.source_uid });
    return null;
  }

  const snap = firstSnapshot(row.offer_pricing_snapshot);
  if (!snap || typeof snap.resolved_price !== 'number') return null;

  const description = whitelistedString(row.media, 'description');
  const image = whitelistedString(row.media, 'image');

  return {
    slug: row.slug,
    title: row.title,
    customerType: row.customer_type,
    priceInclVat: addVat(snap.resolved_price),
    vatRate: VAT_RATE,
    vatLabel: VAT_LABEL,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  };
}
