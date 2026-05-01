import { Metadata } from 'next'
import Link from 'next/link'
import { TOWNS, type TownData } from '@/lib/location-pages/towns'

export const metadata: Metadata = {
  title: 'Business Internet — West Coast Towns | CircleTel',
  description:
    'CircleTel serves 27 West Coast towns with Tarana FWA and MTN Business LTE. ' +
    'Find your town and see how much you could save by switching to business-grade internet.',
  alternates: {
    canonical: 'https://www.circletel.co.za/locations',
  },
  openGraph: {
    title: 'Business Internet — West Coast Towns | CircleTel',
    description:
      'CircleTel serves 27 West Coast towns with Tarana FWA and MTN Business LTE. ' +
      'Find your town and see how much you could save by switching to business-grade internet.',
    url: 'https://www.circletel.co.za/locations',
  },
}

function CoveragePill({ flag }: { flag: TownData['coverage_flag'] }) {
  if (flag === 'covered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Tarana FWA
      </span>
    )
  }
  if (flag === 'possible') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Coverage Check
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      MTN LTE/5G
    </span>
  )
}

const covered = TOWNS.filter((t) => t.coverage_flag === 'covered')
const possible = TOWNS.filter((t) => t.coverage_flag === 'possible')
const outOfRange = TOWNS.filter((t) => t.coverage_flag === 'out_of_range')

function TownCard({ town }: { town: TownData }) {
  return (
    <Link
      href={`/locations/${town.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-[#1B2A4A] group-hover:text-[#E87A1E] transition-colors">
          {town.name}
        </h3>
        <CoveragePill flag={town.coverage_flag} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <dt className="text-slate-500">Local businesses</dt>
          <dd className="font-medium text-slate-800">{town.contracts}</dd>
        </div>
        {town.avg_monthly_fee_rands > 0 && (
          <div>
            <dt className="text-slate-500">Avg current fee</dt>
            <dd className="font-medium text-slate-800">R{town.avg_monthly_fee_rands}/mo</dd>
          </div>
        )}
        {town.avg_monthly_saving_rands > 0 && (
          <div className="col-span-2">
            <dt className="text-slate-500">Potential saving</dt>
            <dd className="font-medium text-green-700">R{town.avg_monthly_saving_rands}/mo</dd>
          </div>
        )}
      </dl>

      <span className="mt-auto text-xs font-medium text-[#E87A1E] group-hover:underline">
        View coverage →
      </span>
    </Link>
  )
}

function TownGroup({ title, towns, description }: { title: string; towns: TownData[]; description: string }) {
  if (towns.length === 0) return null
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1B2A4A]">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {towns.map((town) => (
          <TownCard key={town.slug} town={town} />
        ))}
      </div>
    </section>
  )
}

export default function LocationsHubPage() {
  const totalContracts = TOWNS.reduce((sum, t) => sum + t.contracts, 0)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1B2A4A] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-orange-300">
            West Coast Coverage
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Business internet across{' '}
            <span className="text-[#E87A1E]">{TOWNS.length} West Coast towns</span>
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            CircleTel covers the West Coast with Tarana FWA licensed spectrum and MTN Business
            LTE/5G. Our data shows {totalContracts}+ local businesses on shared wireless — many
            overpaying by R100–R400 per month for a connection with no SLA.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-2xl font-bold text-white">{TOWNS.length}</span>
              <span className="ml-1.5 text-slate-400">towns covered</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{totalContracts}+</span>
              <span className="ml-1.5 text-slate-400">businesses identified</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">R449</span>
              <span className="ml-1.5 text-slate-400">/mo entry price</span>
            </div>
          </div>
        </div>
      </section>

      {/* Town grid */}
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        <TownGroup
          title="Tarana FWA Available"
          towns={covered}
          description="These towns have a Tarana base station within 10 km. Dedicated licensed spectrum, no peak-hour congestion, SLA-backed."
        />
        <TownGroup
          title="Coverage Check Required"
          towns={possible}
          description="These towns are within 10–15 km of a base station. A free site survey will confirm line-of-sight."
        />
        <TownGroup
          title="MTN Business LTE/5G"
          towns={outOfRange}
          description="Outside Tarana range but still served by MTN Business LTE/5G — a meaningful upgrade on congested shared wireless."
        />

        {/* Bottom CTA */}
        <section className="rounded-2xl bg-[#1B2A4A] px-8 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Not sure which option fits your town?</h2>
          <p className="mt-2 text-slate-300">
            Run a coverage check — it takes 30 seconds and shows you exactly what&apos;s available
            at your address.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/coverage"
              className="rounded-lg bg-[#E87A1E] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#C45A30]"
            >
              Check My Coverage
            </Link>
            <Link
              href="https://wa.me/27824873900?text=Hi+CircleTel%2C+I%27d+like+to+know+what%27s+available+in+my+West+Coast+town."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20"
            >
              WhatsApp Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
