import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

export interface DeviceFeature {
  title: string
  description: string
}

export interface DeviceCardProps {
  id: string
  title: string
  description: string
  price: number
  currency?: string
  imageUrl: string
  imageAlt?: string
  tag?: string
  features: DeviceFeature[]
  moreInfoUrl: string
  buyNowUrl: string
  className?: string
}

export function DeviceCard({
  id,
  title,
  description,
  price,
  currency = "R",
  imageUrl,
  imageAlt = "",
  tag,
  features = [],
  moreInfoUrl,
  buyNowUrl,
  className,
}: DeviceCardProps) {
  const formatPrice = (price: number) => {
    const priceStr = price.toFixed(2)
    const [whole, decimal] = priceStr.split('.')
    return (
      <>
        {whole}.<span className="text-lg">{decimal}</span>
      </>
    )
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow", className)}>
      {/* Card Image */}
      <Link href={moreInfoUrl} className="block relative">
        <div className="aspect-[390/200] relative overflow-hidden bg-gray-50">
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {tag && (
          <span className="absolute top-4 left-4 bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-full">
            {tag}
          </span>
        )}
      </Link>

      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1">
            <dt className="text-xl font-bold text-gray-900 mb-1" id={`device-title-${id}`}>
              {title}
            </dt>
            <dd className="text-sm text-gray-600" id={`device-description-${id}`}>
              {description}
            </dd>
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {currency}{formatPrice(price)}
        </div>
      </div>

      {/* Card Features */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <dl key={index} className="flex justify-between items-center text-sm">
              <dt className="font-medium text-gray-600">
                {feature.title}
              </dt>
              <dd className="text-gray-900 font-medium">
                {feature.description}
              </dd>
            </dl>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          asChild
        >
          <Link href={moreInfoUrl}>
            More info
          </Link>
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
          asChild
        >
          <Link href={buyNowUrl}>
            Buy now
            <ShoppingCart className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default DeviceCard