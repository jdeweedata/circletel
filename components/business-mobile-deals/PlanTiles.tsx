'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PiCheckBold } from 'react-icons/pi'
import { PLAN_TILES, type BusinessPlanTile } from '@/lib/data/mtn-business-deals'
import { BusinessDealModal, type BusinessDealItem } from './BusinessDealModal'

function PlanTileCard({ tile }: { tile: BusinessPlanTile }) {
  const [modalOpen, setModalOpen] = useState(false)
  const deal: BusinessDealItem = {
    id: tile.id,
    name: tile.name,
    monthly_incl_vat: tile.monthly_incl_vat,
  }

  return (
    <>
      <div
        className={`relative rounded-xl overflow-hidden border flex flex-col ${
          tile.badge ? 'border-[#F5831F] shadow-lg' : 'border-gray-200'
        }`}
      >
        {tile.badge && (
          <div className="bg-[#F5831F] text-white text-xs font-semibold text-center py-1.5 tracking-wide">
            {tile.badge}
          </div>
        )}

        <div className="bg-[#1B2A4A] text-white px-5 py-4 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
            {tile.term_months} months
          </p>
          <div className="text-4xl font-heading font-black leading-none">
            {tile.data_gb === 'Uncapped' ? (
              <span>Uncapped</span>
            ) : (
              <span>{tile.data_gb}<span className="text-xl font-semibold ml-1">GB</span></span>
            )}
          </div>
          <p className="text-white/70 text-xs mt-1 truncate">{tile.name}</p>
        </div>

        <div className="px-5 py-4 flex flex-col flex-1 gap-4 bg-white">
          <div className="text-center">
            <span className="text-3xl font-heading font-black text-[#1B2A4A]">
              R{tile.monthly_incl_vat.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/mo</span>
            <p className="text-xs text-gray-400 mt-0.5">incl. VAT · {tile.term_months}-month term</p>
          </div>

          <ul className="flex flex-col gap-2 flex-1">
            {tile.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <PiCheckBold className="h-4 w-4 text-[#F5831F] flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            className="w-full bg-[#F5831F] hover:bg-orange-600 text-white"
            onClick={() => setModalOpen(true)}
          >
            Get This Deal
          </Button>
        </div>
      </div>
      <BusinessDealModal open={modalOpen} onOpenChange={setModalOpen} deal={deal} />
    </>
  )
}

export function PlanTiles() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {PLAN_TILES.map((tile) => (
        <PlanTileCard key={tile.id} tile={tile} />
      ))}
    </div>
  )
}
