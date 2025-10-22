'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceToggle, ServiceType } from '@/components/ui/service-toggle';
import { EnhancedPackageCard } from '@/components/ui/enhanced-package-card';
import { PackageDetailSidebar, MobilePackageDetailOverlay } from '@/components/ui/package-detail-sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, MapPin, Wifi, Zap, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOrderContext } from '@/components/order/context/OrderContext';
import type { PackageDetails } from '@/lib/order/types';

interface Package {
  id: string;
  name: string;
  service_type: string;
  product_category?: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

function PackagesContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = params.leadId as string;
  const coverageType = searchParams.get('type') || 'residential';

  // Use OrderContext for state persistence
  const { state, actions } = useOrderContext();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState<ServiceType>('fibre');
  const [address, setAddress] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    null
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [leadId, coverageType]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`/api/coverage/packages?leadId=${leadId}&type=${coverageType}`);
      if (!response.ok) throw new Error('Failed to fetch packages');

      const data = await response.json();
      setPackages(data.packages || []);
      setAddress(data.address || '');

      // Initialize order with coverage data
      actions.updateOrderData({
        coverage: {
          leadId,
          address: data.address || '',
          coordinates: data.coordinates,
        },
      });

      // Auto-select appropriate tab based on available packages
      if (data.packages && data.packages.length > 0) {
        const hasFibre = data.packages.some((p: Package) =>
          (p.service_type || p.product_category || '').toLowerCase().includes('fibre')
        );
        const hasWireless = data.packages.some((p: Package) => {
          const serviceType = (p.service_type || p.product_category || '').toLowerCase();
          return serviceType.includes('wireless') || serviceType.includes('lte') || serviceType.includes('5g');
        });

        if (!hasFibre && hasWireless) {
          setActiveService('wireless');
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsMobileSidebarOpen(true);

    // Convert Package to PackageDetails and save to context
    const packageDetails: PackageDetails = {
      id: pkg.id,
      name: pkg.name,
      service_type: pkg.service_type,
      product_category: pkg.product_category,
      speed_down: pkg.speed_down,
      speed_up: pkg.speed_up,
      price: String(pkg.price),
      promotion_price: pkg.promotion_price ? String(pkg.promotion_price) : null,
      promotion_months: pkg.promotion_months || null,
      description: pkg.description,
      features: pkg.features || [],
      monthlyPrice: pkg.promotion_price || pkg.price,
      speed: `${pkg.speed_down}/${pkg.speed_up} Mbps`,
    };

    // Save selected package to OrderContext
    actions.updateOrderData({
      coverage: {
        ...state.orderData.coverage,
        selectedPackage: packageDetails,
        pricing: {
          monthly: pkg.promotion_price || pkg.price,
          onceOff: 0,
          vatIncluded: true,
          breakdown: [
            {
              name: pkg.name,
              amount: pkg.promotion_price || pkg.price,
              type: 'monthly',
            },
          ],
        },
      },
    });

    // Scroll to top to show sidebar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = () => {
    if (selectedPackage) {
      // Mark coverage step as complete and navigate to next step
      actions.markStepComplete(1);
      actions.setCurrentStage(2); // Move to account step
      router.push('/order/account');
    }
  };

  // Map ServiceType to package filtering logic
  const getFilteredPackages = () => {
    if (activeService === 'fibre') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return serviceType.includes('fibre') && !serviceType.includes('skyfibre');
      });
    } else if (activeService === 'wireless' || activeService === 'lte') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return serviceType.includes('wireless') ||
               serviceType.includes('lte') ||
               serviceType.includes('5g') ||
               serviceType.includes('skyfibre');
      });
    }
    return packages;
  };

  const filteredPackages = getFilteredPackages();

  // Count packages by service type
  const packageCounts = {
    fibre: packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return serviceType.includes('fibre') && !serviceType.includes('skyfibre');
    }).length,
    wireless: packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return serviceType.includes('wireless') ||
             serviceType.includes('lte') ||
             serviceType.includes('5g') ||
             serviceType.includes('skyfibre');
    }).length,
  };

  // Map Package to EnhancedPackageCard props
  const mapPackageToCardProps = (pkg: Package) => {
    const isPromotion = !!pkg.promotion_price;
    const serviceType = (pkg.service_type || pkg.product_category || '').toLowerCase();

    // Determine badge color based on product type
    const getBadgeColor = (): 'pink' | 'orange' | 'yellow' | 'blue' => {
      if (serviceType.includes('homefibre') || serviceType.includes('fibre_consumer')) {
        return 'pink';  // Consumer fibre
      } else if (serviceType.includes('bizfibre') || serviceType.includes('fibre_business')) {
        return 'orange';  // Business fibre
      } else if (serviceType.includes('wireless') || serviceType.includes('lte')) {
        return 'blue';  // Wireless/LTE
      } else if (serviceType.includes('5g')) {
        return 'yellow';  // 5G
      }
      return 'pink';  // Default
    };

    return {
      promoPrice: pkg.promotion_price || pkg.price,
      originalPrice: isPromotion ? pkg.price : undefined,
      promoBadge: isPromotion ? `${pkg.promotion_months}-MONTH PROMO` : undefined,
      promoDescription: isPromotion ? `first ${pkg.promotion_months} months` : undefined,
      badgeColor: getBadgeColor(),
      name: pkg.name,
      type: 'uncapped' as const,
      downloadSpeed: pkg.speed_down,
      uploadSpeed: pkg.speed_up,
      providerName: pkg.service_type,
      benefits: pkg.features?.slice(0, 3) || [],
      additionalInfo: {
        title: 'Package Details',
        items: [
          pkg.description,
          'Month-to-month contract',
          '24/7 customer support',
          '99.9% uptime guarantee',
        ].filter(Boolean),
      },
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Coverage Hero Section */}
        <div className="relative bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-3xl p-8 lg:p-12 mb-8 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Great News! We&apos;ve Got You Covered
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg text-orange-100 mb-4">
              <MapPin className="w-5 h-5" />
              <span>{address || 'Your selected location'}</span>
            </div>
            <p className="text-lg text-orange-100">
              Choose from our available packages below and get connected today.
            </p>
          </div>
        </div>

        {/* Packages Section */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Available Packages ({packages.length})
              </h2>
              <p className="text-gray-600">
                Choose the perfect package for your connectivity needs
              </p>
            </div>

            {/* Service Toggle */}
            <div className="mb-8">
              <ServiceToggle
                activeService={activeService}
                onServiceChange={setActiveService}
                services={[
                  { value: 'fibre', label: `Fibre (${packageCounts.fibre})`, enabled: packageCounts.fibre > 0 },
                  { value: 'wireless', label: `Wireless (${packageCounts.wireless})`, enabled: packageCounts.wireless > 0 },
                ]}
              />
            </div>

            {/* MTN Coverage Disclaimer */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Coverage Information
              </p>
              <p className="mt-2 text-sm text-blue-800 leading-relaxed">
                Coverage estimates are based on network provider infrastructure data and are as accurate as provided by the network providers.
                Actual availability may vary based on location and network conditions.
              </p>
            </div>

            {/* Packages Grid - 3x3 Layout */}
            <div>
              {filteredPackages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map((pkg) => {
                    const cardProps = mapPackageToCardProps(pkg);
                    return (
                      <EnhancedPackageCard
                        key={pkg.id}
                        {...cardProps}
                        selected={selectedPackage?.id === pkg.id}
                        onClick={() => handlePackageSelect(pkg)}
                        onOrderClick={() => handleContinue()}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">
                    No {activeService} packages available at this location.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try switching to another service type above.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Package Details - Full Width Below Grid */}
            {selectedPackage && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-8 border-2 border-circleTel-orange">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-2">
                      {selectedPackage.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{selectedPackage.description}</p>

                    {/* Pricing Display */}
                    <div className="flex items-baseline gap-3">
                      {selectedPackage.promotion_price && selectedPackage.promotion_price !== selectedPackage.price && (
                        <span className="text-lg text-gray-500 line-through">
                          R{Number(selectedPackage.price).toLocaleString()}pm
                        </span>
                      )}
                      <span className="text-4xl font-bold text-circleTel-orange">
                        R{Number(selectedPackage.promotion_price || selectedPackage.price).toLocaleString()}
                      </span>
                      <span className="text-xl text-circleTel-secondaryNeutral">pm</span>
                      {selectedPackage.promotion_months && (
                        <span className="text-sm text-gray-600 ml-2">
                          / first {selectedPackage.promotion_months} months
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="bg-circleTel-orange hover:bg-orange-600 text-white whitespace-nowrap"
                  >
                    Continue with this package
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Zap className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Super-Fast Speeds</h3>
              <p className="text-gray-600">
                From 10 Mbps to unlimited speeds, we have options for every need.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Wifi className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reliable Connection</h3>
              <p className="text-gray-600">
                Enterprise-grade connectivity with 99.9% uptime guarantee.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our dedicated support team is always here to help you stay connected.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Need help choosing the right package?
          </h2>
          <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
            Our team of experts is ready to help you find the perfect connectivity solution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-circleTel-orange font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="tel:0860123456"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-700 text-white font-semibold rounded-xl hover:bg-orange-800 transition-colors"
            >
              Call 086 012 3456
            </a>
          </div>
        </div>
      </div>

      {/* Floating CTA (Mobile Only) - Simplified for 3x3 grid */}
      {selectedPackage && !isMobileSidebarOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-circleTel-orange shadow-2xl p-4 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-12 h-12 bg-circleTel-orange rounded-full flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-base text-gray-900 truncate">{selectedPackage.name}</h3>
                <p className="text-sm text-gray-600">
                  R{Number(selectedPackage.promotion_price || selectedPackage.price).toLocaleString()}/month
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                View Details
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1 sm:flex-none bg-circleTel-orange hover:bg-orange-600 text-white"
                size="sm"
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <PackagesContent />
    </Suspense>
  );
}
