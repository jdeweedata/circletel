import { SanityImage } from '@/components/sanity/SanityImage'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Action {
  label: string
  url: string
  style: 'primary' | 'secondary' | 'outline'
}

interface HeroSectionProps {
  heading: string
  subheading?: string
  image?: any
  layout: 'center' | 'imageRight' | 'imageLeft'
  actions?: Action[]
}

export function HeroSection({ heading, subheading, image, layout = 'center', actions }: HeroSectionProps) {
  const isCenter = layout === 'center'
  const isImageLeft = layout === 'imageLeft'

  return (
    <section className="relative overflow-hidden bg-circleTel-darkNeutral text-white py-20 md:py-32">
      {/* Background Image (for center layout or as backdrop) */}
      {isCenter && image && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <SanityImage image={image} alt={heading} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-circleTel-darkNeutral/80 to-circleTel-darkNeutral" />
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className={cn(
          "grid gap-12 items-center",
          isCenter ? "grid-cols-1 text-center max-w-4xl mx-auto" : "grid-cols-1 lg:grid-cols-2"
        )}>
          
          {/* Text Content */}
          <div className={cn(
            isImageLeft && "lg:order-2"
          )}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heading}
            </h1>
            {subheading && (
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                {subheading}
              </p>
            )}
            
            {actions && actions.length > 0 && (
              <div className={cn(
                "flex flex-col sm:flex-row gap-4",
                isCenter ? "justify-center" : "justify-start"
              )}>
                {actions.map((action, idx) => (
                  <Link key={idx} href={action.url || '#'}>
                    <Button 
                      size="lg"
                      className={cn(
                        "w-full sm:w-auto",
                        action.style === 'primary' && "bg-circleTel-orange hover:bg-orange-600 text-white",
                        action.style === 'secondary' && "bg-blue-600 hover:bg-blue-700 text-white",
                        action.style === 'outline' && "bg-transparent border-2 border-white text-white hover:bg-white/10"
                      )}
                    >
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Image Content (for side layouts) */}
          {!isCenter && image && (
            <div className={cn(
              "relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl",
              isImageLeft && "lg:order-1"
            )}>
              <SanityImage image={image} alt={heading} fill className="object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
