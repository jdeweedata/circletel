'use client'

import { PiCheckCircleBold, PiWarningCircleBold } from 'react-icons/pi'
import { storefrontAvailability } from '@/lib/hardware-catalogue/storefront'
import type { StockDisplay } from '@/lib/hardware-catalogue/types'

interface StockBadgeProps {
  stock: StockDisplay
}

export function StockBadge({ stock }: StockBadgeProps) {
  const availability = storefrontAvailability({
    stockTotal: stock.total,
    booleanStock: stock.boolean_stock,
  })

  if (availability.inStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
        <PiCheckCircleBold className="h-3.5 w-3.5" />
        {availability.label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
      <PiWarningCircleBold className="h-3.5 w-3.5" />
      {availability.label}
    </span>
  )
}
