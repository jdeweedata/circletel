import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublicOfferBySlug, listPublicOffers } from '@/lib/offers/public-read';
import { offerProductJsonLd } from '@/lib/offers/offer-jsonld';
import { CampaignShowcase } from '@/components/publishing/CampaignShowcase';
import { getPublicCampaignBySlug, listPublicCampaigns } from '@/lib/publishing/public-read';

export const revalidate = 300;

export async function generateStaticParams() {
  const [offers, offerPages] = await Promise.all([
    listPublicOffers('all'),
    listPublicCampaigns('offer'),
  ]);
  const slugs = new Set([
    ...offers.map((o) => o.slug),
    ...offerPages.map((page) => page.slug),
  ]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaignPage = await getPublicCampaignBySlug(slug, 'offer');
  if (campaignPage) {
    return {
      title: campaignPage.seo.title ?? campaignPage.title,
      description: campaignPage.seo.description ?? campaignPage.summary,
    };
  }

  const offer = await getPublicOfferBySlug(slug);
  if (!offer) return {};

  return {
    title: offer.title,
    description: offer.description,
  };
}

export default async function OfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaignPage = await getPublicCampaignBySlug(slug, 'offer');
  if (campaignPage) return <CampaignShowcase page={campaignPage} />;

  const offer = await getPublicOfferBySlug(slug);
  if (!offer) notFound();

  const jsonLd = offerProductJsonLd(offer);
  const ctaHref = `/coverage-check?offer=${encodeURIComponent(offer.slug)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-circleTel-navy">{offer.title}</h1>
        {offer.description && (
          <p className="mt-4 max-w-2xl text-circleTel-secondaryNeutral">{offer.description}</p>
        )}
        <div className="mt-6">
          <span className="text-4xl font-bold text-circleTel-orange">
            R{offer.priceInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </span>
          <span className="ml-2 text-sm text-circleTel-secondaryNeutral">{offer.vatLabel}</span>
        </div>
        <Link
          href={ctaHref}
          className="mt-8 inline-block rounded-lg bg-circleTel-orange px-6 py-3 font-semibold text-white hover:bg-circleTel-orange-dark"
        >
          Check availability
        </Link>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
