import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OfferTabs } from '@/components/offers/OfferTabs';
import { listPublicOffers } from '@/lib/offers/public-read';
import { offersItemListJsonLd } from '@/lib/offers/offer-jsonld';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Plans & Pricing | CircleTel',
  description: 'Browse CircleTel connectivity plans with transparent, VAT-inclusive pricing.',
};

export default async function OffersPage() {
  const offers = await listPublicOffers('all');
  const jsonLd = offersItemListJsonLd(offers);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="mb-2 text-center text-4xl font-bold text-circleTel-navy">
          Plans &amp; <span className="text-circleTel-orange">Pricing</span>
        </h1>
        <p className="mb-12 text-center text-circleTel-secondaryNeutral">
          Transparent pricing, VAT included. No surprises.
        </p>
        <OfferTabs offers={offers} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
