'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PiWhatsappLogoBold, PiArrowRightBold } from 'react-icons/pi'
import { CONTACT } from '@/lib/constants/contact'
import { BusinessDealModal } from './BusinessDealModal'

const HERO_DEAL = { id: 'hero-cta', name: 'MTN Business Deal', monthly_incl_vat: 129 }

export function BusinessDealsHero() {
  const [modalOpen, setModalOpen] = useState(false)
  const waMessage = encodeURIComponent("Hi, I'd like to find out more about CircleTel Business Mobile deals.")

  return (
    <>
      <section className="bg-[#1B2A4A] text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-[#F5831F] font-semibold text-sm uppercase tracking-widest mb-3">
              MTN Enterprise · April 2026 Deals
            </p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl leading-none mb-4">
              Business mobile.
              <br />
              <span className="text-[#F5831F]">Built for South Africa.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Contract plans from{' '}
              <span className="text-white font-bold">R129/mo</span> · Outright devices from{' '}
              <span className="text-white font-bold">R199</span> · All prices incl. 15% VAT
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[#F5831F] hover:bg-orange-600 text-white font-semibold gap-2"
                onClick={() => setModalOpen(true)}
              >
                Check Coverage &amp; Get a Deal
                <PiArrowRightBold className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2"
                asChild
              >
                <a
                  href={`${CONTACT.WHATSAPP_LINK}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PiWhatsappLogoBold className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <BusinessDealModal open={modalOpen} onOpenChange={setModalOpen} deal={HERO_DEAL} />
    </>
  )
}
