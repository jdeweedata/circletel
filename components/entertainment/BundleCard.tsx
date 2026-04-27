'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PiCheckBold, PiWifiHighBold } from 'react-icons/pi'
import { CoverageCheckModal } from './CoverageCheckModal'
import type { EntertainmentBundle } from '@/lib/data/entertainment-bundles'

interface BundleCardProps {
  bundle: EntertainmentBundle
}

export function BundleCard({ bundle }: BundleCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Card className={`relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${
        bundle.badge === 'Most Popular' ? 'ring-2 ring-[#F5831F]' : ''
      }`}>
        {bundle.badge && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-[#F5831F] text-white text-xs font-semibold px-2 py-1">
              {bundle.badge}
            </Badge>
          </div>
        )}

        {/* Device image */}
        <div className="relative h-44 bg-white flex items-center justify-center p-4">
          <Image
            src={bundle.device.image_path}
            alt={bundle.device.name}
            width={180}
            height={150}
            className="object-contain max-h-36"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.classList.add('bg-gray-100')
            }}
          />
        </div>

        <CardContent className="flex flex-col flex-1 p-5 gap-4">
          {/* Device info */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {bundle.device.tagline}
            </p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight mt-0.5">
              {bundle.device.name}
            </h3>
          </div>

          {/* Internet plan pill */}
          <div className="flex items-center gap-1.5">
            <PiWifiHighBold className="h-4 w-4 text-[#F5831F]" />
            <span className="text-sm font-medium text-gray-700">
              {bundle.internet.speed_mbps}Mbps {bundle.internet.technology}
            </span>
          </div>

          {/* Price */}
          <div>
            <span className="text-3xl font-extrabold text-[#1B2A4A]">
              R{bundle.bundle_monthly_incl_vat.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>

          {/* Features */}
          <ul className="flex flex-col gap-1.5 flex-1">
            {bundle.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                <PiCheckBold className="h-4 w-4 text-[#F5831F] flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            className="w-full bg-[#F5831F] hover:bg-orange-600 text-white font-semibold mt-auto"
            onClick={() => setModalOpen(true)}
          >
            Get This Bundle
          </Button>
        </CardContent>
      </Card>

      <CoverageCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        bundle={bundle}
      />
    </>
  )
}
