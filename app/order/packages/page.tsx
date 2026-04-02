'use client';
import { PiCheckCircleBold, PiClockBold, PiLightningBold, PiShieldBold, PiWifiHighBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

interface ApiPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  speed_down?: number;
  speed_up?: number;
  service_type: string;
  product_category?: string;
  features: string[];
  popular?: boolean;
  provider: {
    code: string;
    name: string;
    logo_url?: string;
  } | null;
}

const WIRELESS_TYPES = ['wireless', 'lte', '5g', 'mobile', 'SkyFibre'];

const isWireless = (pkg: ApiPackage) =>
  WIRELESS_TYPES.some(t =>
    pkg.service_type?.toLowerCase().includes(t.toLowerCase()) ||
    pkg.product_category?.toLowerCase().includes(t.toLowerCase())
  );

export default function OrderPackagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state: orderState, actions: orderActions } = useOrderContext();
  const { isAuthenticated, customer } = useCustomerAuth();
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'fibre' | 'wireless'>('fibre');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const leadId = searchParams.get('leadId');
  const address = searchParams.get('address');

  // Protect route - require coverage check first (unless coming from valid flow)
  useEffect(() => {
    const hasCoverageData = orderState.orderData.coverage?.address ||
                            orderState.orderData.coverage?.coordinates ||
                            leadId;

    const savedCoverage = typeof window !== 'undefined'
      ? sessionStorage.getItem('circletel_coverage_address')
      : null;

    if (!hasCoverageData && !savedCoverage && !loading) {
      router.replace('/');
    }
  }, [orderState.orderData.coverage, leadId, loading, router]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!leadId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const coverageType = searchParams.get('type') || 'residential';
        const res = await fetch(
          `/api/coverage/packages?leadId=${leadId}&type=${coverageType}`
        );
        if (!res.ok) throw new Error('Failed to fetch packages');
        const data = await res.json();
        setPackages(data.packages || []);
      } catch (err) {
        console.error('Failed to load packages:', err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [leadId, searchParams]);

  // Pre-select package from order context (for returning users) or default to first
  useEffect(() => {
    if (!loading && packages.length > 0) {
      const savedPackageId = orderState.orderData.package?.selectedPackage?.id;

      if (savedPackageId) {
        const savedPackage = packages.find(pkg => pkg.id === savedPackageId);
        if (savedPackage) {
          setSelectedPackageId(savedPackageId);
          setSelectedType(isWireless(savedPackage) ? 'wireless' : 'fibre');
          return;
        }
      }

      // Default to first package of current type
      const fibrePackages = packages.filter(pkg => !isWireless(pkg));
      const wirelessPackages = packages.filter(pkg => isWireless(pkg));
      const filteredByType = selectedType === 'fibre' ? fibrePackages : wirelessPackages;
      if (filteredByType.length > 0) {
        setSelectedPackageId(filteredByType[0].id);
      } else {
        setSelectedPackageId(null);
      }
    }
  }, [loading, packages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save selected package to order context when it changes
  useEffect(() => {
    if (selectedPackageId && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
      if (selectedPackage) {
        orderActions.updateOrderData({
          package: {
            selectedPackage: {
              id: selectedPackage.id,
              name: selectedPackage.name,
              description: selectedPackage.description,
              monthlyPrice: selectedPackage.promotion_price ?? selectedPackage.price,
              onceOffPrice: 0,
              speed: `${selectedPackage.speed_down ?? 0}/${selectedPackage.speed_up ?? 0} Mbps`,
              service_type: selectedPackage.service_type,
              product_category: selectedPackage.product_category,
              speed_down: selectedPackage.speed_down,
              speed_up: selectedPackage.speed_up,
              price: selectedPackage.price,
              promotion_price: selectedPackage.promotion_price,
              promotion_months: selectedPackage.promotion_months,
              features: selectedPackage.features,
              installation_fee: 0,
              router_included: selectedPackage.features.includes('Free router'),
            },
            pricing: {
              monthly: selectedPackage.promotion_price ?? selectedPackage.price,
              onceOff: 0,
              vatIncluded: true,
              breakdown: [
                {
                  name: 'Monthly subscription',
                  amount: selectedPackage.promotion_price ?? selectedPackage.price,
                  type: 'monthly',
                },
              ],
            },
          },
        });
      }
    }
  }, [selectedPackageId, packages, orderActions]);

  const fibrePackages = packages.filter((pkg) => !isWireless(pkg));
  const wirelessPackages = packages.filter((pkg) => isWireless(pkg));
  const filteredPackages = selectedType === 'fibre' ? fibrePackages : wirelessPackages;

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const handleContinue = () => {
    if (selectedPackageId) {
      const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
      if (selectedPackage) {
        orderActions.updateOrderData({
          package: {
            selectedPackage: {
              id: selectedPackage.id,
              name: selectedPackage.name,
              description: selectedPackage.description,
              monthlyPrice: selectedPackage.promotion_price ?? selectedPackage.price,
              onceOffPrice: 0,
              speed: `${selectedPackage.speed_down ?? 0}/${selectedPackage.speed_up ?? 0} Mbps`,
              service_type: selectedPackage.service_type,
              product_category: selectedPackage.product_category,
              speed_down: selectedPackage.speed_down,
              speed_up: selectedPackage.speed_up,
              price: selectedPackage.price,
              promotion_price: selectedPackage.promotion_price,
              promotion_months: selectedPackage.promotion_months,
              features: selectedPackage.features,
              installation_fee: 0,
              router_included: selectedPackage.features.includes('Free router'),
            },
            pricing: {
              monthly: selectedPackage.promotion_price ?? selectedPackage.price,
              onceOff: 0,
              vatIncluded: true,
              breakdown: [
                {
                  name: 'Monthly subscription',
                  amount: selectedPackage.promotion_price ?? selectedPackage.price,
                  type: 'monthly',
                },
              ],
            },
          },
        });

        if (isAuthenticated && customer) {
          orderActions.updateOrderData({
            account: {
              firstName: customer.first_name || '',
              lastName: customer.last_name || '',
              email: customer.email || '',
              phone: customer.phone || '',
              accountType: customer.account_type || 'personal',
            },
          });
        }
      }

      orderActions.markStepComplete(2);
      router.push('/order/checkout');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CheckoutProgressBar currentStage="packages" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && packages.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CheckoutProgressBar currentStage="packages" />
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No packages available at your address yet
          </h2>
          <p className="text-gray-500 mb-6">
            We&apos;re expanding our network. Join the waitlist and we&apos;ll notify you when service is available.
          </p>
          <a
            href={`https://wa.me/27824873900?text=${encodeURIComponent('Hi, I checked coverage and no packages were available. I would like to be added to the waitlist.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
          >
            Join Waitlist via WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Progress Bar */}
      <CheckoutProgressBar currentStage="packages" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Great News! We&apos;ve Got You Covered
          </h1>
          {address && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <PiCheckCircleBold className="h-5 w-5 text-green-600" />
              <p className="text-lg">{address}</p>
            </div>
          )}
          <p className="text-gray-600 mt-4 text-lg">
            Choose the perfect package for your needs
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'fibre' | 'wireless')} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
              <TabsTrigger value="fibre" className="text-base">
                <PiWifiHighBold className="h-4 w-4 mr-2" />
                Fibre ({fibrePackages.length})
              </TabsTrigger>
              <TabsTrigger value="wireless" className="text-base">
                <PiLightningBold className="h-4 w-4 mr-2" />
                Wireless ({wirelessPackages.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fibre" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <Card
                    key={pkg.id}
                    className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                      pkg.popular ? 'border-circleTel-orange border-2' : ''
                    } ${isSelected ? 'ring-2 ring-circleTel-orange shadow-xl' : ''}`}
                    onClick={() => handleSelectPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-circleTel-orange text-white rounded-none rounded-bl-lg px-4 py-1">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}
                    {pkg.promotion_price && (
                      <div className="absolute top-0 left-0">
                        <Badge className="bg-green-600 text-white rounded-none rounded-br-lg px-3 py-1 text-xs">
                          {pkg.promotion_months ? `${pkg.promotion_months}-MONTH PROMO` : 'PROMO'}
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pt-8">
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-base">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Price */}
                      <div className="mb-4">
                        {pkg.promotion_price ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-circleTel-orange">
                                R{pkg.promotion_price}
                              </span>
                              <span className="text-xl text-gray-400 line-through">R{pkg.price}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              per month for {pkg.promotion_months} months, then R{pkg.price}/month
                            </p>
                          </>
                        ) : (
                          <div>
                            <span className="text-4xl font-bold text-gray-900">R{pkg.price}</span>
                            <p className="text-sm text-gray-600 mt-1">per month</p>
                          </div>
                        )}
                      </div>

                      {/* Speed */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">Download</p>
                            <p className="text-xl font-bold text-gray-900">
                              {pkg.speed_down != null ? `${pkg.speed_down} Mbps` : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Upload</p>
                            <p className="text-xl font-bold text-gray-900">
                              {pkg.speed_up != null ? `${pkg.speed_up} Mbps` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">What you get:</p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <PiCheckCircleBold className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            handleContinue();
                          } else {
                            handleSelectPackage(pkg.id);
                          }
                        }}
                        className={`w-full h-12 text-base font-semibold ${
                          isSelected
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {isSelected ? 'Continue' : 'Select'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="wireless" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <Card
                    key={pkg.id}
                    className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                      pkg.popular ? 'border-circleTel-orange border-2' : ''
                    } ${isSelected ? 'ring-2 ring-circleTel-orange shadow-xl' : ''}`}
                    onClick={() => handleSelectPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-circleTel-orange text-white rounded-none rounded-bl-lg px-4 py-1">
                          MOST POPULAR
                        </Badge>
                      </div>
                    )}
                    {pkg.promotion_price && (
                      <div className="absolute top-0 left-0">
                        <Badge className="bg-green-600 text-white rounded-none rounded-br-lg px-3 py-1 text-xs">
                          {pkg.promotion_months ? `${pkg.promotion_months}-MONTH PROMO` : 'PROMO'}
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pt-8">
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-base">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Price */}
                      <div className="mb-4">
                        {pkg.promotion_price ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-circleTel-orange">
                                R{pkg.promotion_price}
                              </span>
                              <span className="text-xl text-gray-400 line-through">R{pkg.price}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              per month for {pkg.promotion_months} months, then R{pkg.price}/month
                            </p>
                          </>
                        ) : (
                          <div>
                            <span className="text-4xl font-bold text-gray-900">R{pkg.price}</span>
                            <p className="text-sm text-gray-600 mt-1">per month</p>
                          </div>
                        )}
                      </div>

                      {/* Speed */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">Download</p>
                            <p className="text-xl font-bold text-gray-900">
                              {pkg.speed_down != null ? `${pkg.speed_down} Mbps` : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Upload</p>
                            <p className="text-xl font-bold text-gray-900">
                              {pkg.speed_up != null ? `${pkg.speed_up} Mbps` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">What you get:</p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <PiCheckCircleBold className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            handleContinue();
                          } else {
                            handleSelectPackage(pkg.id);
                          }
                        }}
                        className={`w-full h-12 text-base font-semibold ${
                          isSelected
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        {isSelected ? 'Continue' : 'Select'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <PiShieldBold className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Secure Payment</p>
              <p className="text-sm text-gray-600">Bank-level encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <PiClockBold className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">No Contract</p>
              <p className="text-sm text-gray-600">Cancel anytime</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <PiCheckCircleBold className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Local Support</p>
              <p className="text-sm text-gray-600">Mon-Fri, 8am-5pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
