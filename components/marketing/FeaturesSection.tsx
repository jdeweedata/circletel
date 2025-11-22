import { SanityImage } from '@/components/sanity/SanityImage'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface FeatureItem {
  title: string
  text: string
  icon?: string
  image?: any
}

interface FeaturesSectionProps {
  heading?: string
  description?: string
  layout: 'grid3' | 'grid2' | 'list'
  items: FeatureItem[]
}

export function FeaturesSection({ heading, description, layout = 'grid3', items }: FeaturesSectionProps) {
  const gridCols = {
    'grid3': 'md:grid-cols-3',
    'grid2': 'md:grid-cols-2',
    'list': 'grid-cols-1 max-w-4xl mx-auto'
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        {(heading || description) && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            {heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-lg text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className={cn(
          "grid gap-8 md:gap-12",
          gridCols[layout]
        )}>
          {items?.map((item, idx) => {
            // Dynamically resolve icon
            const IconComponent = item.icon && (LucideIcons as any)[item.icon] 
              ? (LucideIcons as any)[item.icon] 
              : LucideIcons.CheckCircle

            return (
              <div key={idx} className={cn(
                "relative",
                layout === 'list' 
                  ? "flex flex-col md:flex-row gap-6 items-start md:items-center p-6 rounded-2xl hover:bg-gray-50 transition-colors" 
                  : "flex flex-col items-start text-left"
              )}>
                {/* Icon or Image */}
                <div className={cn(
                  "shrink-0",
                  layout === 'list' ? "bg-blue-50 p-4 rounded-xl" : "mb-4"
                )}>
                  {item.image ? (
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                      <SanityImage image={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <IconComponent className="w-8 h-8 text-circleTel-orange" />
                  )}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
