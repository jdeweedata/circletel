'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowSquareOutBold,
  PiArrowsClockwiseBold,
  PiCalendarBold,
  PiCheckCircleBold,
  PiGlobeBold,
  PiMegaphoneBold,
  PiPackageBold,
  PiSparkleBold,
  PiSpinnerBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageType = 'offer' | 'promotion' | 'campaign' | 'collection';
type TemplateType =
  | 'product_detail'
  | 'promotion_landing'
  | 'campaign_article'
  | 'offer_collection'
  | 'lead_popup';
type CampaignStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

interface PricingSnapshot {
  resolved_price: number | null;
  total_cost: number | null;
  margin_pct: number | null;
  guardrail_status: string | null;
  computed_at: string | null;
}

interface OfferComponent {
  role: string;
  source_type: string;
  label: string | null;
  qty: number | null;
}

interface AdminOffer {
  id: string;
  slug: string;
  title: string;
  customer_type: string;
  lifecycle_state: string;
  channel_visibility: string[] | null;
  base_price: number | null;
  source_uid: string | null;
  status: string;
  updated_at: string | null;
  offer_pricing_snapshot: PricingSnapshot | PricingSnapshot[] | null;
  offer_components: OfferComponent[] | null;
}

interface AdminCampaignSlot {
  label: string | null;
  badge: string | null;
  cta_label: string | null;
  offers: {
    slug: string;
    title: string;
  } | null;
}

interface AdminCampaign {
  id: string;
  slug: string;
  title: string;
  page_type: PageType;
  template: TemplateType;
  status: CampaignStatus;
  summary: string | null;
  valid_until: string | null;
  updated_at: string | null;
  campaign_offer_slots: AdminCampaignSlot[] | null;
}

interface StudioForm {
  title: string;
  pageType: PageType;
  template: TemplateType;
  status: CampaignStatus;
  summary: string;
  selectedOfferId: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  sectionHeading: string;
  sectionBody: string;
  badge: string;
  ctaLabel: string;
  validUntil: string;
}

const PAGE_PATHS: Record<PageType, string> = {
  offer: '/offers',
  promotion: '/promotions',
  campaign: '/campaigns',
  collection: '/collections',
};

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: 'promotion', label: 'Promotion landing page' },
  { value: 'offer', label: 'Offer detail page' },
  { value: 'campaign', label: 'Campaign article' },
  { value: 'collection', label: 'Collection page' },
];

const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: 'promotion_landing', label: 'Promotion landing' },
  { value: 'product_detail', label: 'Product detail' },
  { value: 'campaign_article', label: 'Campaign article' },
  { value: 'offer_collection', label: 'Offer collection' },
  { value: 'lead_popup', label: 'Lead capture popup' },
];

const STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

const initialForm: StudioForm = {
  title: '',
  pageType: 'promotion',
  template: 'promotion_landing',
  status: 'draft',
  summary: '',
  selectedOfferId: '',
  heroEyebrow: '',
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  sectionHeading: 'Why this offer works',
  sectionBody: '',
  badge: '',
  ctaLabel: 'Check availability',
  validUntil: '',
};

function firstSnapshot(snapshot: AdminOffer['offer_pricing_snapshot']): PricingSnapshot | null {
  if (!snapshot) return null;
  return Array.isArray(snapshot) ? (snapshot[0] ?? null) : snapshot;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number') return 'Not priced';
  return value.toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== 'number') return 'n/a';
  return `${value.toFixed(1)}%`;
}

function campaignHref(campaign: Pick<AdminCampaign, 'page_type' | 'slug'>) {
  return `${PAGE_PATHS[campaign.page_type]}/${campaign.slug}`;
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-gray-100 text-gray-500',
  };
  return classes[status] ?? classes.draft;
}

function sourceLabel(offer: AdminOffer) {
  const primary = offer.offer_components?.find((component) => component.role === 'primary');
  return primary?.source_type?.replace(/_/g, ' ') ?? offer.source_uid?.split(':')[0]?.replace(/_/g, ' ') ?? 'offer';
}

function offerReady(offer: AdminOffer) {
  const snapshot = firstSnapshot(offer.offer_pricing_snapshot);
  const hasPrice = typeof snapshot?.resolved_price === 'number';
  const guardrailPass = snapshot?.guardrail_status !== 'fail';
  return hasPrice && guardrailPass && offer.status === 'active';
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'orange',
}: {
  label: string;
  value: string | number;
  icon: typeof PiPackageBold;
  tone?: 'orange' | 'green' | 'blue';
}) {
  const toneClass = {
    orange: 'bg-circleTel-orange-light text-circleTel-orange',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
  }[tone];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function OfferRow({
  offer,
  selected,
  onSelect,
}: {
  offer: AdminOffer;
  selected: boolean;
  onSelect: () => void;
}) {
  const snapshot = firstSnapshot(offer.offer_pricing_snapshot);
  const ready = offerReady(offer);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-white p-4 text-left transition hover:border-circleTel-orange hover:shadow-sm',
        selected ? 'border-circleTel-orange ring-2 ring-circleTel-orange/15' : 'border-gray-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{offer.title}</p>
          <p className="mt-1 text-xs capitalize text-gray-500">
            {sourceLabel(offer)} · {offer.customer_type}
          </p>
        </div>
        <span className={cn(
          'rounded-full px-2 py-1 text-xs font-semibold',
          ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
        )}>
          {ready ? 'Ready' : 'Review'}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Sell price</p>
          <p className="mt-1 font-semibold text-gray-900">{formatMoney(snapshot?.resolved_price)}</p>
        </div>
        <div>
          <p className="text-gray-500">Margin</p>
          <p className="mt-1 font-semibold text-gray-900">{formatPercent(snapshot?.margin_pct)}</p>
        </div>
        <div>
          <p className="text-gray-500">Guardrail</p>
          <p className="mt-1 font-semibold capitalize text-gray-900">
            {snapshot?.guardrail_status ?? 'unknown'}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ProductPublishingStudio() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [form, setForm] = useState<StudioForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === form.selectedOfferId) ?? null,
    [form.selectedOfferId, offers],
  );

  const readyOffers = useMemo(() => offers.filter(offerReady), [offers]);
  const publishedCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === 'published'),
    [campaigns],
  );

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [offersResponse, campaignsResponse] = await Promise.all([
        fetch('/api/admin/publishing/offers?status=active'),
        fetch('/api/admin/publishing/campaigns?status=all'),
      ]);

      const offersJson = await offersResponse.json();
      const campaignsJson = await campaignsResponse.json();
      if (!offersResponse.ok || !offersJson.success) {
        throw new Error(offersJson.error ?? 'Failed to load Offers');
      }
      if (!campaignsResponse.ok || !campaignsJson.success) {
        throw new Error(campaignsJson.error ?? 'Failed to load campaigns');
      }

      const nextOffers = (offersJson.offers ?? []) as AdminOffer[];
      setOffers(nextOffers);
      setCampaigns((campaignsJson.campaigns ?? []) as AdminCampaign[]);
      setForm((current) => ({
        ...current,
        selectedOfferId: current.selectedOfferId || nextOffers[0]?.id || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Product Publishing Studio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm<K extends keyof StudioForm>(key: K, value: StudioForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function generateDraftCopy() {
    if (!selectedOffer) {
      setError('Select an approved Offer before drafting copy');
      return;
    }

    const snapshot = firstSnapshot(selectedOffer.offer_pricing_snapshot);
    const price = formatMoney(snapshot?.resolved_price);
    const title = form.title || `${selectedOffer.title} offer`;

    setForm((current) => ({
      ...current,
      title,
      heroEyebrow: current.heroEyebrow || 'CircleTel approved offer',
      heroTitle: current.heroTitle || title,
      heroSubtitle:
        current.heroSubtitle ||
        `${selectedOffer.title} is ready for sales with live catalogue pricing from ${price}.`,
      summary:
        current.summary ||
        `A sales-ready CircleTel offer for ${selectedOffer.customer_type} customers, published from the approved Offer catalogue.`,
      sectionHeading: current.sectionHeading || 'Why this offer works',
      sectionBody:
        current.sectionBody ||
        `This page is linked to the approved Offer record for ${selectedOffer.title}. Marketing can shape the story, while pricing, VAT, margin and fulfilment rules remain controlled by the product catalogue.`,
      ctaLabel: current.ctaLabel || 'Check availability',
    }));
    setNotice('Draft content added. Review it before publishing.');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      if (!form.selectedOfferId) throw new Error('Select an Offer to publish');
      if (!form.title.trim()) throw new Error('Campaign title is required');

      const payload = {
        title: form.title,
        pageType: form.pageType,
        template: form.template,
        status: form.status,
        summary: form.summary,
        content: {
          hero: {
            eyebrow: form.heroEyebrow,
            title: form.heroTitle || form.title,
            subtitle: form.heroSubtitle,
            image: form.heroImage,
          },
          sections: form.sectionBody
            ? [{ heading: form.sectionHeading || 'Offer details', body: form.sectionBody }]
            : [],
        },
        seo: {
          title: form.title,
          description: form.summary || form.heroSubtitle,
        },
        channelVisibility: ['website', 'whatsapp'],
        validUntil: toIsoDateTime(form.validUntil),
        offers: [
          {
            offerId: form.selectedOfferId,
            label: selectedOffer?.title,
            badge: form.badge,
            ctaLabel: form.ctaLabel,
          },
        ],
      };

      const response = await fetch('/api/admin/publishing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to create publishing page');
      }

      setNotice('Publishing page created');
      setForm((current) => ({
        ...initialForm,
        selectedOfferId: current.selectedOfferId,
      }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create publishing page');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-circleTel-orange-accessible">
            Product Publishing Studio
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Offer-led product showcase</h1>
          <p className="mt-1 max-w-3xl text-gray-500">
            Publish Teljoy-style pages from approved CircleTel Offers while keeping price, VAT, margin and fulfilment rules in the product catalogue.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={loadData} disabled={loading}>
          <PiArrowsClockwiseBold className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <PiWarningCircleBold className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <PiCheckCircleBold className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{notice}</p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Active Offers" value={offers.length} icon={PiPackageBold} />
            <MetricCard label="Ready To Publish" value={readyOffers.length} icon={PiCheckCircleBold} tone="green" />
            <MetricCard label="Published Pages" value={publishedCampaigns.length} icon={PiGlobeBold} tone="blue" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create publishing page</h2>
                  <p className="mt-1 text-sm text-gray-500">Structured templates for offers, promotions, campaigns and collections.</p>
                </div>
                <Button type="button" variant="outline" onClick={generateDraftCopy}>
                  <PiSparkleBold className="h-4 w-4" />
                  Draft copy
                </Button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                    placeholder="July business fibre deals"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Approved Offer</span>
                  <select
                    value={form.selectedOfferId}
                    onChange={(event) => updateForm('selectedOfferId', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  >
                    <option value="">Select Offer</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>{offer.title}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Page type</span>
                  <select
                    value={form.pageType}
                    onChange={(event) => updateForm('pageType', event.target.value as PageType)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  >
                    {PAGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Template</span>
                  <select
                    value={form.template}
                    onChange={(event) => updateForm('template', event.target.value as TemplateType)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  >
                    {TEMPLATES.map((template) => (
                      <option key={template.value} value={template.value}>{template.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value as CampaignStatus)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Expires</span>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(event) => updateForm('validUntil', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-5">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Summary</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) => updateForm('summary', event.target.value)}
                    className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                    placeholder="Short SEO and listing summary"
                  />
                </label>
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Hero eyebrow</span>
                    <input
                      value={form.heroEyebrow}
                      onChange={(event) => updateForm('heroEyebrow', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                      placeholder="Limited offer"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Hero image URL</span>
                    <input
                      value={form.heroImage}
                      onChange={(event) => updateForm('heroImage', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                      placeholder="https://..."
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Hero headline</span>
                  <input
                    value={form.heroTitle}
                    onChange={(event) => updateForm('heroTitle', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                    placeholder="Upgrade your business connectivity"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Hero supporting copy</span>
                  <textarea
                    value={form.heroSubtitle}
                    onChange={(event) => updateForm('heroSubtitle', event.target.value)}
                    className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                    placeholder="A concise promotional message for the first viewport"
                  />
                </label>
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Offer badge</span>
                    <input
                      value={form.badge}
                      onChange={(event) => updateForm('badge', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                      placeholder="Launch offer"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">CTA label</span>
                    <input
                      value={form.ctaLabel}
                      onChange={(event) => updateForm('ctaLabel', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                      placeholder="Check availability"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Content section heading</span>
                  <input
                    value={form.sectionHeading}
                    onChange={(event) => updateForm('sectionHeading', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Content section body</span>
                  <textarea
                    value={form.sectionBody}
                    onChange={(event) => updateForm('sectionBody', event.target.value)}
                    className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-circleTel-orange focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20"
                    placeholder="Offer benefits, audience, campaign details and sales notes"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Commercial fields stay locked to the selected Offer.
                </p>
                <Button type="submit" variant="cta" disabled={saving}>
                  {saving ? <PiSpinnerBold className="h-4 w-4 animate-spin" /> : <PiMegaphoneBold className="h-4 w-4" />}
                  Create page
                </Button>
              </div>
            </form>

            <aside className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Offer readiness</h2>
                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {offers.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                      No active Offers found.
                    </p>
                  ) : (
                    offers.map((offer) => (
                      <OfferRow
                        key={offer.id}
                        offer={offer}
                        selected={offer.id === form.selectedOfferId}
                        onSelect={() => updateForm('selectedOfferId', offer.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Recent publishing pages</h2>
                <div className="mt-4 space-y-3">
                  {campaigns.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                      No campaign pages created yet.
                    </p>
                  ) : (
                    campaigns.slice(0, 8).map((campaign) => (
                      <div key={campaign.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{campaign.title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {PAGE_PATHS[campaign.page_type]}/{campaign.slug}
                            </p>
                          </div>
                          <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', statusClass(campaign.status))}>
                            {campaign.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <PiCalendarBold className="h-3.5 w-3.5" />
                            {campaign.valid_until ? `Ends ${new Date(campaign.valid_until).toLocaleDateString('en-ZA')}` : 'No expiry'}
                          </p>
                          <Link
                            href={campaignHref(campaign)}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-circleTel-orange hover:text-circleTel-orange-dark"
                          >
                            Open
                            <PiArrowSquareOutBold className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
