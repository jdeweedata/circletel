"use client"

import { Card, CardContent } from "@/components/ui/card"

export function WirelessFeatures() {
  const features = [
    {
      icon: PiLightningBold,
      title: "Instant Connectivity",
      description: "Get connected in 24-48 hours with our rapid deployment process"
    },
    {
      icon: PiShieldBold,
      title: "99.5% Uptime SLA",
      description: "Enterprise-grade reliability with guaranteed service level agreements"
    },
    {
      icon: PiWifiBold,
      title: "Free Static IP",
      description: "Included with every business package for remote access and management"
    },
    {
      icon: PiTruckBold,
      title: "Free Installation",
      description: "Professional installation and setup at no extra cost"
    },
    {
      icon: PiHeadphonesBold,
      title: "24/7 SA Support",
      description: "Local technical support team available around the clock"
    },
    {
      icon: PiClockBold,
      title: "No Long Contracts",
      description: "Flexible month-to-month terms after initial 24-month period"
    }
  ]

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-circleTel-navy mb-4">Why Choose CircleTel Wireless?</h2>
        <p className="text-circleTel-secondaryNeutral text-lg max-w-2xl mx-auto">
          Enterprise-grade wireless solutions designed for South African businesses
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="font-bold text-lg text-circleTel-navy mb-2">{feature.title}</h3>
              <p className="text-circleTel-secondaryNeutral">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}