"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Search } from "lucide-react"
import { useState } from "react"

export function DemoHero() {
  const [address, setAddress] = useState("")

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-circleTel-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />

      {/* Header with Call Sales - Verizon pattern */}
      <div className="relative border-b border-circleTel-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-circleTel-secondaryNeutral">
              Get CircleTel Business Internet
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:087-073-0000" className="flex items-center gap-2 text-sm font-medium text-circleTel-orange hover:text-circleTel-red transition-colors">
                <Phone className="w-4 h-4" />
                Call Sales: 087 073 0000
              </a>
              <Button variant="outline" size="sm" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <Badge variant="secondary" className="mb-8 px-6 py-3 text-sm font-medium bg-circleTel-orange/10 text-circleTel-orange border-circleTel-orange/20">
            South Africa's most trusted business ISP
          </Badge>

          {/* Main Headline - Verizon style */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral bg-clip-text text-transparent">
              CircleTel Business Internet
            </span>
          </h1>

          {/* Subtitle */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-circleTel-orange">
            Check which internet service is available in your area
          </h2>

          <p className="text-xl md:text-2xl text-circleTel-secondaryNeutral mb-12 max-w-3xl mx-auto leading-relaxed">
            Find out whether Fibre Business Internet, 5G Business Internet or LTE Business Internet is available in your area.
          </p>

          {/* Address Input Section - Verizon inspired */}
          <div className="bg-white rounded-2xl shadow-xl border border-circleTel-gray-200 p-8 mb-12 max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-circleTel-orange" />
                <span className="text-lg font-semibold text-circleTel-darkNeutral">Enter street address</span>
              </div>
              <p className="text-sm text-circleTel-secondaryNeutral">
                <Button
                  variant="link"
                  className="p-0 h-auto text-circleTel-orange hover:text-circleTel-red"
                  onClick={() => {
                    // Simulated geolocation
                    setAddress("123 Sandton Drive, Sandton, Johannesburg")
                  }}
                >
                  Use my location
                </Button>
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type your address (without unit #) and select the one closest to your own."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-12 py-6 text-lg border-circleTel-gray-300 focus:border-circleTel-orange focus:ring-circleTel-orange"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-circleTel-secondaryNeutral" />
              </div>

              <Button
                size="lg"
                className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white py-6 text-lg font-semibold"
                disabled={!address.trim()}
              >
                Get started
              </Button>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-circleTel-orange/20 shadow-sm">
              <div className="text-3xl font-bold text-circleTel-orange mb-2">Fibre</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Up to 1Gbps</div>
              <div className="text-xs text-circleTel-secondaryNeutral mt-2">From R899/month</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-circleTel-red/20 shadow-sm">
              <div className="text-3xl font-bold text-circleTel-red mb-2">5G</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Up to 300Mbps</div>
              <div className="text-xs text-circleTel-secondaryNeutral mt-2">From R599/month</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-circleTel-blue-600/20 shadow-sm">
              <div className="text-3xl font-bold text-circleTel-blue-600 mb-2">LTE</div>
              <div className="text-sm text-circleTel-secondaryNeutral">Up to 20Mbps</div>
              <div className="text-xs text-circleTel-secondaryNeutral mt-2">From R299/month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-circleTel-orange/10 rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-circleTel-red/10 rounded-full opacity-50 blur-3xl" />
    </section>
  )
}