import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  mapOfferRow,
  type OfferReadRow,
  type PublicOffer,
} from '@/lib/offers/public-read';
import { apiLogger } from '@/lib/logging/logger';

export type CampaignPageType = 'offer' | 'promotion' | 'campaign' | 'collection';
export type CampaignTemplate =
  | 'product_detail'
  | 'promotion_landing'
  | 'campaign_article'
  | 'offer_collection'
  | 'lead_popup';
export type CampaignStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export interface PublicCampaignHero {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
}

export interface PublicCampaignSection {
  heading: string;
  body: string;
}

export interface PublicCampaignOfferSlot {
  slotLabel?: string;
  badge?: string;
  ctaLabel?: string;
  offer: PublicOffer;
}

export interface PublicCampaignPage {
  slug: string;
  title: string;
  pageType: CampaignPageType;
  template: CampaignTemplate;
  summary?: string;
  hero: PublicCampaignHero;
  sections: PublicCampaignSection[];
  seo: {
    title?: string;
    description?: string;
  };
  offers: PublicCampaignOfferSlot[];
  validUntil?: string;
}

export interface CampaignOfferSlotReadRow {
  position: number;
  label: string | null;
  badge: string | null;
  cta_label: string | null;
  offers: OfferReadRow | OfferReadRow[] | null;
}

export interface CampaignReadRow {
  slug: string;
  title: string;
  page_type: CampaignPageType;
  template: CampaignTemplate;
  status: CampaignStatus;
  summary: string | null;
  content: Record<string, unknown> | null;
  seo_metadata: Record<string, unknown> | null;
  published_at: string | null;
  valid_from: string | null;
  valid_until: string | null;
  campaign_offer_slots: CampaignOfferSlotReadRow[] | null;
}

export const CAMPAIGN_SELECT =
  'slug,title,page_type,template,status,summary,content,seo_metadata,published_at,valid_from,valid_until,' +
  'campaign_offer_slots(position,label,badge,cta_label,offers(slug,title,customer_type,source_uid,media,offer_pricing_snapshot!inner(resolved_price),offer_components(role,source_type)))';

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function firstOffer(value: CampaignOfferSlotReadRow['offers']): OfferReadRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function readHero(content: Record<string, unknown> | null, fallbackTitle: string): PublicCampaignHero {
  const raw = typeof content?.hero === 'object' && content.hero !== null
    ? content.hero as Record<string, unknown>
    : {};

  return {
    ...(stringValue(raw.eyebrow) ? { eyebrow: stringValue(raw.eyebrow) } : {}),
    title: stringValue(raw.title) ?? fallbackTitle,
    ...(stringValue(raw.subtitle) ? { subtitle: stringValue(raw.subtitle) } : {}),
    ...(stringValue(raw.image) ? { image: stringValue(raw.image) } : {}),
  };
}

function readSections(content: Record<string, unknown> | null): PublicCampaignSection[] {
  const rawSections = Array.isArray(content?.sections) ? content.sections : [];
  return rawSections
    .map((section) => {
      if (!section || typeof section !== 'object') return null;
      const raw = section as Record<string, unknown>;
      const heading = stringValue(raw.heading);
      const body = stringValue(raw.body);
      return heading && body ? { heading, body } : null;
    })
    .filter((section): section is PublicCampaignSection => section !== null);
}

function readSeo(seo: Record<string, unknown> | null): PublicCampaignPage['seo'] {
  return {
    ...(stringValue(seo?.title) ? { title: stringValue(seo?.title) } : {}),
    ...(stringValue(seo?.description) ? { description: stringValue(seo?.description) } : {}),
  };
}

export function isCampaignVisible(row: CampaignReadRow, now: Date = new Date()): boolean {
  if (row.status !== 'published') return false;

  const publishedAt = row.published_at ? new Date(row.published_at) : null;
  if (!publishedAt || publishedAt.getTime() > now.getTime()) return false;

  const validFrom = row.valid_from ? new Date(row.valid_from) : null;
  if (validFrom && validFrom.getTime() > now.getTime()) return false;

  const validUntil = row.valid_until ? new Date(row.valid_until) : null;
  if (validUntil && validUntil.getTime() <= now.getTime()) return false;

  return true;
}

export function mapCampaignRow(
  row: CampaignReadRow,
  now: Date = new Date(),
): PublicCampaignPage | null {
  if (!isCampaignVisible(row, now)) return null;

  const sortedSlots = [...(row.campaign_offer_slots ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const offers = sortedSlots
    .map((slot): PublicCampaignOfferSlot | null => {
      const offerRow = firstOffer(slot.offers);
      if (!offerRow) return null;
      const offer = mapOfferRow(offerRow);
      if (!offer) return null;
      return {
        ...(stringValue(slot.label) ? { slotLabel: stringValue(slot.label) } : {}),
        ...(stringValue(slot.badge) ? { badge: stringValue(slot.badge) } : {}),
        ...(stringValue(slot.cta_label) ? { ctaLabel: stringValue(slot.cta_label) } : {}),
        offer,
      };
    })
    .filter((slot): slot is PublicCampaignOfferSlot => slot !== null);

  return {
    slug: row.slug,
    title: row.title,
    pageType: row.page_type,
    template: row.template,
    ...(stringValue(row.summary) ? { summary: stringValue(row.summary) } : {}),
    hero: readHero(row.content, row.title),
    sections: readSections(row.content),
    seo: readSeo(row.seo_metadata),
    offers,
    ...(row.valid_until ? { validUntil: row.valid_until } : {}),
  };
}

export async function getPublicCampaignBySlug(
  slug: string,
  pageType?: CampaignPageType,
): Promise<PublicCampaignPage | null> {
  const supabase = await createClient();
  let query = supabase
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('slug', slug);

  if (pageType) query = query.eq('page_type', pageType);

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    if (error) apiLogger.error('[publishing/public-read] campaign detail failed', { error: error.message, slug });
    return null;
  }

  return mapCampaignRow(data as unknown as CampaignReadRow);
}

export async function listPublicCampaigns(
  pageType?: CampaignPageType,
): Promise<PublicCampaignPage[]> {
  const supabase = await createClient();
  let query = supabase
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .order('published_at', { ascending: false });

  if (pageType) query = query.eq('page_type', pageType);

  const { data, error } = await query;
  if (error || !data) {
    if (error) apiLogger.error('[publishing/public-read] campaign list failed', { error: error.message, pageType });
    return [];
  }

  return (data as unknown as CampaignReadRow[])
    .map((row) => mapCampaignRow(row))
    .filter((page): page is PublicCampaignPage => page !== null);
}
