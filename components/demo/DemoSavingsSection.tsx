"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Smartphone, Tv, Info } from "lucide-react"

const savingsOptions = [
  {
    id: 1,
    title: "Get entertainment you love, for less",
    description: "Save money every month while you stream Netflix, Showmax, or DStv Now. Listen to your favorite music on Apple Music, or get Unlimited Cloud Storage.",
    icon: Heart,
    savings: "Save up to R200/mo",
    color: "from-circleTel-red to-circleTel-orange",
    cta: "Get started"
  },
  {
    id: 2,
    title: "Bundle your mobile & business internet. Save R150/mo.",
    description: "And choose entertainment on us. Savings on bill. Add one perk on us (up to R100/mo) with select internet plans.",
    icon: Smartphone,
    savings: "R150/mo discount",
    color: "from-circleTel-blue-600 to-circleTel-blue-700",
    cta: "Learn more"
  },
  {
    id: 3,
    title: "Save R100/mo on DStv Premium for the first year",
    description: "R619/mo for 12 mos., then R719/mo after. For new DStv subscribers with Business Pro plans.",
    icon: Tv,
    savings: "R1,200 first year",
    color: "from-circleTel-darkNeutral to-circleTel-secondaryNeutral",
    cta: "Get started"
  }
]

export function DemoSavingsSection() {
  return (
    <section className="py-16 lg:py-24 bg-circleTel-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-circleTel-darkNeutral">
            Discover more ways to save
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Maximize your business savings with our bundled packages and entertainment add-ons.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {savingsOptions.map((option) => (
            <Card key={option.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${option.color} text-white p-6 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] bg-[length:15px_15px]" />

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <option.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {option.savings}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-circleTel-darkNeutral group-hover:text-circleTel-orange transition-colors">
                    {option.title}
                  </h3>

                  <p className="text-circleTel-secondaryNeutral mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  <Button
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold"
                  >
                    {option.cta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md border border-circleTel-gray-200">
            <Info className="w-5 h-5 text-circleTel-blue-600" />
            <span className="text-sm text-circleTel-secondaryNeutral">
              All offers require qualifying business internet plans. Terms and conditions apply.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}