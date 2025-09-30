"use client"

import { ShoppingCart, Star, Wifi, Truck, Settings, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const packages = {
  all: [
    {
      id: "5gb",
      type: "capped",
      speed: "5GB",
      description: "Anytime",
      nightTime: "5GB Night time",
      price: "R49.00 pm",
      featured: false
    },
    {
      id: "40gb",
      type: "capped",
      speed: "40GB",
      description: "Anytime",
      nightTime: "40GB Night time",
      price: "R199.00 pm",
      featured: false
    },
    {
      id: "20mbps",
      type: "uncapped",
      speed: "20Mbps",
      description: "Uncapped anytime",
      price: "R299.00 pm",
      featured: false
    },
    {
      id: "90gb",
      type: "capped",
      speed: "90GB",
      description: "Anytime",
      nightTime: "90GB Night time",
      price: "R349.00 pm",
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
      id: "200gb",
      type: "capped",
      speed: "200GB",
      description: "Anytime",
      nightTime: "200GB Night time",
      price: "R549.00 pm",
      featured: false
    },
    {
      id: "100mbps",
      type: "uncapped",
      speed: "100Mbps",
      description: "Uncapped anytime",
      price: "R599.00 pm",
      featured: true
    },
    {
      id: "400gb",
      type: "capped",
      speed: "400GB",
      description: "Anytime",
      nightTime: "400GB Night time",
      price: "R749.00 pm",
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
  const getFilteredPackages = (filter: string) => {
    if (filter === "all") return packages.all
    return packages.all.filter(pkg => pkg.type === filter)
  }

  const PackageCard = ({ pkg }: { pkg: any }) => (
    <Card className={`relative cursor-pointer transition-all hover:shadow-lg ${
      pkg.featured ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-600 to-purple-800 text-white' : 'hover:shadow-md'
    }`}>
      <CardHeader className="text-center">
        {pkg.type === "uncapped" && !pkg.nightTime && (
          <div className="text-xs text-muted-foreground mb-2">Uncapped</div>
        )}
        <CardTitle className="text-2xl font-bold">{pkg.speed}</CardTitle>
        <CardDescription className={pkg.featured ? 'text-purple-100' : ''}>
          {pkg.description}
        </CardDescription>
        {pkg.nightTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>{pkg.nightTime}</span>
          </div>
        )}
      </CardHeader>
      <CardFooter className="justify-center">
        <Button
          variant={pkg.featured ? "secondary" : "default"}
          className="w-full group"
        >
          <span className="flex items-center gap-2">
            <span className="font-semibold">{pkg.price}</span>
            <ShoppingCart className="w-4 h-4 group-hover:animate-pulse" />
          </span>
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="packages solution-based-packages">
      <div className="packages-section">
        <div className="column-header">
          <p className="text-lg font-semibold mb-4">All Pure Wireless packages.</p>

          <Tabs defaultValue="uncapped" className="w-full">
            <TabsList className="grid w-full grid-cols-3 tab-selector">
              <TabsTrigger value="all" className="tab-option">All</TabsTrigger>
              <TabsTrigger value="capped" className="tab-option">Capped</TabsTrigger>
              <TabsTrigger value="uncapped" className="tab-option selected">Uncapped</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="package-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredPackages("all").map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="capped" className="mt-6">
              <div className="package-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredPackages("capped").map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="uncapped" className="mt-6">
              <div className="package-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredPackages("uncapped").map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="packages-sidebar mt-8">
        <div className="column-header">
          <p className="font-bold text-2xl italic mb-6 text-purple-600">pure wireless</p>
        </div>

        <div className="common-features grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="card-product-feature">
              <CardContent className="flex items-start gap-3 p-4">
                <feature.icon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <dt className="font-semibold text-sm">{feature.title}</dt>
                  <dd className="text-sm text-muted-foreground mt-1">{feature.description}</dd>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}