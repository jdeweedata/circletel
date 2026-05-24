'use client'

import Link from 'next/link'
import { PiArrowRightBold, PiLightningBold, PiWifiHighBold } from 'react-icons/pi'
import type { HardwareProductFull } from '@/lib/hardware-catalogue/types'

interface ServiceLinksProps {
  serviceLinks: HardwareProductFull['service_links']
}

const relationshipIcons: Record<string, React.ReactNode> = {
  bundled_with: <PiLightningBold className="h-4 w-4" />,
  recommended_for: <PiWifiHighBold className="h-4 w-4" />,
  required_for: <PiArrowRightBold className="h-4 w-4" />,
}

const relationshipLabels: Record<string, string> = {
  bundled_with: 'Bundled with',
  recommended_for: 'Pairs with',
  required_for: 'Required for',
}

export function ServiceLinks({ serviceLinks }: ServiceLinksProps) {
  if (!serviceLinks || serviceLinks.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[#1B2A4A]">
        Pairs with CircleTel Services
      </p>
      <div className="space-y-2">
        {serviceLinks.map((link) => (
          <Link
            key={`${link.service_package_id}-${link.relationship_type}`}
            href={`/services/${link.service_slug}`}
            className="flex items-center gap-3 rounded-lg border border-[#DDE7F3] bg-white p-3 text-sm transition hover:border-[#E87A1E] hover:shadow-sm"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDF2E9] text-[#E87A1E]">
              {relationshipIcons[link.relationship_type] || (
                <PiArrowRightBold className="h-4 w-4" />
              )}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-[#31527B]">
                {link.service_name}
              </p>
              <p className="text-xs text-[#7C93AF]">
                {relationshipLabels[link.relationship_type] || link.relationship_type}
              </p>
            </div>
            <PiArrowRightBold className="h-4 w-4 text-[#7C93AF]" />
          </Link>
        ))}
      </div>
    </div>
  )
}
