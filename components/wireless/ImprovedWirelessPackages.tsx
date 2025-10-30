"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, Wifi, Truck, Settings, Clock, Loader2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProductsByCategory } from "@/hooks/use-products"
import type { Product } from "@/lib/types/products"
import { Card } from "@/components/ui/card"

// Transform product data for wireless packages
const transformProductToWirelessPackage = (product: Product) => {
  const pricing = product.pricing;

  // Read speed from pricing object (preferred) or fallback to Unknown
  const speed = pricing ?
    (pricing.download_speed >= 1000 ?
      `${pricing.download_speed / 1000}Gbps` :
      `${pricing.download_speed}Mbps`) :
    'Unknown Speed';

  // Read price from pricing object (preferred) or fallback to base_price_zar for backward compatibility
  const monthlyPrice = pricing?.monthly ?? parseFloat(product.base_price_zar);

  return {
    id: product.id,
    type: product.features.some(f => f.toLowerCase().includes('capped')) ? 'capped' : 'uncapped',
    speed,
    name: product.name,
    description: product.description || "High-speed connectivity",
    price: Math.round(monthlyPrice), // Now reads from pricing.monthly with fallback
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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Fetch products from connectivity category
  const { products, loading, error } = useProductsByCategory('connectivity', 20)

  // Set default selection to first uncapped package on mount
  useEffect(() => {
    const uncappedPackages = products.filter(p => 
      !p.features.some(f => f.toLowerCase().includes('capped'))
    )
    if (uncappedPackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(uncappedPackages[0].id)
    }
  }, [products, selectedPackageId])

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

  const selectedPackage = products.find(p => p.id === selectedPackageId)
  const selectedTransformed = selectedPackage ? transformProductToWirelessPackage(selectedPackage) : null

  const PackageCard = ({ pkg, index }: { pkg: any; index: number }) => {
    const isSelected = selectedPackageId === pkg.id
    
    return (
      <div
        className={`
          relative bg-white rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer
          ${isSelected ? 'border-orange-500 shadow-xl ring-2 ring-orange-500 ring-offset-2' : 'border-gray-100 shadow-sm'}
          ${hoveredPackage === pkg.id && !isSelected ? 'border-orange-300 shadow-lg transform -translate-y-1' : ''}
          ${pkg.featured || pkg.popular ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
          hover:shadow-xl hover:border-orange-500
        `}
        onClick={() => setSelectedPackageId(pkg.id)}
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
          <div className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</div>
          <div className="text-lg font-semibold text-orange-600 mb-3">{pkg.speed}</div>
          <div className="text-sm text-gray-500 mb-8 min-h-[40px] flex items-center justify-center">{pkg.description}</div>

          <div className="mb-8">
            <div className="flex items-baseline justify-center">
              <span className="text-lg font-semibold">R</span>
              <span className="text-4xl font-bold">{pkg.price}</span>
              <span className="text-lg font-semibold">.00</span>
              <span className="text-sm text-gray-500 ml-1">pm</span>
            </div>
          </div>

          {/* Features list if available */}
          {pkg.product.features.length > 0 && (
            <div className="mb-6 text-left">
              <div className="text-xs font-semibold text-gray-700 mb-3">Features:</div>
              <ul className="text-xs text-gray-600 space-y-2">
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
            onClick={(e) => {
              e.stopPropagation()
              handlePackageSelect(pkg.id)
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 group"
          >
            <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            Add to Cart
          </Button>
        </div>
      </div>
    )
  }

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
                  <div className="space-y-6">
                    {/* Selected Package Info Card */}
                    {selectedTransformed && (
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{selectedTransformed.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{selectedTransformed.speed}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">R{selectedTransformed.price}</div>
                            <div className="text-xs text-gray-500">per month</div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Uncapped data usage</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>No throttling or FUP</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Month-to-month contract</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>24/7 customer support</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handlePackageSelect(selectedTransformed.id)}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg"
                        >
                          Order Now
                        </Button>
                      </Card>
                    )}

                    {/* Features List */}
                    <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
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