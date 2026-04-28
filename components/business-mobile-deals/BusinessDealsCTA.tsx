'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PiWhatsappLogoBold, PiArrowRightBold, PiDevicesBold } from 'react-icons/pi'
import { CONTACT } from '@/lib/constants/contact'
import { BusinessDealModal } from './BusinessDealModal'

const CTA_DEAL = { id: 'cta-section', name: 'MTN Business Deal', monthly_incl_vat: 129 }

export function BusinessDealsCTA() {
  const [modalOpen, setModalOpen] = useState(false)
  const waMessage = encodeURIComponent(
    'Hi, I would like to find out more about CircleTel Business Mobile deals for April 2026.'
  )

  return (
    <>
      <section className="bg-[#1B2A4A] py-12 px-4 text-white text-center">
        <div className="container mx-auto max-w-xl">
          <h2 className="font-heading font-black text-3xl mb-3">Ready to connect your team?</h2>
          <p className="text-white/70 mb-8">
            Deals valid until 6 May 2026. MTN credit vetting required for contract deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-[#F5831F] hover:bg-orange-600 text-white gap-2"
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
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 gap-2"
              asChild
            >
              <a href="/products">
                <PiDevicesBold className="h-4 w-4" />
                View Full Catalogue
              </a>
            </Button>
          </div>
        </div>
      </section>
      <BusinessDealModal open={modalOpen} onOpenChange={setModalOpen} deal={CTA_DEAL} />
    </>
  )
}
