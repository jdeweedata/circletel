'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type FeaturedDevice } from '@/lib/data/mtn-business-deals'
import { BusinessDealModal, type BusinessDealItem } from './BusinessDealModal'

interface FeaturedDeviceCardProps {
  device: FeaturedDevice
}

export function FeaturedDeviceCard({ device }: FeaturedDeviceCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  const deal: BusinessDealItem = {
    id: device.id,
    name: device.name,
    monthly_incl_vat: device.contract_from?.monthly_incl_vat ?? device.outright_incl_vat,
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="relative bg-gray-50 h-44 flex items-center justify-center p-4">
          {device.badge && (
            <Badge
              className={`absolute top-2 left-2 text-xs font-semibold ${
                device.badge === 'Coming Soon'
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-200'
                  : 'bg-[#F5831F] text-white hover:bg-[#F5831F]'
              }`}
            >
              {device.badge}
            </Badge>
          )}
          {!imgError ? (
            <Image
              src={device.image_path}
              alt={device.name}
              width={140}
              height={140}
              className="object-contain max-h-36"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs text-center px-4">
              {device.name}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-3">
          <h3 className="font-semibold text-sm text-[#1B2A4A] leading-snug line-clamp-2">
            {device.name}
          </h3>

          <div className="flex flex-col gap-1.5 flex-1">
            {device.contract_from && (
              <div className="bg-[#1B2A4A]/5 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 leading-tight">Contract from</p>
                <p className="font-heading font-black text-lg text-[#1B2A4A] leading-tight">
                  R{device.contract_from.monthly_incl_vat.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500">/mo</span>
                </p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                  {device.contract_from.plan_label}
                </p>
              </div>
            )}
            <div className={`rounded-lg px-3 py-2 ${device.contract_from ? 'bg-gray-50' : 'bg-[#1B2A4A]/5'}`}>
              <p className="text-xs text-gray-500 leading-tight">
                {device.contract_from ? 'Or buy outright' : 'Buy outright'}
              </p>
              <p className={`font-heading font-black text-lg leading-tight ${device.contract_from ? 'text-gray-700' : 'text-[#1B2A4A]'}`}>
                R{device.outright_incl_vat.toLocaleString()}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full bg-[#F5831F] hover:bg-orange-600 text-white text-xs"
            onClick={() => setModalOpen(true)}
            disabled={device.badge === 'Coming Soon'}
          >
            {device.badge === 'Coming Soon' ? 'Coming Soon' : 'Get This Deal'}
          </Button>
        </div>
      </div>
      <BusinessDealModal open={modalOpen} onOpenChange={setModalOpen} deal={deal} />
    </>
  )
}
