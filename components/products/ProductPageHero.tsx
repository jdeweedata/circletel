import Image from 'next/image'
import Link from 'next/link'
import { PiWhatsappLogoBold } from 'react-icons/pi'
import { Button } from '@/components/ui/button'

interface ProductPageHeroProps {
  name: string
  tagline?: string
  heroImage?: string | null
  category: string
}

const categoryLabels: Record<string, string> = {
  consumer: 'Consumer',
  soho: 'Work From Home',
  business: 'Business',
  enterprise: 'Enterprise',
}

export function ProductPageHero({ name, tagline, heroImage, category }: ProductPageHeroProps) {
  return (
    <section className="relative h-[60vh] min-h-[500px] flex items-center">
      {heroImage && (
        <Image
          src={heroImage}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl lg:max-w-2xl">
          <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
            {categoryLabels[category] || category}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {name}
          </h1>
          {tagline && (
            <p className="text-xl md:text-2xl text-white/95 mb-8 drop-shadow-md">
              {tagline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white" asChild>
              <Link href="/">Get Started</Link>
            </Button>
            <Button size="lg" className="bg-[#25D366] hover:bg-[#1da851] text-white" asChild>
              <Link href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                <PiWhatsappLogoBold className="w-5 h-5" />
                WhatsApp Us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
