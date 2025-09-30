"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Wifi, Truck, Settings, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useNotification } from "@/components/ui/notification"
import { WirelessPackage, WirelessPackagesConfig } from "@/lib/types/wireless-packages"
import packagesConfig from "@/lib/wireless-packages-config.json"

const iconMap = {
  star: Star,
  router: Wifi,
  truck: Truck,
  plug: Settings,
  clock: Clock
}

export function EnhancedWirelessPackagesSection() {
  const router = useRouter()
  const { showNotification, NotificationContainer } = useNotification()
  const [isLoaded, setIsLoaded] = useState(false)
  const [cart, setCart] = useState<string[]>([])

  const config = packagesConfig as WirelessPackagesConfig

  useEffect(() => {
    // Simulate loading state for animation
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const formatPrice = (amount: number, currency: string = "ZAR") => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount).replace('ZAR', 'R')
  }

  const getFilteredPackages = (filter: string): WirelessPackage[] => {
    if (filter === "all") {
      return [...config.packages.uncapped, ...config.packages.capped]
    }
    return filter === "uncapped" ? config.packages.uncapped : config.packages.capped
  }

  const handleAddToCart = (pkg: WirelessPackage, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Add pulse animation to the clicked card
    const card = (event.target as HTMLElement).closest('.wireless-package-card')
    if (card) {
      card.classList.add('animate-pulse-card')
      setTimeout(() => {
        card.classList.remove('animate-pulse-card')
      }, 500)
    }

    // Update cart
    if (!cart.includes(pkg.id)) {
      setCart(prev => [...prev, pkg.id])

      const displayName = pkg.speed || pkg.data || pkg.name
      const price = formatPrice(pkg.price.amount)
      showNotification(
        `${displayName} (${price}) added to cart!`,
        "success"
      )
    } else {
      showNotification(
        `${pkg.speed || pkg.data || pkg.name} is already in your cart`,
        "info"
      )
    }
  }

  const handlePackageSelect = (packageId: string) => {
    router.push(`/wireless/order?package=${packageId}`)
  }

  const PackageCard = ({ pkg, index }: { pkg: WirelessPackage; index: number }) => {
    const isInCart = cart.includes(pkg.id)
    const isPremium = pkg.premium
    const isPopular = pkg.popular

    return (
      <div
        className="wireless-package-card animate-fade-in cursor-pointer"
        style={{ animationDelay: `${index * 0.1}s` }}
        onClick={() => handlePackageSelect(pkg.id)}
      >

        <div className="text-center">
          {/* Speed/Data Badge */}
          <div className="text-2xl font-bold mb-2 text-gray-900">
            {pkg.speed || pkg.data}
          </div>

          {/* Description */}
          <div className="text-sm mb-6 text-muted-foreground">
            {pkg.description}
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center text-gray-900">
              <span className="text-lg font-bold">R</span>
              <span className="text-3xl font-bold">{pkg.price.amount}</span>
              <span className="text-lg font-bold">.00</span>
              <span className="text-base ml-2 text-muted-foreground">
                pm
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={(e) => handleAddToCart(pkg, e)}
            className={`w-full font-semibold py-3 rounded-lg group transition-all duration-300 ${
              isInCart
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-circleTel-orange hover:bg-circleTel-orange/90 text-white'
            }`}
            variant="default"
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4 group-hover:animate-pulse" />
              <span>{isInCart ? 'In Cart' : 'Add to Cart'}</span>
            </span>
          </Button>
        </div>
      </div>
    )
  }

  const FeatureItem = ({ feature, index }: { feature: any; index: number }) => {
    const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Star

    return (
      <div
        className="feature-item animate-fade-in"
        style={{ animationDelay: `${(index + 4) * 0.1}s` }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-orange-100">
            <IconComponent className="w-6 h-6 text-circleTel-orange" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {feature.link ? (
                <a
                  href={feature.link}
                  className="text-circleTel-orange hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    showNotification("Terms & Conditions would open in a new window", "info")
                  }}
                >
                  {feature.description}
                </a>
              ) : (
                feature.description
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
            {/* Main Packages Section */}
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  All CircleTel Wireless packages.
                </h2>
                <p className="text-muted-foreground mb-6">
                  Choose the perfect wireless package for your needs
                </p>

                {/* Tab Selector */}
                <Tabs defaultValue={config.settings.defaultTab} className="w-full max-w-md mx-auto lg:mx-0">
                  <TabsList className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                      value="all"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="capped"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Capped
                    </TabsTrigger>
                    <TabsTrigger
                      value="uncapped"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                    >
                      Uncapped
                    </TabsTrigger>
                  </TabsList>

                  {["all", "capped", "uncapped"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-8">
                      {getFilteredPackages(tab).length === 4 ? (
                        // Layout for 4 packages: 2x2 grid for better space utilization
                        <div className="packages-grid-container grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                          {getFilteredPackages(tab).map((pkg, index) => (
                            <PackageCard key={pkg.id} pkg={pkg} index={index} />
                          ))}
                        </div>
                      ) : (
                        // Standard grid layout for other cases
                        <div className={`packages-grid-container grid gap-6 ${
                          getFilteredPackages(tab).length === 3
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2"
                        }`}>
                          {getFilteredPackages(tab).map((pkg, index) => (
                            <PackageCard key={pkg.id} pkg={pkg} index={index} />
                          ))}
                        </div>
                      )}
                      {getFilteredPackages(tab).length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No {tab} packages available at the moment.</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            {/* Features Sidebar */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold italic text-circleTel-orange mb-6">
                  CircleTel wireless
                </h3>
              </div>

              <div className="space-y-4">
                {config.features.map((feature, index) => (
                  <FeatureItem key={index} feature={feature} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <NotificationContainer />
    </>
  )
}