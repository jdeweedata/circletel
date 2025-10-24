'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ServiceToggle, ServiceType } from '@/components/ui/service-toggle';
import { EnhancedPackageCard } from '@/components/ui/enhanced-package-card';
import { CompactPackageCard } from '@/components/ui/compact-package-card';
import { PackageDetailSidebar, MobilePackageDetailOverlay, type BenefitItem, type AdditionalInfoItem } from '@/components/ui/package-detail-sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, MapPin, Wifi, Zap, Heart, Shield, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOrderContext } from '@/components/order/context/OrderContext';
import type { PackageDetails } from '@/lib/order/types';
import { NoCoverageLeadCapture } from '@/components/coverage/NoCoverageLeadCapture';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  provider?: {
    code: string;
    name: string;
    logo_url: string;
    logo_dark_url?: string;
    logo_light_url?: string;
    logo_format?: string;
    logo_aspect_ratio?: number;
  };
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
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    null
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Phase 3: Pagination state - show 8 packages initially
  const [showAllPackages, setShowAllPackages] = useState(false);
  const INITIAL_PACKAGE_COUNT = 8;

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
      setCoordinates(data.coordinates || null);

      // Initialize order with coverage data
      actions.updateOrderData({
        coverage: {
          leadId,
          address: data.address || '',
          coordinates: data.coordinates,
        },
      });

      // Auto-select appropriate tab based on available packages (priority: Fibre > LTE > 5G > Wireless)
      if (data.packages && data.packages.length > 0) {
        const hasFibre = data.packages.some((p: Package) => {
          const serviceType = (p.service_type || p.product_category || '').toLowerCase();
          return serviceType.includes('fibre') && !serviceType.includes('skyfibre');
        });
        const hasLTE = data.packages.some((p: Package) => {
          const serviceType = (p.service_type || p.product_category || '').toLowerCase();
          return serviceType.includes('lte') && !serviceType.includes('5g');
        });
        const has5G = data.packages.some((p: Package) => {
          const serviceType = (p.service_type || p.product_category || '').toLowerCase();
          return serviceType.includes('5g');
        });
        const hasWireless = data.packages.some((p: Package) => {
          const serviceType = (p.service_type || p.product_category || '').toLowerCase();
          return (serviceType.includes('wireless') || serviceType.includes('skyfibre')) &&
                 !serviceType.includes('lte') &&
                 !serviceType.includes('5g');
        });

        // Select first available service type
        let defaultService: ServiceType | null = null;
        if (hasFibre) {
          defaultService = 'fibre';
          setActiveService('fibre');
        } else if (hasLTE) {
          defaultService = 'lte';
          setActiveService('lte');
        } else if (has5G) {
          defaultService = '5g';
          setActiveService('5g');
        } else if (hasWireless) {
          defaultService = 'wireless';
          setActiveService('wireless');
        }

        // Also set default selected package to the FIRST card of the chosen service
        if (defaultService) {
          const matchesService = (p: Package, s: ServiceType) => {
            const st = (p.service_type || p.product_category || '').toLowerCase();
            if (s === 'fibre') return st.includes('fibre') && !st.includes('skyfibre');
            if (s === 'lte') return st.includes('lte') && !st.includes('5g');
            if (s === '5g') return st.includes('5g');
            if (s === 'wireless') return (st.includes('wireless') || st.includes('skyfibre')) && !st.includes('lte') && !st.includes('5g');
            return false;
          };
          const firstOfService = data.packages.find((p: Package) => matchesService(p, defaultService!));
          if (firstOfService) {
            setSelectedPackage(firstOfService);
          }
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
    // Don't automatically open modal - let user choose via floating CTA
    setIsMobileSidebarOpen(false);

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
      package: {
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

  const handleCheckAnotherAddress = () => {
    router.push('/coverage');
  };

  // Map ServiceType to package filtering logic
  const getFilteredPackages = () => {
    if (activeService === 'fibre') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return serviceType.includes('fibre') && !serviceType.includes('skyfibre');
      });
    } else if (activeService === 'lte') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return serviceType.includes('lte') && !serviceType.includes('5g');
      });
    } else if (activeService === '5g') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return serviceType.includes('5g');
      });
    } else if (activeService === 'wireless') {
      return packages.filter(p => {
        const serviceType = (p.service_type || p.product_category || '').toLowerCase();
        return (serviceType.includes('wireless') || serviceType.includes('skyfibre')) &&
               !serviceType.includes('lte') &&
               !serviceType.includes('5g');
      });
    }
    return packages;
  };

  const filteredPackages = getFilteredPackages();

  // Auto-select first package for the current service
  useEffect(() => {
    if (loading) return;
    const current = getFilteredPackages();
    if (current.length === 0) {
      setSelectedPackage(null);
      return;
    }
    if (!selectedPackage || !current.some((p) => p.id === selectedPackage.id)) {
      setSelectedPackage(current[0]);
    }
  }, [loading, activeService, packages]);

  // Phase 3: Get visible packages based on pagination state
  const visiblePackages = showAllPackages
    ? filteredPackages
    : filteredPackages.slice(0, INITIAL_PACKAGE_COUNT);

  const hasMorePackages = filteredPackages.length > INITIAL_PACKAGE_COUNT;
  const remainingCount = filteredPackages.length - INITIAL_PACKAGE_COUNT;

  // Count packages by service type
  const packageCounts = {
    fibre: packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return serviceType.includes('fibre') && !serviceType.includes('skyfibre');
    }).length,
    lte: packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return serviceType.includes('lte') && !serviceType.includes('5g');
    }).length,
    '5g': packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return serviceType.includes('5g');
    }).length,
    wireless: packages.filter(p => {
      const serviceType = (p.service_type || p.product_category || '').toLowerCase();
      return (serviceType.includes('wireless') || serviceType.includes('skyfibre')) &&
             !serviceType.includes('lte') &&
             !serviceType.includes('5g');
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
        {/* No Coverage - Show Lead Capture */}
        {packages.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <NoCoverageLeadCapture
              address={address}
              latitude={coordinates?.lat}
              longitude={coordinates?.lng}
            />
          </div>
        ) : (
          <>
            {/* Coverage Hero Section - Enhanced with Check Another Address CTA */}
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
                <p className="text-lg text-orange-100 mb-6">
                  Choose from our available packages below and get connected today.
                </p>

                {/* Check Another Address Button */}
                <Button
                  onClick={handleCheckAnotherAddress}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Another Address
                </Button>
              </div>
            </div>

            {/* Packages Section */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
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
                  { value: 'lte', label: `LTE (${packageCounts.lte})`, enabled: packageCounts.lte > 0 },
                  { value: '5g', label: `5G (${packageCounts['5g']})`, enabled: packageCounts['5g'] > 0 },
                  { value: 'wireless', label: `Wireless (${packageCounts.wireless})`, enabled: packageCounts.wireless > 0 },
                ]}
              />
            </div>

            {/* Phase 3: Optimized Coverage Disclaimer with Tooltip */}
            <div className="mb-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-blue-900 cursor-help">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-semibold">Coverage estimates may vary</span>
                        <Info className="w-4 h-4 shrink-0 opacity-70" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[300px] p-3">
                      <p className="text-xs leading-relaxed">
                        Coverage estimates are based on network provider infrastructure data and are as accurate as
                        provided by the network providers. Actual availability may vary based on location and network conditions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  onClick={handleCheckAnotherAddress}
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Another
                </Button>
              </div>
            </div>

            {/* Two-Column Layout: Compact Cards (Left) + Detail Sidebar (Right) */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left Column: Compact Package Cards Grid - MOBILE OPTIMIZED */}
              <div className="flex-1">
                {filteredPackages.length > 0 ? (
                  <>
                    <div className={cn(
                      // MOBILE: Single column with full width cards
                      'grid grid-cols-1',
                      // TABLET: 2 columns
                      'sm:grid-cols-2',
                      // DESKTOP: 3 columns
                      'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
                      // Spacing
                      'gap-4 sm:gap-5 md:gap-6'
                    )}>
                      {visiblePackages.map((pkg) => {
                        const serviceType = (pkg.service_type || pkg.product_category || '').toLowerCase();
                        const getBadgeColor = (): 'pink' | 'orange' | 'yellow' | 'blue' => {
                          if (serviceType.includes('homefibre') || serviceType.includes('fibre_consumer')) {
                            return 'pink';
                          } else if (serviceType.includes('bizfibre') || serviceType.includes('fibre_business')) {
                            return 'orange';
                          } else if (serviceType.includes('wireless') || serviceType.includes('lte')) {
                            return 'blue';
                          } else if (serviceType.includes('5g')) {
                            return 'yellow';
                          }
                          return 'pink';
                        };

                        return (
                          <CompactPackageCard
                            key={pkg.id}
                            promoPrice={pkg.promotion_price || pkg.price}
                            originalPrice={pkg.promotion_price ? pkg.price : undefined}
                            promoBadge={pkg.promotion_price ? `${pkg.promotion_months}-MONTH PROMO` : undefined}
                            badgeColor={getBadgeColor()}
                            name={pkg.name}
                            type="uncapped"
                            downloadSpeed={pkg.speed_down}
                            uploadSpeed={pkg.speed_up}
                            provider={pkg.provider}
                            selected={selectedPackage?.id === pkg.id}
                            onClick={() => handlePackageSelect(pkg)}
                          />
                        );
                      })}
                    </div>

                    {/* Phase 3: Show More / Show Less Button */}
                    {hasMorePackages && (
                      <div className="mt-8 flex justify-center">
                        <Button
                          onClick={() => {
                            setShowAllPackages(!showAllPackages);
                            // Smooth scroll to top of packages when collapsing
                            if (showAllPackages) {
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }
                          }}
                          variant="outline"
                          size="lg"
                          className={cn(
                            'min-w-[200px] border-2',
                            'transition-all duration-200',
                            'hover:bg-circleTel-orange hover:text-white hover:border-circleTel-orange'
                          )}
                        >
                          {showAllPackages ? (
                            <>
                              <ChevronUp className="w-5 h-5 mr-2" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-5 h-5 mr-2" />
                              Show {remainingCount} More {remainingCount === 1 ? 'Package' : 'Packages'}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
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

              {/* Right Column: Sticky Detail Sidebar (Desktop Only) */}
              {selectedPackage && (
                <div className="hidden lg:block lg:w-[400px]">
                  <PackageDetailSidebar
                    promoPrice={selectedPackage.promotion_price || selectedPackage.price}
                    originalPrice={selectedPackage.promotion_price ? selectedPackage.price : undefined}
                    promoDescription={selectedPackage.promotion_months ? `first ${selectedPackage.promotion_months} months` : undefined}
                    name={selectedPackage.name}
                    type="uncapped"
                    downloadSpeed={selectedPackage.speed_down}
                    uploadSpeed={selectedPackage.speed_up}
                    providerName={selectedPackage.service_type}
                    benefits={[
                      {
                        text: 'Free set-up worth R1699',
                        tooltipTitle: 'Free set-up worth R1699',
                        tooltipDescription: "We'll cover your set-up fee on your behalf. You're welcome! If your Fibre is not installed and activated within 14 (MDU) / 21 (SDU) days, we will credit your account with R999. T&Cs apply."
                      } as BenefitItem,
                      {
                        text: 'Fully insured, Free-to-Use Router',
                        tooltipTitle: 'Fully insured, Free-to-Use Router',
                        tooltipDescription: 'Your router is fully covered for the duration of your contract. No worries if it breaks - we will replace it at no cost to you.'
                      } as BenefitItem,
                    ]}
                    additionalInfo={{
                      title: 'What else you should know:',
                      items: [
                        {
                          text: 'Installation time: 7 days*',
                          tooltipTitle: 'Installation time: 7 days*',
                          tooltipDescription: 'Average installation time is 7 working days from order confirmation. Actual time may vary based on location and infrastructure availability.'
                        } as AdditionalInfoItem,
                        {
                          text: 'Once-off processing fee: R249',
                          tooltipTitle: 'Once-off processing fee: R249',
                          tooltipDescription: 'This one-time fee covers administrative costs for setting up your account and processing your order.'
                        } as AdditionalInfoItem,
                        {
                          text: 'Month-to-month contract',
                        },
                        {
                          text: '24/7 customer support',
                        },
                      ] as (string | AdditionalInfoItem)[],
                    }}
                    recommended={filteredPackages.indexOf(selectedPackage) === 0}
                    onOrderClick={handleContinue}
                  />
                </div>
              )}
            </div>
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

            {/* Mobile Package Detail Overlay */}
      {selectedPackage && isMobileSidebarOpen && (
        <MobilePackageDetailOverlay
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          promoPrice={selectedPackage.promotion_price || selectedPackage.price}
          originalPrice={selectedPackage.promotion_price ? selectedPackage.price : undefined}
          promoDescription={selectedPackage.promotion_months ? `first ${selectedPackage.promotion_months} months` : undefined}
          name={selectedPackage.name}
          type="uncapped"
          downloadSpeed={selectedPackage.speed_down}
          uploadSpeed={selectedPackage.speed_up}
          providerName={selectedPackage.service_type}
          benefits={[
            {
              text: 'Free set-up worth R1699',
              tooltipTitle: 'Free set-up worth R1699',
              tooltipDescription: "We'll cover your set-up fee on your behalf. You're welcome! If your Fibre is not installed and activated within 14 (MDU) / 21 (SDU) days, we will credit your account with R999. T&Cs apply."
            } as BenefitItem,
            {
              text: 'Fully insured, Free-to-Use Router',
              tooltipTitle: 'Fully insured, Free-to-Use Router',
              tooltipDescription: 'Your router is fully covered for the duration of your contract. No worries if it breaks - we will replace it at no cost to you.'
            } as BenefitItem,
          ]}
          additionalInfo={{
            title: 'What else you should know:',
            items: [
              {
                text: 'Installation time: 7 days*',
                tooltipTitle: 'Installation time: 7 days*',
                tooltipDescription: 'Average installation time is 7 working days from order confirmation. Actual time may vary based on location and infrastructure availability.'
              } as AdditionalInfoItem,
              {
                text: 'Once-off processing fee: R249',
                tooltipTitle: 'Once-off processing fee: R249',
                tooltipDescription: 'This one-time fee covers administrative costs for setting up your account and processing your order.'
              } as AdditionalInfoItem,
              {
                text: 'Month-to-month contract',
              },
              {
                text: '24/7 customer support',
              },
            ] as (string | AdditionalInfoItem)[],
          }}
          recommended={filteredPackages.indexOf(selectedPackage) === 0}
          onOrderClick={handleContinue}
        />
      )}

      {/* Floating CTA (Mobile Only) - Enhanced Touch Target */}
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
                className="flex-1 sm:flex-none min-h-[44px]"
                size="default"
              >
                View Details
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1 sm:flex-none bg-circleTel-orange hover:bg-orange-600 text-white min-h-[44px]"
                size="default"
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>
      )}
          </>
        )}

        <Footer />
      </div>
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
