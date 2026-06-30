import type {
  CampaignPageType,
  CampaignStatus,
  CampaignTemplate,
} from '@/lib/publishing/public-read';

const COMMERCIAL_KEYS = new Set([
  'price',
  'priceInclVat',
  'priceExclVat',
  'resolved_price',
  'cost',
  'cost_buildup',
  'total_cost',
  'margin',
  'marginPct',
  'margin_pct',
  'guardrail_status',
  'source_uid',
  'source_id',
  'source_type',
]);

const VALID_PAGE_TYPES: CampaignPageType[] = ['offer', 'promotion', 'campaign', 'collection'];
const VALID_TEMPLATES: CampaignTemplate[] = [
  'product_detail',
  'promotion_landing',
  'campaign_article',
  'offer_collection',
  'lead_popup',
];
const VALID_STATUSES: CampaignStatus[] = ['draft', 'in_review', 'scheduled', 'published', 'archived'];

export interface CampaignOfferSelection {
  offerId: string;
  label?: string | null;
  badge?: string | null;
  ctaLabel?: string | null;
}

export interface CampaignInput {
  title: string;
  slug?: string;
  pageType: CampaignPageType;
  template: CampaignTemplate;
  status?: CampaignStatus;
  summary?: string | null;
  content?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  channelVisibility?: string[];
  validFrom?: string | null;
  validUntil?: string | null;
  actorId?: string | null;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function assertMember<T extends string>(value: T, valid: T[], label: string): void {
  if (!valid.includes(value)) throw new Error(`Invalid ${label}: ${value}`);
}

function sanitizeContent(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeContent);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (acc, [key, child]) => {
      if (!COMMERCIAL_KEYS.has(key)) acc[key] = sanitizeContent(child);
      return acc;
    },
    {},
  );
}

function sanitizeSeo(seo: Record<string, unknown> | undefined): Record<string, string> {
  const title = cleanString(seo?.title);
  const description = cleanString(seo?.description);
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  };
}

export function buildCampaignInsert(input: CampaignInput): Record<string, unknown> {
  const title = cleanString(input.title);
  if (!title) throw new Error('Campaign title is required');
  assertMember(input.pageType, VALID_PAGE_TYPES, 'page type');
  assertMember(input.template, VALID_TEMPLATES, 'template');

  const status = input.status ?? 'draft';
  assertMember(status, VALID_STATUSES, 'status');

  const now = new Date().toISOString();
  const isPublished = status === 'published';

  return {
    slug: cleanString(input.slug) ? slugify(input.slug!) : slugify(title),
    title,
    page_type: input.pageType,
    template: input.template,
    status,
    summary: cleanString(input.summary),
    content: sanitizeContent(input.content ?? {}),
    seo_metadata: sanitizeSeo(input.seo),
    channel_visibility: input.channelVisibility?.length ? input.channelVisibility : ['website'],
    valid_from: cleanString(input.validFrom),
    valid_until: cleanString(input.validUntil),
    published_at: isPublished ? now : null,
    created_by: input.actorId ?? null,
    approved_by: isPublished ? (input.actorId ?? null) : null,
    approved_at: isPublished ? now : null,
  };
}

export function buildCampaignUpdate(input: Partial<CampaignInput>): Record<string, unknown> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) {
    const title = cleanString(input.title);
    if (!title) throw new Error('Campaign title is required');
    update.title = title;
  }
  if (input.slug !== undefined) update.slug = slugify(input.slug);
  if (input.pageType !== undefined) {
    assertMember(input.pageType, VALID_PAGE_TYPES, 'page type');
    update.page_type = input.pageType;
  }
  if (input.template !== undefined) {
    assertMember(input.template, VALID_TEMPLATES, 'template');
    update.template = input.template;
  }
  if (input.status !== undefined) {
    assertMember(input.status, VALID_STATUSES, 'status');
    update.status = input.status;
    if (input.status === 'published') {
      update.published_at = new Date().toISOString();
      update.approved_by = input.actorId ?? null;
      update.approved_at = new Date().toISOString();
    }
  }
  if (input.summary !== undefined) update.summary = cleanString(input.summary);
  if (input.content !== undefined) update.content = sanitizeContent(input.content);
  if (input.seo !== undefined) update.seo_metadata = sanitizeSeo(input.seo);
  if (input.channelVisibility !== undefined) {
    update.channel_visibility = input.channelVisibility.length ? input.channelVisibility : ['website'];
  }
  if (input.validFrom !== undefined) update.valid_from = cleanString(input.validFrom);
  if (input.validUntil !== undefined) update.valid_until = cleanString(input.validUntil);

  return update;
}

export function buildCampaignSlotInserts(
  campaignId: string,
  offers: CampaignOfferSelection[],
): Record<string, unknown>[] {
  if (offers.length === 0) throw new Error('At least one Offer is required');

  return offers.map((offer, position) => {
    const offerId = cleanString(offer.offerId);
    if (!offerId) throw new Error('Offer id is required');
    return {
      campaign_id: campaignId,
      offer_id: offerId,
      position,
      label: cleanString(offer.label),
      badge: cleanString(offer.badge),
      cta_label: cleanString(offer.ctaLabel),
    };
  });
}
