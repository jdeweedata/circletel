import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JsonLd } from '@/lib/seo/json-ld';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';
import { Button } from '@/components/ui/button';
import {
  PiWhatsappLogoBold,
  PiMapPinBold,
  PiShieldCheckBold,
  PiWifiHighBold,
  PiBuildingsBold,
  PiUsersBold,
  PiChartBarBold,
  PiCheckCircleBold,
} from 'react-icons/pi';

export const revalidate = 86400; // ISR: revalidate daily

// ---------------------------------------------------------------------------
// Static params — pre-render active zones with high/medium confidence
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  // SUPABASE_SERVICE_ROLE_KEY is a runtime secret — not available during Docker build.
  // Return [] so the build succeeds; pages are generated on first request via ISR.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

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
      `name, suburb, province, coverage_confidence, base_station_count, dfa_connected_count, seo_slug,
       center_lat, center_lng, business_poi_density, pct_no_internet, pct_income_target,
       commercial_property_count, vertical_composition, competitor_weakness_score,
       campaign_tag, arlan_routing`
    )
    .eq('seo_slug', suburb)
    .eq('status', 'active')
    .single();

  if (!zone) {
    notFound();
  }

  const readableName = zone.name || zone.suburb || slugToReadable(suburb);
  const serviceCards = buildServiceCards(zone);

  // Fetch nearby commercial properties for local context
  let commercialProperties: Array<{ name: string; property_type: string; gla_sqm: number | null }> = [];
  if (zone.center_lat && zone.center_lng) {
    const latDelta = 5 / 111; // ~5km radius
    const lngDelta = 5 / (111 * Math.cos((zone.center_lat as number) * Math.PI / 180));
    const { data: props } = await supabase
      .from('commercial_properties')
      .select('name, property_type, gla_sqm')
      .gte('center_lat', (zone.center_lat as number) - latDelta)
      .lte('center_lat', (zone.center_lat as number) + latDelta)
      .gte('center_lng', (zone.center_lng as number) - lngDelta)
      .lte('center_lng', (zone.center_lng as number) + lngDelta)
      .limit(10);
    commercialProperties = props ?? [];
  }

  // Fetch competitor presence for this zone
  let competitorCount = 0;
  if (zone.competitor_weakness_score != null) {
    competitorCount = Math.round((100 - (zone.competitor_weakness_score as number)) / 15);
  }

  // Parse vertical composition
  const verticals = (zone.vertical_composition as Record<string, number>) ?? {};
  const businessCount = (zone.business_poi_density as number) ?? 0;
  const pctNoInternet = (zone.pct_no_internet as number) ?? 0;

  // Build data-driven local context
  const hasLocalData = businessCount > 0 || commercialProperties.length > 0 || pctNoInternet > 0;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Internet Service in ${readableName}`,
    provider: {
      '@type': 'LocalBusiness',
      name: 'CircleTel',
      url: CONTACT.WEBSITE,
      telephone: CONTACT.WHATSAPP_NUMBER,
      email: CONTACT.EMAIL_PRIMARY,
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Gauteng',
        addressCountry: 'ZA',
      },
    },
    serviceType: 'Internet Service Provider',
    areaServed: {
      '@type': 'Place',
      name: readableName,
      ...(zone.province ? { address: { '@type': 'PostalAddress', addressRegion: zone.province, addressCountry: 'ZA' } } : {}),
    },
    description: `Business internet coverage in ${readableName}${zone.province ? `, ${zone.province}` : ''}. Fixed wireless, fibre, and 5G/LTE options available.${businessCount > 0 ? ` Serving ${businessCount}+ businesses in the area.` : ''}`,
    offers: serviceCards.map((card) => ({
      '@type': 'Offer',
      name: card.title,
      description: card.description,
      priceCurrency: 'ZAR',
    })),
  };

  return (
    <>
      <JsonLd data={jsonLdData} />

      {/* Hero — matches /products/[slug] hero pattern */}
      <section className="relative min-h-[500px] h-[55vh] flex items-center overflow-hidden">
        {/* Background gradient layers — same pattern as product pages */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        {/* Subtle dot pattern for visual interest */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Orange glow accent */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-circleTel-orange/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Coverage badge — frosted glass style like product category badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <PiMapPinBold className="w-3.5 h-3.5" />
                {zone.province ?? 'South Africa'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full backdrop-blur-sm border ${
                  zone.coverage_confidence === 'high'
                    ? 'bg-green-500/20 text-green-300 border-green-400/30'
                    : zone.coverage_confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                      : 'bg-white/10 text-white/80 border-white/20'
                }`}
              >
                <PiShieldCheckBold className="w-3.5 h-3.5" />
                {confidenceLabel(zone.coverage_confidence)}
              </span>
            </div>

            {/* H1 — matches product page sizing */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Business Internet in{' '}
              <span className="text-circleTel-orange">{readableName}</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
              Fast, reliable connectivity with local support — no long-term lock-in.
              Check your address to see available packages.
            </p>

            {/* CTA Buttons — same pattern as product pages */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white shadow-lg" asChild>
                <Link href="/">Check My Address</Link>
              </Button>
              <Button size="lg" className="bg-[#25D366] hover:bg-[#1da851] text-white" asChild>
                <a
                  href={getWhatsAppLink(
                    `Hi, I'm interested in business internet in ${readableName}. Can you check coverage for my address?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <PiWhatsappLogoBold className="w-5 h-5" />
                  WhatsApp Us
                </a>
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-4 mt-8 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <PiWifiHighBold className="w-4 h-4" />
                {serviceCards.length} service{serviceCards.length !== 1 ? 's' : ''} available
              </span>
              <span>•</span>
              <span>Same-day quotes</span>
              <span>•</span>
              <span>Local Gauteng support</span>
            </div>
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

      {/* Local Business Landscape — data-driven from Phases 0-3 */}
      {hasLocalData && (
        <section className="py-16 md:py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Business Landscape in {readableName}
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
              {readableName} is a {businessCount > 50 ? 'major' : businessCount > 10 ? 'growing' : ''} business hub
              {zone.province ? ` in ${zone.province}` : ''}.
              {pctNoInternet > 20
                ? ` ${pctNoInternet.toFixed(0)}% of businesses in this area still lack fixed internet connectivity — a significant opportunity for reliable service.`
                : pctNoInternet > 0
                  ? ` Most businesses here are connected, but many are underserved by slow or unreliable providers.`
                  : ''}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {businessCount > 0 && (
                <div className="bg-white rounded-xl p-5 text-center border border-gray-100">
                  <PiBuildingsBold className="w-6 h-6 text-circleTel-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{businessCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Businesses Nearby</p>
                </div>
              )}
              {commercialProperties.length > 0 && (
                <div className="bg-white rounded-xl p-5 text-center border border-gray-100">
                  <PiChartBarBold className="w-6 h-6 text-circleTel-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{commercialProperties.length}</p>
                  <p className="text-sm text-gray-500">Commercial Properties</p>
                </div>
              )}
              {pctNoInternet > 0 && (
                <div className="bg-white rounded-xl p-5 text-center border border-gray-100">
                  <PiWifiHighBold className="w-6 h-6 text-circleTel-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{pctNoInternet.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Without Fixed Internet</p>
                </div>
              )}
              {competitorCount > 0 && (
                <div className="bg-white rounded-xl p-5 text-center border border-gray-100">
                  <PiUsersBold className="w-6 h-6 text-circleTel-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{competitorCount}</p>
                  <p className="text-sm text-gray-500">ISP Competitors</p>
                </div>
              )}
            </div>

            {/* Vertical breakdown */}
            {Object.keys(verticals).length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Sectors in {readableName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(verticals)
                    .filter(([, count]) => (count as number) > 0)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([vertical, count]) => {
                      const labels: Record<string, string> = {
                        fleet_logistics: 'Fleet & Logistics',
                        security: 'Security',
                        hospitality: 'Hospitality & Food',
                        retail_chain: 'Retail Chains',
                        industrial: 'Industrial',
                      };
                      return (
                        <div key={vertical} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-sm text-gray-700">{labels[vertical] ?? vertical}</span>
                          <span className="text-sm font-semibold text-gray-900">{count as number}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Commercial properties nearby */}
            {commercialProperties.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commercial Properties Nearby</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commercialProperties.map((prop) => {
                    const typeLabels: Record<string, string> = {
                      office_park: 'Office Park',
                      retail_centre: 'Retail Centre',
                      industrial_park: 'Industrial Park',
                      mixed_use: 'Mixed Use',
                    };
                    return (
                      <div key={prop.name} className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3">
                        <PiBuildingsBold className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{prop.name}</p>
                          <p className="text-xs text-gray-500">
                            {typeLabels[prop.property_type] ?? prop.property_type}
                            {prop.gla_sqm ? ` · ${prop.gla_sqm.toLocaleString()} m²` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why CircleTel — data-driven value props */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Why Businesses in {readableName} Choose CircleTel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PiMapPinBold className="w-6 h-6 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Support</h3>
              <p className="text-gray-600 text-sm">
                Based in Gauteng with a dedicated team. WhatsApp us anytime at {CONTACT.WHATSAPP_NUMBER} —
                no call centres, no ticket queues.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PiShieldCheckBold className="w-6 h-6 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lock-in Contracts</h3>
              <p className="text-gray-600 text-sm">
                {competitorCount >= 4
                  ? `With ${competitorCount} ISPs operating in ${readableName}, we earn your business monthly. Cancel anytime.`
                  : `Month-to-month flexibility. We earn your business every month — no penalties, no exit fees.`}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PiCheckCircleBold className="w-6 h-6 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Installation</h3>
              <p className="text-gray-600 text-sm">
                {(zone.base_station_count as number) > 0
                  ? 'SkyFibre wireless — installed in 3-5 business days. No trenching, no waiting for fibre.'
                  : 'MTN Business 5G/LTE — active same day. No installation wait, no infrastructure delays.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to get connected in {readableName}?
          </h2>
          <p className="text-slate-300 mb-8">
            Enter your address to see exact coverage and available packages for your location.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white shadow-lg" asChild>
              <Link href="/">Check Coverage & Order</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900" asChild>
              <a
                href={getWhatsAppLink(
                  `Hi, I'd like to get business internet in ${readableName}. Please help me get started.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <PiWhatsappLogoBold className="w-5 h-5" />
                WhatsApp Us
              </a>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-6">
            {CONTACT.SUPPORT_HOURS} &middot; {CONTACT.WHATSAPP_NUMBER}
          </p>
        </div>
      </section>
    </>
  );
}
