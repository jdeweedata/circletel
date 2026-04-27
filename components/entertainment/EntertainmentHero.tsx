'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PiSparkle, PiWhatsappLogoBold } from 'react-icons/pi'
import { CoverageCheckModal } from './CoverageCheckModal'
import { ENTERTAINMENT_BUNDLES } from '@/lib/data/entertainment-bundles'

export function EntertainmentHero() {
  const [modalOpen, setModalOpen] = useState(false)
  const featuredBundle = ENTERTAINMENT_BUNDLES.find(b => b.badge === 'Most Popular') ?? ENTERTAINMENT_BUNDLES[0]
  const waMessage = encodeURIComponent("Hi, I'm interested in the CircleTel Entertainment Bundle")

  return (
    <>
      <section className="bg-[#1B2A4A] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div className="flex flex-col gap-5">
              <div>
                <Badge className="bg-[#F5831F] text-white text-xs font-semibold px-3 py-1.5 mb-4 inline-flex items-center gap-1.5">
                  <PiSparkle className="h-3.5 w-3.5" />
                  New — Entertainment Bundles
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  Stream Everything.<br />Pay Less.
                </h1>
              </div>
              <p className="text-lg text-white/80 max-w-md">
                Bundle a Mecool Android TV device with CircleTel internet from{' '}
                <span className="text-[#F5831F] font-semibold">R499/mo</span>.
                No lock-in contracts. Free delivery.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-[#F5831F] hover:bg-orange-600 text-white font-semibold px-8"
                  onClick={() => setModalOpen(true)}
                >
                  Check Coverage
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 gap-2"
                  asChild
                >
                  <a
                    href={`https://wa.me/27824873900?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PiWhatsappLogoBold className="h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/entertainment/entertainment-hero.jpg"
                alt="Mecool KM7 Plus and KS3 Soundbar — CircleTel Entertainment Bundle"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <CoverageCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        bundle={featuredBundle}
      />
    </>
  )
}
