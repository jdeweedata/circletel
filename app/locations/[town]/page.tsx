import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TOWNS, getTownBySlug, type TownData } from '@/lib/location-pages/towns'
import { CONTACT } from '@/lib/constants/contact'

type Params = { town: string }

export async function generateStaticParams() {
  return TOWNS.map((t) => ({ town: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { town: slug } = await params
  const town = getTownBySlug(slug)
  if (!town) return { title: 'Not Found' }

  const title = `Business Internet in ${town.name} — CircleTel West Coast`
  const description =
    `${town.contracts} businesses in ${town.name} are paying for shared wireless without an SLA. ` +
    `CircleTel offers faster, SLA-backed business connectivity from R449/month. ` +
    `Switch in 30 days — no lock-in.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.circletel.co.za/locations/${town.slug}`,
    },
    alternates: {
      canonical: `https://www.circletel.co.za/locations/${town.slug}`,
    },
  }
}

function CoverageBadge({ flag }: { flag: TownData['coverage_flag'] }) {
  if (flag === 'covered') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Tarana FWA Available
      </span>
    )
  }
  if (flag === 'possible') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Tarana FWA — Coverage Check Required
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
      <span className="h-2 w-2 rounded-full bg-blue-500" />
      MTN Business LTE/5G Available
    </span>
  )
}

function ProductSection({ town }: { town: TownData }) {
  if (town.coverage_flag === 'covered') {
    return (
      <div className="rounded-2xl border border-[#E87A1E]/30 bg-[#FDF2E9] p-6">
        <h3 className="mb-3 text-lg font-bold text-[#1B2A4A]">
          Tarana FWA — Dedicated Licensed Spectrum
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#E87A1E]">✓</span>
            Licensed spectrum — no shared congestion, no peak-hour slowdown
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#E87A1E]">✓</span>
            SLA-backed uptime guarantee — in writing
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#E87A1E]">✓</span>
            MTN 5G failover included — stays up when your primary link doesn't
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#E87A1E]">✓</span>
            Local CircleTel team, same-day response — not a call centre
          </li>
        </ul>
        <p className="mt-4 text-sm font-semibold text-[#1B2A4A]">
          From R449/month — installation usually within 5 business days in {town.name}.
        </p>
      </div>
    )
  }

  if (town.coverage_flag === 'possible') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h3 className="mb-3 text-lg font-bold text-[#1B2A4A]">
          Tarana FWA — Likely Available in {town.name}
        </h3>
        <p className="mb-3 text-sm text-gray-700">
          Our nearest base station is {town.nearest_bn_distance_km}km from {town.name}. Tarana
          coverage depends on line-of-sight to your specific address. A free site survey confirms
          availability in under 24 hours.
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-600">✓</span>
            Free site survey — no commitment required
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-600">✓</span>
            MTN Business LTE/5G as fallback if Tarana is not line-of-sight
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
      <h3 className="mb-3 text-lg font-bold text-[#1B2A4A]">
        MTN Business LTE/5G — Business-Grade Wireless
      </h3>
      <ul className="space-y-2 text-sm text-gray-700">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-blue-600">✓</span>
          MTN Business SLA — not consumer LTE
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-blue-600">✓</span>
          Managed by CircleTel — local support, single point of contact
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-blue-600">✓</span>
          No long lock-in — 30-day switch guarantee
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-blue-600">✓</span>
          Competitive pricing vs your current provider — get a quote and compare
        </li>
      </ul>
      <p className="mt-4 text-sm font-semibold text-[#1B2A4A]">
        From R449/month for business-grade LTE in {town.name}.
      </p>
    </div>
  )
}

export default async function TownPage({ params }: { params: Promise<Params> }) {
  const { town: slug } = await params
  const town = getTownBySlug(slug)
  if (!town) notFound()

  const whatsappMsg = encodeURIComponent(
    `Hi CircleTel, I'm in ${town.name} and looking for better business internet. I'd like to know what's available and what I'd pay.`
  )
  const whatsappUrl = `${CONTACT.WHATSAPP_LINK}?text=${whatsappMsg}`

  const showSaving = town.avg_monthly_saving_rands > 0
  const annualSaving = town.avg_monthly_saving_rands * 12

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2A4A] to-[#0F1427] px-4 pb-16 pt-20 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4">
            <CoverageBadge flag={town.coverage_flag} />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Business Internet in {town.name}
            <br />
            <span className="text-[#E87A1E]">Faster. Cheaper. Local.</span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-gray-300">
            {town.contracts} businesses in {town.name} are paying for shared wireless that slows
            down at peak hours — with no SLA and no local support team.
            {town.avg_monthly_fee_rands > 0 &&
              ` The average bill is R${town.avg_monthly_fee_rands}/month.`}{' '}
            CircleTel gives you dedicated connectivity with a written SLA — from R449/month.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/coverage?town=${town.slug}&lat=${town.centroid_lat}&lng=${town.centroid_lng}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#E87A1E] px-6 py-3 font-semibold text-white transition hover:bg-[#C45A30]"
            >
              Check Coverage in {town.name}
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Savings callout — only show when saving is meaningful */}
      {showSaving && (
        <section className="border-b border-[#E87A1E]/20 bg-[#FDF2E9] px-4 py-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-2xl font-bold text-[#1B2A4A]">
              Businesses in {town.name} that made the switch save an average of{' '}
              <span className="text-[#E87A1E]">R{town.avg_monthly_saving_rands}/month</span>
              {annualSaving > 0 && (
                <span className="block text-lg font-semibold text-gray-600 mt-1">
                  That&apos;s R{annualSaving.toLocaleString()} per year back in your business.
                </span>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Comparison table */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-[#1B2A4A]">
            Shared Wireless vs CircleTel — Side by Side
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Feature</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Shared Wireless</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#E87A1E]">CircleTel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-700">Monthly price</td>
                  <td className="px-6 py-4 text-gray-500">
                    {town.avg_monthly_fee_rands > 0
                      ? `~R${town.avg_monthly_fee_rands}/mo avg in ${town.name}`
                      : 'Not publicly listed'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1B2A4A]">From R449/month</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-700">Spectrum type</td>
                  <td className="px-6 py-4 text-gray-500">Unlicensed shared (congestion at peak)</td>
                  <td className="px-6 py-4 font-semibold text-green-700">
                    {town.coverage_flag !== 'out_of_range'
                      ? 'Licensed dedicated — no sharing'
                      : 'MTN Business LTE (managed SLA)'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-700">SLA guarantee</td>
                  <td className="px-6 py-4 text-gray-500">Not advertised</td>
                  <td className="px-6 py-4 font-semibold text-green-700">
                    Included — in writing
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-700">Support</td>
                  <td className="px-6 py-4 text-gray-500">
                    Customers report billing surprises, slow response times, unexplained outages
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-700">
                    Local CircleTel team, same-day response
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-700">Contract lock-in</td>
                  <td className="px-6 py-4 text-gray-500">12–24 month contracts observed</td>
                  <td className="px-6 py-4 font-semibold text-green-700">
                    30-day switch — no penalty
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-700">Failover</td>
                  <td className="px-6 py-4 text-gray-500">None included</td>
                  <td className="px-6 py-4 font-semibold text-green-700">
                    MTN 5G failover included
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Product pitch — conditional on coverage */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-[#1B2A4A]">
            What CircleTel offers in {town.name}
          </h2>
          <ProductSection town={town} />
        </div>
      </section>

      {/* Local stats */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-[#1B2A4A]">
            Why {town.name} businesses are switching
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-extrabold text-[#E87A1E]">
                {town.contracts}
              </div>
              <div className="text-sm text-gray-600">
                businesses in {town.name} on shared wireless — most without a written SLA
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-extrabold text-[#E87A1E]">2.1/5</div>
              <div className="text-sm text-gray-600">
                average customer satisfaction score for shared wireless ISPs in South Africa
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mb-2 text-4xl font-extrabold text-[#E87A1E]">30</div>
              <div className="text-sm text-gray-600">
                days to switch — CircleTel installs everything and handles the cancellation process
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to switch in {town.name}?
          </h2>
          <p className="mb-8 text-gray-300">
            Check if CircleTel covers your address — takes 30 seconds. Or WhatsApp us directly and
            we&apos;ll run a quote for your specific location.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/coverage?town=${town.slug}&lat=${town.centroid_lat}&lng=${town.centroid_lng}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#E87A1E] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#C45A30]"
            >
              Check Coverage
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
            >
              WhatsApp: 082 487 3900
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Local West Coast team · Mon–Fri 8am–5pm · No hard sell
          </p>
        </div>
      </section>

      {/* Breadcrumb-style nav back to locations */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/locations" className="text-sm text-gray-500 hover:text-[#E87A1E]">
            ← All West Coast towns
          </Link>
        </div>
      </div>
    </main>
  )
}
