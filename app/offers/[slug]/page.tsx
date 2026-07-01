import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPublicOfferBySlug } from '@/lib/offers/public-read';
import { offerProductJsonLd } from '@/lib/offers/offer-jsonld';

// Renders at request time — offer data is read from Supabase, which is not
// available at build time (no key in the build env). See PR #587 build failure.
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Do not enumerate slugs at build time (would hit Supabase without a key).
  return [];
}

export default async function OfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
