// components/sanity/blocks/CtaBlock.tsx
import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CtaBlockProps {
  headline: string
  description?: string
  variant?: 'banner' | 'card' | 'inline' | 'split'
  primaryButton?: {
    text: string
    url: string
    style?: 'primary' | 'secondary'
  }
  secondaryButton?: {
    text: string
    url: string
    style?: 'primary' | 'secondary'
  }
  backgroundImage?: {
    _type: 'image'
    asset: { _ref: string; _type: 'reference' }
    hotspot?: { x: number; y: number }
  }
  backgroundColor?: string
  textColor?: 'light' | 'dark'
}

const variantClasses = {
  banner: 'py-16 px-4',
  card: 'py-12 px-8 rounded-2xl shadow-lg',
  inline: 'py-8 px-4',
  split: 'grid md:grid-cols-2 gap-8 items-center',
}

export function CtaBlock({
  headline,
  description,
  variant = 'banner',
  primaryButton,
  secondaryButton,
  backgroundImage,
  backgroundColor,
  textColor = 'light',
}: CtaBlockProps) {
  const textClasses = textColor === 'light' ? 'text-white' : 'text-gray-900'

  return (
    <div className="container mx-auto px-4">
      <div
        className={cn(
          'relative overflow-hidden',
          variantClasses[variant],
          textClasses,
          !backgroundImage && !backgroundColor && 'bg-circleTel-navy'
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {/* Background image */}
        {backgroundImage && (
          <div className="absolute inset-0 -z-10">
            <SanityImage
              image={backgroundImage}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'relative z-10',
          variant !== 'split' && 'text-center max-w-3xl mx-auto'
        )}>
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            {headline}
          </h2>

          {description && (
            <p className="mt-4 text-lg opacity-90">{description}</p>
          )}

          {(primaryButton || secondaryButton) && (
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {primaryButton && (
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-circleTel-navy hover:bg-white/90 font-semibold"
                >
                  <Link href={primaryButton.url}>{primaryButton.text}</Link>
                </Button>
              )}
              {secondaryButton && (
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Link href={secondaryButton.url}>{secondaryButton.text}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
