"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Wifi, Truck, Settings, Gauge, Check, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Set default selection to first package on mount
  useEffect(() => {
    if (wirelessPackages.all.length > 0) {
      setSelectedPackageId(wirelessPackages.all[0].id)
    }
  }, [])

  const getFilteredPackages = (filter: string) => {
    if (filter === "all") return wirelessPackages.all
    return wirelessPackages.all.filter(pkg => pkg.type === filter)
  }

  const handlePackageSelect = (packageId: string) => {
    router.push(`/wireless/order?package=${packageId}`)
  }

  const selectedPackage = wirelessPackages.all.find(pkg => pkg.id === selectedPackageId)

  const PackageCard = ({ pkg }: { pkg: any }) => {
    const isSelected = selectedPackageId === pkg.id

    return (
      <div 
        className={`text-center cursor-pointer transition-all bg-white rounded-xl p-6 border-2 ${
          isSelected 
            ? 'border-circleTel-orange shadow-lg ring-2 ring-circleTel-orange ring-offset-2' 
            : 'border-gray-100 hover:border-circleTel-orange/50 hover:shadow-lg'
        }`}
        onClick={() => setSelectedPackageId(pkg.id)}
      >
        <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Uncapped</div>
        <div className="text-4xl font-bold text-gray-900 mb-3">{pkg.speed}</div>
        <div className="text-sm text-muted-foreground mb-8 min-h-[40px] flex items-center justify-center">{pkg.description}</div>

        <Button
          onClick={(e) => {
            e.stopPropagation()
            handlePackageSelect(pkg.id)
          }}
          className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold py-3 rounded-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <span>{pkg.price}</span>
            <ShoppingCart className="w-4 h-4 group-hover:animate-pulse" />
          </span>
        </Button>
      </div>
    )
  }

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

          {/* Selected Package Info Card */}
          {selectedPackage && (
            <Card className="mb-6 p-6 bg-gradient-to-br from-circleTel-orange/5 to-circleTel-orange/10 border-circleTel-orange/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-lg text-circleTel-darkNeutral">{selectedPackage.speed}</h4>
                  <p className="text-sm text-circleTel-secondaryNeutral mt-1">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-circleTel-orange">{selectedPackage.price}</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-circleTel-darkNeutral">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Uncapped data usage</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-circleTel-darkNeutral">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>No throttling or FUP</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-circleTel-darkNeutral">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Month-to-month contract</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-circleTel-darkNeutral">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>24/7 customer support</span>
                </div>
              </div>

              <Button
                onClick={() => handlePackageSelect(selectedPackage.id)}
                className="w-full bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white font-semibold py-3 rounded-lg"
              >
                Order Now
              </Button>
            </Card>
          )}

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