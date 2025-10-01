"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Wifi, Truck, Settings, Clock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProductsByCategory } from "@/hooks/use-products"
import type { Product } from "@/lib/types/products"

// Transform product data for wireless packages
const transformProductToWirelessPackage = (product: Product) => {
  const pricing = product.pricing;
  const speed = pricing ?
    (pricing.download_speed >= 1000 ?
      `${pricing.download_speed / 1000}Gbps` :
      `${pricing.download_speed}Mbps`) :
    'Unknown Speed';

  return {
    id: product.id,
    type: product.features.some(f => f.toLowerCase().includes('capped')) ? 'capped' : 'uncapped',
    speed,
    name: product.name,
    description: product.description || "High-speed connectivity",
    price: Math.round(parseFloat(product.base_price_zar)),
    featured: product.is_featured,
    popular: product.is_popular,
    product
  };
};

const features = [
  {
    icon: Star,
    title: "Save R1 000 on hardware.",
    description: "With selected SIM + Device orders."
  },
  {
    icon: Wifi,
    title: "FREE router.",
    description: "With CircleTel Wireless Plus."
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
    icon: Clock,
    title: "Uncapped thresholds and throttling.",
    description: "See T&Cs for a detailed breakdown."
  }
]

export function ImprovedWirelessPackages() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("uncapped")
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null)

  // Fetch products from connectivity category
  const { products, loading, error } = useProductsByCategory('connectivity', 20)

  const getFilteredPackages = (filter: string) => {
    const transformedPackages = products.map(transformProductToWirelessPackage)

    switch (filter) {
      case 'all':
        return transformedPackages
      case 'capped':
        return transformedPackages.filter(pkg => pkg.type === 'capped')
      case 'uncapped':
        return transformedPackages.filter(pkg => pkg.type === 'uncapped')
      default:
        return transformedPackages
    }
  }

  const handlePackageSelect = (packageId: string) => {
    router.push(`/wireless/order?package=${packageId}`)
  }

  const PackageCard = ({ pkg, index }: { pkg: any; index: number }) => (
    <div
      className={`
        relative bg-white rounded-xl p-6 border-2 transition-all duration-300
        ${hoveredPackage === pkg.id ? 'border-orange-500 shadow-xl transform -translate-y-1' : 'border-gray-100 shadow-sm'}
        ${pkg.featured || pkg.popular ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        hover:shadow-xl hover:border-orange-500 cursor-pointer
      `}
      onMouseEnter={() => setHoveredPackage(pkg.id)}
      onMouseLeave={() => setHoveredPackage(null)}
      style={{
        animationDelay: `${index * 0.1}s`,
        animation: 'fadeInUp 0.5s ease-out forwards'
      }}
    >
      {(pkg.featured || pkg.popular) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            {pkg.popular && <Star className="w-3 h-3 fill-current" />}
            {pkg.featured ? 'MOST POPULAR' : 'POPULAR'}
          </span>
        </div>
      )}

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">{pkg.name}</div>
        <div className="text-lg font-semibold text-orange-600 mb-2">{pkg.speed}</div>
        <div className="text-sm text-gray-500 mb-6 line-clamp-2">{pkg.description}</div>

        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-lg font-semibold">R</span>
            <span className="text-4xl font-bold">{pkg.price}</span>
            <span className="text-lg font-semibold">.00</span>
            <span className="text-sm text-gray-500 ml-1">pm</span>
          </div>
        </div>

        {/* Features list if available */}
        {pkg.product.features.length > 0 && (
          <div className="mb-4 text-left">
            <div className="text-xs font-semibold text-gray-700 mb-2">Features:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              {pkg.product.features.slice(0, 3).map((feature: string, idx: number) => (
                <li key={idx} className="flex items-center">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                  {feature}
                </li>
              ))}
              {pkg.product.features.length > 3 && (
                <li className="text-orange-600">+{pkg.product.features.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        <Button
          onClick={() => handlePackageSelect(pkg.id)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 group"
        >
          <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          Add to Cart
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                All CircleTel Wireless packages.
              </h2>
              <p className="text-gray-600">
                Choose the perfect wireless package for your needs
              </p>
            </div>
            
            {/* CircleTel wireless branding */}
            <div className="text-2xl font-bold italic text-orange-500">
              CircleTel wireless
            </div>
          </div>

          {/* Tabs and Content Grid */}
          <div className="space-y-8">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full max-w-md mx-auto lg:mx-0 grid grid-cols-3 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="all" 
                  className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="capped" 
                  className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Capped
                </TabsTrigger>
                <TabsTrigger 
                  value="uncapped" 
                  className="rounded-lg font-medium transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  Uncapped
                </TabsTrigger>
              </TabsList>

              {/* Main Content Area */}
              <div className="mt-10">
                <div className="grid lg:grid-cols-[1fr,380px] gap-10">
                  {/* Packages Grid */}
                  <div>
                    <TabsContent value="all" className="mt-0">
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
                          ))}
                        </div>
                      ) : getFilteredPackages("all").length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {getFilteredPackages("all").map((pkg, index) => (
                            <PackageCard key={pkg.id} pkg={pkg} index={index} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No packages available at the moment.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="capped" className="mt-0">
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
                          ))}
                        </div>
                      ) : getFilteredPackages("capped").length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {getFilteredPackages("capped").map((pkg, index) => (
                            <PackageCard key={pkg.id} pkg={pkg} index={index} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No capped packages available at the moment.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="uncapped" className="mt-0">
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
                          ))}
                        </div>
                      ) : getFilteredPackages("uncapped").length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {getFilteredPackages("uncapped").map((pkg, index) => (
                            <PackageCard key={pkg.id} pkg={pkg} index={index} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No uncapped packages available at the moment.</p>
                        </div>
                      )}
                    </TabsContent>
                  </div>

                  {/* Features Sidebar */}
                  <div className="bg-gray-50 rounded-2xl p-8 h-fit space-y-6">
                    {features.map((feature, index) => {
                      const Icon = feature.icon
                      return (
                        <div 
                          key={index} 
                          className="flex gap-4 group cursor-pointer"
                          style={{
                            animationDelay: `${(index + 4) * 0.1}s`,
                            animation: 'fadeInRight 0.5s ease-out forwards'
                          }}
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <Icon className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900 mb-1">
                              {feature.title}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}