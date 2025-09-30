"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Wifi, Truck, Settings, Gauge } from "lucide-react"
import { useRouter } from "next/navigation"

// Packages that match the Afrihost Pure Wireless design exactly
const wirelessPackages = {
  all: [
    {
      id: "20mbps",
      type: "uncapped",
      speed: "20Mbps",
      description: "Uncapped anytime",
      price: "R299.00 pm",
      featured: false
    },
    {
      id: "50mbps",
      type: "uncapped",
      speed: "50Mbps",
      description: "Uncapped anytime",
      price: "R399.00 pm",
      featured: false
    },
    {
      id: "100mbps",
      type: "uncapped",
      speed: "100Mbps",
      description: "Uncapped anytime",
      price: "R599.00 pm",
      featured: false
    },
    {
      id: "wireless-plus",
      type: "uncapped",
      speed: "Wireless Plus",
      description: "Uncapped anytime",
      price: "R949.00 pm",
      featured: false
    }
  ]
}

const features = [
  {
    icon: Star,
    title: "Save R1 000 on hardware.",
    description: "With selected SIM + Device orders."
  },
  {
    icon: Wifi,
    title: "FREE router.",
    description: "With Pure Wireless Plus."
  },
  {
    icon: Truck,
    title: "FREE delivery.",
    description: "With any SIM and/or device order."
  },
  {
    icon: Settings,
    title: "No setup required.",
    description: "Insert your SIM and you're good to go."
  },
  {
    icon: Gauge,
    title: "Uncapped thresholds and throttling.",
    description: "See Ts&Cs for a detailed breakdown. »"
  }
]

export function WirelessPackagesSection() {
  const router = useRouter()

  const getFilteredPackages = (filter: string) => {
    if (filter === "all") return wirelessPackages.all
    return wirelessPackages.all.filter(pkg => pkg.type === filter)
  }

  const handlePackageSelect = (packageId: string) => {
    router.push(`/wireless/order?package=${packageId}`)
  }

  const PackageCard = ({ pkg }: { pkg: any }) => (
    <div className="text-center cursor-pointer transition-all hover:shadow-lg bg-white rounded-xl p-6 border border-gray-100">
      <div className="text-xs text-muted-foreground mb-2">Uncapped</div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{pkg.speed}</div>
      <div className="text-sm text-muted-foreground mb-6">{pkg.description}</div>

      <Button
        onClick={() => handlePackageSelect(pkg.id)}
        className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold py-3 rounded-lg group"
      >
        <span className="flex items-center justify-center gap-2">
          <span>{pkg.price}</span>
          <ShoppingCart className="w-4 h-4 group-hover:animate-pulse" />
        </span>
      </Button>
    </div>
  )

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Packages Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              All Pure Wireless packages.
            </h2>

            {/* Tab Selector */}
            <Tabs defaultValue="uncapped" className="w-auto">
              <TabsList className="grid w-full grid-cols-3 bg-white">
                <TabsTrigger value="all" className="text-circleTel-secondaryNeutral data-[state=active]:bg-circleTel-gray-100">All</TabsTrigger>
                <TabsTrigger value="capped" className="text-circleTel-secondaryNeutral data-[state=active]:bg-circleTel-gray-100">Capped</TabsTrigger>
                <TabsTrigger value="uncapped" className="text-white data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">Uncapped</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {getFilteredPackages("all").map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="capped" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {getFilteredPackages("capped").map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="uncapped" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {getFilteredPackages("uncapped").map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 xl:w-96">
          <div className="mb-6">
            <h3 className="text-2xl font-bold italic text-circleTel-orange mb-6">CircleTel Wireless</h3>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <feature.icon className="w-6 h-6 text-circleTel-red flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-sm text-circleTel-darkNeutral">{feature.title}</div>
                    <div className="text-sm text-circleTel-secondaryNeutral mt-1">{feature.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}