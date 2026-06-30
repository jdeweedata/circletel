import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import {
  PiArrowRightBold,
  PiCalendarBold,
  PiCheckCircleBold,
  PiGlobeBold,
  PiLightningBold,
  PiShoppingCartBold,
} from 'react-icons/pi';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getWhatsAppLink } from '@/lib/constants/contact';
import type {
  PublicCampaignOfferSlot,
  PublicCampaignPage,
} from '@/lib/publishing/public-read';

function formatPrice(amount: number) {
  return amount.toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function ctaHref(page: PublicCampaignPage, slot: PublicCampaignOfferSlot) {
  const params = new URLSearchParams({
    offer: slot.offer.slug,
    campaign: page.slug,
  });

  return `/coverage-check?${params.toString()}`;
}

function whatsappHref(page: PublicCampaignPage, slot?: PublicCampaignOfferSlot) {
  const offerText = slot ? ` about ${slot.offer.title}` : '';
  return getWhatsAppLink(`Hi CircleTel, I am interested${offerText} from ${page.title}.`);
}

function OfferShowcaseCard({
  page,
  slot,
  featured = false,
}: {
  page: PublicCampaignPage;
  slot: PublicCampaignOfferSlot;
  featured?: boolean;
}) {
  const actionLabel = slot.ctaLabel ?? 'Check availability';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-circleTel-orange hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-gradient-card">
        {slot.offer.image ? (
          <img
            src={slot.offer.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-circleTel-orange-light px-6 text-center">
            <PiGlobeBold className="h-12 w-12 text-circleTel-orange" />
          </div>
        )}
        {(slot.badge || featured) && (
          <span className="absolute left-4 top-4 rounded-full bg-circleTel-navy px-3 py-1 text-xs font-semibold text-white">
            {slot.badge ?? 'Featured'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {slot.slotLabel && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-circleTel-orange-accessible">
            {slot.slotLabel}
          </p>
        )}
        <h3 className="text-lg font-bold text-circleTel-navy">{slot.offer.title}</h3>
        {slot.offer.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
            {slot.offer.description}
          </p>
        )}

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</p>
          <p className="text-3xl font-bold text-circleTel-orange">
            {formatPrice(slot.offer.priceInclVat)}
          </p>
          <p className="text-xs text-gray-500">{slot.offer.vatLabel}</p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href={ctaHref(page, slot)}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-circleTel-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-circleTel-orange-dark"
          >
            {actionLabel}
          </Link>
          <Link
            href={`/offers/${slot.offer.slug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-circleTel-orange px-4 py-2 text-sm font-semibold text-circleTel-orange transition hover:bg-circleTel-orange-light"
          >
            View offer
          </Link>
        </div>

        <a
          href={whatsappHref(page, slot)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-circleTel-navy transition hover:border-[#25D366] hover:text-[#128C7E]"
        >
          <FaWhatsapp className="h-4 w-4" />
          WhatsApp sales
        </a>
      </div>
    </article>
  );
}

function Hero({ page }: { page: PublicCampaignPage }) {
  const primarySlot = page.offers[0];

  return (
    <section className="relative overflow-hidden bg-circleTel-navy text-white">
      {page.hero.image && (
        <img
          src={page.hero.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-circleTel-navy/80" />
      <div className="container relative mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl">
          {page.hero.eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-circleTel-lightNeutral">
              <PiLightningBold className="h-4 w-4 text-circleTel-orange" />
              {page.hero.eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {page.hero.title}
          </h1>
          {(page.hero.subtitle || page.summary) && (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
              {page.hero.subtitle ?? page.summary}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {primarySlot && (
              <Link
                href={ctaHref(page, primarySlot)}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-circleTel-orange px-6 py-3 font-semibold text-white transition hover:bg-circleTel-orange-dark"
              >
                {primarySlot.ctaLabel ?? 'Check availability'}
                <PiArrowRightBold className="ml-2 h-4 w-4" />
              </Link>
            )}
            <a
              href={whatsappHref(page, primarySlot)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              <FaWhatsapp className="h-5 w-5" />
              WhatsApp sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignSections({ page }: { page: PublicCampaignPage }) {
  if (page.sections.length === 0) return null;

  return (
    <section className="bg-white py-14">
      <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-2">
        {page.sections.map((section) => (
          <div key={`${section.heading}-${section.body}`} className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-circleTel-navy">{section.heading}</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-gray-600">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OfferGrid({ page }: { page: PublicCampaignPage }) {
  if (page.offers.length === 0) return null;

  return (
    <section className="bg-gray-50 py-14">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-circleTel-orange-accessible">
              Approved Offers
            </p>
            <h2 className="mt-2 text-3xl font-bold text-circleTel-navy">Choose your fit</h2>
          </div>
          {page.validUntil && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
              <PiCalendarBold className="h-4 w-4 text-circleTel-orange" />
              Ends {formatDate(page.validUntil)}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {page.offers.map((slot, index) => (
            <OfferShowcaseCard
              key={`${slot.offer.slug}-${index}`}
              page={page}
              slot={slot}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { label: 'Approved commercial truth', icon: PiCheckCircleBold },
    { label: 'VAT-inclusive public pricing', icon: PiShoppingCartBold },
    { label: 'Sales-ready WhatsApp sharing', icon: FaWhatsapp },
  ];

  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="container mx-auto grid gap-4 px-4 py-6 md:grid-cols-3">
        {items.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 text-sm font-semibold text-circleTel-navy">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-circleTel-orange-light text-circleTel-orange">
              <Icon className="h-5 w-5" />
            </span>
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CampaignShowcase({ page }: { page: PublicCampaignPage }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero page={page} />
        <TrustStrip />
        {page.template === 'campaign_article' ? (
          <>
            <CampaignSections page={page} />
            <OfferGrid page={page} />
          </>
        ) : (
          <>
            <OfferGrid page={page} />
            <CampaignSections page={page} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
