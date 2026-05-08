import { Card, CardContent } from '@/components/ui/card'
import { iconMap } from '@/lib/icons/product-icons'
import { PiCheckCircleBold } from 'react-icons/pi'

interface FeatureGridProps {
  productName: string
  features: Array<{ _key: string; title: string; description: string; icon?: string }>
}

export function FeatureGrid({ productName, features }: FeatureGridProps) {
  if (!features || features.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose {productName}?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
              ? iconMap[feature.icon]
              : PiCheckCircleBold
            return (
              <Card key={feature._key || index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  {IconComponent && (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
