import { ENTERTAINMENT_BUNDLES } from '@/lib/data/entertainment-bundles'
import { BundleCard } from './BundleCard'

export function BundleGrid() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1B2A4A]">
          Choose Your Entertainment Bundle
        </h2>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          Pick a Mecool device + CircleTel internet — delivered to your door.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ENTERTAINMENT_BUNDLES.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </section>
  )
}
