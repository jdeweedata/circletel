import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EntertainmentHero } from '@/components/entertainment/EntertainmentHero'
import { BundleGrid } from '@/components/entertainment/BundleGrid'
import { PiWhatsappLogoBold } from 'react-icons/pi'

export const metadata: Metadata = {
  title: 'Entertainment Bundles | Stream Everything. Pay Less. | CircleTel',
  description:
    'Bundle a Mecool Android TV device with CircleTel internet from R499/mo. No lock-in contracts. Free delivery. Check coverage today.',
  openGraph: {
    title: 'Stream Everything. Pay Less.',
    description: 'Mecool Android TV + CircleTel internet from R499/mo',
    images: ['/images/entertainment/entertainment-hero.jpg'],
  },
}

export default function EntertainmentPage() {
  const waMessage = encodeURIComponent(
    "Hi, I'm interested in the CircleTel Entertainment Bundle"
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Zone 1: Hero Banner */}
        <EntertainmentHero />

        {/* Zone 2: Promo Strip */}
        <div className="bg-[#F5831F] text-white py-3 px-4 text-center text-sm font-medium">
          Free delivery on all entertainment bundles · No lock-in contracts · Setup in 24 hours
        </div>

        {/* Zone 3: Bundle Grid */}
        <BundleGrid />

        {/* Zone 4: Bottom CTA Strip */}
        <section className="bg-[#F5831F] text-white py-12 px-4">
          <div className="container mx-auto text-center max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Not sure which bundle suits you?
            </h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">
              Our team can help you choose the right device and plan for your home.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`https://wa.me/27824873900?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#F5831F] hover:bg-gray-50 font-semibold px-6 py-3 rounded-md transition-colors"
              >
                <PiWhatsappLogoBold className="h-5 w-5" />
                WhatsApp Us
              </a>
              <a
                href="/products"
                className="inline-flex items-center gap-2 border border-white/60 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-md transition-colors text-sm"
              >
                View all internet plans
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
