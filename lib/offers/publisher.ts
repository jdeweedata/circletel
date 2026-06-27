import type { UnifiedProduct, UnifiedProductSourceTable } from '@/lib/types/unified-product';
import type { OfferDraft, OfferSourceType, OfferCustomerType } from '@/lib/types/offer';

const SOURCE_TABLE_TO_OFFER_TYPE: Record<UnifiedProductSourceTable, OfferSourceType> = {
  admin_products: 'service_package',
  service_packages: 'service_package',
  mtn_dealer_products: 'mtn_deal',
  circletel_hardware_products: 'hardware',
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readCustomerType(raw: Record<string, unknown>): OfferCustomerType {
  const v = typeof raw.customer_type === 'string' ? raw.customer_type : '';
  if (v === 'consumer' || v === 'business' || v === 'both') return v;
  return 'both';
}

export function buildOfferDraftFromUnified(u: UnifiedProduct): OfferDraft {
  const raw = (u.raw ?? {}) as Record<string, unknown>;
  const sourceType = SOURCE_TABLE_TO_OFFER_TYPE[u.sourceTable];
  const slug = typeof raw.slug === 'string' && raw.slug.length > 0 ? raw.slug : slugify(u.name);

  return {
    slug,
    title: u.name,
    customerType: readCustomerType(raw),
    basePrice: u.price,
    channelVisibility: ['direct'],
    sourceUid: u.uid,
    sourceUpdatedAt: u.updatedAt,
    components: [
      {
        sourceType,
        sourceId: u.id,
        qty: 1,
        role: 'primary',
        unitCost: u.cost,
        unitPrice: u.price,
        label: u.name,
      },
    ],
  };
}
