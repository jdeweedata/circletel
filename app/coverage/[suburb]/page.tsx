import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JsonLd } from '@/lib/seo/json-ld';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';

export const revalidate = 86400; // ISR: revalidate daily

// ---------------------------------------------------------------------------
// Static params — pre-render active zones with high/medium confidence
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sales_zones')
    .select('seo_slug')
    .eq('status', 'active')
    .not('seo_slug', 'is', null)
    .in('coverage_confidence', ['high', 'medium']);

  return (data ?? [])
    .filter((z) => z.seo_slug)
    .map((z) => ({ suburb: z.seo_slug! }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugToReadable(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function confidenceLabel(confidence: string | null): string {
  switch (confidence) {
    case 'high':
      return 'Full Coverage';
    case 'medium':
      return 'Partial Coverage';
    case 'low':
      return 'Limited Coverage';
    default:
      return 'Coverage Available';
  }
}

function confidenceBadgeClass(confidence: string | null): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ suburb: string }>;
}): Promise<Metadata> {
  const { suburb } = await params;
  const readableName = slugToReadable(suburb);

  return {
    title: `Internet Coverage in ${readableName} | CircleTel`,
    description: `Check business internet availability in ${readableName}. SkyFibre wireless, fibre & MTN 5G/LTE options. Get connected — WhatsApp ${CONTACT.WHATSAPP_NUMBER} or check your address online.`,
    openGraph: {
      title: `Internet Coverage in ${readableName} | CircleTel`,
      description: `Business internet packages available in ${readableName}. Check coverage and get connected today.`,
      url: `${CONTACT.WEBSITE}/coverage/${suburb}`,
      siteName: 'CircleTel',
      type: 'website',
    },
    alternates: {
      canonical: `${CONTACT.WEBSITE}/coverage/${suburb}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Service card data
// ---------------------------------------------------------------------------
interface ServiceCard {
  title: string;
  description: string;
  tiers: { speed: string; price: string }[];
  highlight?: string;
}

function buildServiceCards(zone: {
  base_station_count: number | null;
  dfa_connected_count: number | null;
}): ServiceCard[] {
  const cards: ServiceCard[] = [];

  if (zone.base_station_count && zone.base_station_count > 0) {
    cards.push({
      title: 'SkyFibre Wireless',
      description:
        'Fixed wireless broadband powered by Tarana technology. Dedicated business-grade connectivity with symmetric options.',
      tiers: [
        { speed: '50/12.5 Mbps', price: 'R1,299/mo' },
        { speed: '100/25 Mbps', price: 'R1,499/mo' },
        { speed: '200/50 Mbps', price: 'R1,899/mo' },
      ],
      highlight: 'No trenching required',
    });
  }

  if (zone.dfa_connected_count && zone.dfa_connected_count > 0) {
    cards.push({
      title: 'BizFibreConnect',
      description:
        'Dark Fibre Africa enterprise fibre with symmetric speeds. Ultra-low latency for mission-critical applications.',
      tiers: [
        { speed: '100/100 Mbps', price: 'R2,999/mo' },
        { speed: '200/200 Mbps', price: 'R4,499/mo' },
      ],
      highlight: 'Symmetric speeds',
    });
  }

  // MTN Business 5G/LTE is always available nationally
  cards.push({
    title: 'MTN Business 5G/LTE',
    description:
      'National LTE and 5G coverage for data, backup connectivity, fleet management, and IoT solutions.',
    tiers: [
      { speed: 'Data from', price: 'R574/mo' },
      { speed: 'Backup from', price: 'R459/mo' },
      { speed: 'IoT from', price: 'R114/mo' },
    ],
    highlight: 'National coverage',
  });

  return cards;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function SuburbCoveragePage({
  params,
}: {
  params: Promise<{ suburb: string }>;
}) {
  const { suburb } = await params;

  const supabase = await createClient();
  const { data: zone } = await supabase
    .from('sales_zones')
    .select(
      'name, suburb, province, coverage_confidence, base_station_count, dfa_connected_count, seo_slug'
    )
    .eq('seo_slug', suburb)
    .eq('status', 'active')
    .single();

  if (!zone) {
    notFound();
  }

  const readableName = zone.name || zone.suburb || slugToReadable(suburb);
  const serviceCards = buildServiceCards(zone);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Internet Service in ${readableName}`,
    provider: {
      '@type': 'Organization',
      name: 'CircleTel',
      url: CONTACT.WEBSITE,
    },
    serviceType: 'Internet Service Provider',
    areaServed: {
      '@type': 'Place',
      name: readableName,
      ...(zone.province ? { address: { '@type': 'PostalAddress', addressRegion: zone.province } } : {}),
    },
    description: `Business internet coverage in ${readableName}${zone.province ? `, ${zone.province}` : ''}. Fixed wireless, fibre, and 5G/LTE options available.`,
  };

  return (
    <>
      <JsonLd data={jsonLdData} />

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {zone.province && (
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-3">
              {zone.province}
            </p>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Business Internet Available in{' '}
            <span className="text-circleTel-orange">{readableName}</span>
          </h1>

          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 ${confidenceBadgeClass(zone.coverage_confidence)}`}
          >
            {confidenceLabel(zone.coverage_confidence)}
          </span>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Fast, reliable business internet with local support.
            Check your exact address to see available packages.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/order/coverage"
              className="px-8 py-4 bg-circleTel-orange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              Check My Address
            </Link>
            <a
              href={getWhatsAppLink(
                `Hi, I'm interested in business internet in ${readableName}. Can you check coverage for my address?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-slate-900 transition-colors"
            >
              WhatsApp {CONTACT.WHATSAPP_NUMBER}
            </a>
          </div>
        </div>
      </section>

      {/* Available Services */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
            Available Services in {readableName}
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Choose the connectivity solution that fits your business. All plans include local support
            and no long-term lock-in contracts.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map((card) => (
              <div
                key={card.title}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                {card.highlight && (
                  <span className="inline-block px-2 py-0.5 bg-circleTel-orange/10 text-circleTel-orange text-xs font-semibold rounded mb-3">
                    {card.highlight}
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                <ul className="space-y-2">
                  {card.tiers.map((tier) => (
                    <li
                      key={tier.speed}
                      className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                    >
                      <span className="text-gray-700">{tier.speed}</span>
                      <span className="font-semibold text-gray-900">
                        {tier.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to get connected?
          </h2>
          <p className="text-gray-600 mb-8">
            Enter your address to see exact coverage and available packages for your
            location in {readableName}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/order/coverage"
              className="px-8 py-4 bg-circleTel-orange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              Check Coverage
            </Link>
            <a
              href={getWhatsAppLink(
                `Hi, I'd like to get business internet in ${readableName}. Please help me get started.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-circleTel-orange text-circleTel-orange rounded-lg font-bold text-lg hover:bg-circleTel-orange hover:text-white transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
