"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Shield, Headphones, TruckIcon } from "lucide-react"

export function WirelessHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-circleTel-gray-50 via-circleTel-white to-circleTel-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />

      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-circleTel-orange/10 text-circleTel-orange border-circleTel-orange/20">
            <Star className="w-4 h-4 mr-2 fill-current text-circleTel-orange" />
            South Africa's most trusted business ISP
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral bg-clip-text text-transparent">
              Empowering SMEs with
            </span>
            <br />
            <span className="text-circleTel-orange">Reliable Wireless.</span>
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl text-circleTel-red">Powered by MTN.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-circleTel-secondaryNeutral mb-8 max-w-3xl mx-auto leading-relaxed">
            High-Speed Wireless and Fibre Internet, Proactive IT, and Data Resilience.
            No tech jargon, no hidden costs — just reliable connectivity that works.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-circleTel-secondaryNeutral">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-circleTel-blue-600" />
              <span className="font-medium">99.9% Uptime Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-circleTel-orange" />
              <span className="font-medium">Free Installation</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-circleTel-red" />
              <span className="font-medium">24/7 SA Support</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-circleTel-white px-8 py-3 text-lg font-semibold">
              Check Coverage & Pricing
            </Button>
            <Button variant="outline" size="lg" className="border-circleTel-red text-circleTel-red hover:bg-circleTel-red hover:text-circleTel-white px-8 py-3 text-lg font-semibold">
              View All Packages
            </Button>
          </div>

          {/* Speed Showcase */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-circleTel-white/90 backdrop-blur-sm rounded-lg p-4 border border-circleTel-orange/20 shadow-sm">
              <div className="text-2xl font-bold text-circleTel-orange">5G</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Up to 300Mbps</div>
            </div>
            <div className="bg-circleTel-white/90 backdrop-blur-sm rounded-lg p-4 border border-circleTel-blue-500/20 shadow-sm">
              <div className="text-2xl font-bold text-circleTel-blue-600">LTE</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Up to 20Mbps</div>
            </div>
            <div className="bg-circleTel-white/90 backdrop-blur-sm rounded-lg p-4 border border-circleTel-red/20 shadow-sm">
              <div className="text-2xl font-bold text-circleTel-red">24-48h</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Setup Time</div>
            </div>
            <div className="bg-circleTel-white/90 backdrop-blur-sm rounded-lg p-4 border border-circleTel-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-circleTel-darkNeutral">R299</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Starting From</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-circleTel-orange/20 rounded-full opacity-30 blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-circleTel-red/20 rounded-full opacity-30 blur-xl" />
    </section>
  )
}