"use client"

import { WirelessHero } from "@/components/wireless/WirelessHero"
import { ImprovedWirelessPackages } from "@/components/wireless/ImprovedWirelessPackages"
import { CoverageChecker } from "@/components/coverage/CoverageChecker"
import { WirelessFeatures } from "@/components/wireless/WirelessFeatures"
import { WirelessFAQ } from "@/components/wireless/WirelessFAQ"

export default function WirelessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <WirelessHero />

      {/* Coverage Checker */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Check Coverage in Your Area</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enter your address to see which MTN 5G and LTE packages are available at your location
            </p>
          </div>
          <CoverageChecker />
        </div>
      </section>

      {/* Wireless Packages */}
      <section className="py-16 bg-gray-50">
        <ImprovedWirelessPackages />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <WirelessFeatures />
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <WirelessFAQ />
      </section>
    </div>
  )
}