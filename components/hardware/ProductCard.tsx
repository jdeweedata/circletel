'use client'

import Link from 'next/link'
import { PiCheckCircleBold } from 'react-icons/pi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from './PriceDisplay'
import { StockBadge } from './StockBadge'
import type { HardwareProductDetail } from '@/lib/hardware-catalogue/types'
import { getStockDisplay } from '@/lib/hardware-catalogue/types'

interface ProductCardProps {
  product: HardwareProductDetail
}

export function ProductCard({ product }: ProductCardProps) {
  const stock = getStockDisplay(product)

  return (
    <Link href={`/products/hardware/${product.slug}`}>
      <Card className="group h-full transition hover:shadow-lg hover:ring-2 hover:ring-[#E87A1E]/20">
        <CardContent className="p-6">
          {/* Image placeholder */}
          <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-gradient-to-b from-white to-[#FDF2E9]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-center text-sm text-[#7C93AF]">
                <div className="mb-2 text-4xl">📦</div>
                {product.name}
              </div>
            )}
          </div>

          {/* Category */}
          {product.category && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#AE5B16]">
              {product.category}
            </p>
          )}

          {/* Name */}
          <h3 className="mb-3 text-lg font-bold leading-tight text-[#1B2A4A] group-hover:text-[#E87A1E]">
            {product.name}
          </h3>

          {/* Stock */}
          <div className="mb-3">
            <StockBadge stock={stock} />
          </div>

          {/* Price */}
          <div className="mt-auto">
            <PriceDisplay retailPrice={product.retail_price} size="sm" />
          </div>

          {/* Warranty hint */}
          {product.warranty_months && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <PiCheckCircleBold className="h-3.5 w-3.5 text-[#E87A1E]" />
              {product.warranty_months} month warranty
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
