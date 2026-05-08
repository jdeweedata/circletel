import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PricingBarProps {
  startingPrice?: number
  priceNote?: string
}

export function PricingBar({ startingPrice, priceNote }: PricingBarProps) {
  if (startingPrice === undefined || startingPrice === null) {
    return null
  }

  return (
    <section className="bg-slate-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="text-slate-400 text-sm">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                R{startingPrice.toLocaleString()}
              </span>
              <span className="text-slate-400">
                {priceNote}
              </span>
            </div>
          </div>
          <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-200" asChild>
            <Link href="/">Check Coverage & Order</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
