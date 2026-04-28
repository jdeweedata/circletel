import { FEATURED_DEVICES } from '@/lib/data/mtn-business-deals'
import { FeaturedDeviceCard } from './FeaturedDeviceCard'

export function FeaturedDeviceGrid() {
  return (
    <section className="bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h2 className="font-heading font-black text-2xl text-[#1B2A4A]">Featured devices</h2>
          <p className="text-gray-500 text-sm mt-1">
            Contract pricing shown is the minimum plan rate. Final repayment depends on device, plan, and term.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURED_DEVICES.map((device) => (
            <FeaturedDeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>
    </section>
  )
}
