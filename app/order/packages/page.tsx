'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecureSignupProgress } from '@/components/ui/secure-signup-progress';
import { CheckCircle2, Wifi, Zap, Shield, Clock } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  downloadSpeed: string;
  uploadSpeed: string;
  type: 'fibre' | 'wireless';
  features: string[];
  popular?: boolean;
}

export default function OrderPackagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'fibre' | 'wireless'>('fibre');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const leadId = searchParams.get('leadId');
  const address = searchParams.get('address');

  useEffect(() => {
    // Fetch packages based on leadId
    const fetchPackages = async () => {
      try {
        setLoading(true);
        // Mock data for demonstration
        const mockPackages: Package[] = [
          {
            id: '1',
            name: 'HomeFibre Basic',
            description: 'Perfect for browsing and streaming',
            price: 599,
            promotionalPrice: 399,
            downloadSpeed: '25 Mbps',
            uploadSpeed: '25 Mbps',
            type: 'fibre',
            features: ['Uncapped data', 'Free router', '24/7 support', 'No contract'],
          },
          {
            id: '2',
            name: 'HomeFibre Standard',
            description: 'Great for families and remote work',
            price: 799,
            promotionalPrice: 599,
            downloadSpeed: '50 Mbps',
            uploadSpeed: '50 Mbps',
            type: 'fibre',
            features: ['Uncapped data', 'Free router', '24/7 support', 'No contract'],
            popular: true,
          },
          {
            id: '3',
            name: 'HomeFibre Premium',
            description: 'Ultra-fast for gaming and 4K streaming',
            price: 999,
            promotionalPrice: 799,
            downloadSpeed: '100 Mbps',
            uploadSpeed: '100 Mbps',
            type: 'fibre',
            features: ['Uncapped data', 'Free router', '24/7 support', 'No contract', 'Priority support'],
          },
          {
            id: '4',
            name: '5G Home',
            description: 'Fast wireless internet, no installation',
            price: 699,
            downloadSpeed: '50 Mbps',
            uploadSpeed: '20 Mbps',
            type: 'wireless',
            features: ['100GB data', 'Free 5G router', 'Plug & play', 'No contract'],
          },
          {
            id: '5',
            name: 'LTE Home',
            description: 'Reliable wireless coverage',
            price: 499,
            downloadSpeed: '20 Mbps',
            uploadSpeed: '10 Mbps',
            type: 'wireless',
            features: ['50GB data', 'Free LTE router', 'Plug & play', 'No contract'],
          },
        ];
        setPackages(mockPackages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching packages:', error);
        setLoading(false);
      }
    };

    fetchPackages();
  }, [leadId]);

  // Set default selected package when filteredPackages or selectedType changes
  useEffect(() => {
    if (!loading && filteredPackages.length > 0) {
      setSelectedPackageId(filteredPackages[0].id);
    } else {
      setSelectedPackageId(null);
    }
  }, [loading, selectedType, packages]);

  const filteredPackages = packages.filter((pkg) => pkg.type === selectedType);
  const fibreCount = packages.filter((pkg) => pkg.type === 'fibre').length;
  const wirelessCount = packages.filter((pkg) => pkg.type === 'wireless').length;

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const handleContinue = () => {
    if (selectedPackageId) {
      router.push(`/order/account?leadId=${leadId}&packageId=${selectedPackageId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <SecureSignupProgress currentStep="package" variant="full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Great News! We've Got You Covered
          </h1>
          {address && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
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
                <Wifi className="h-4 w-4 mr-2" />
                Fibre ({fibreCount})
              </TabsTrigger>
              <TabsTrigger value="wireless" className="text-base">
                <Zap className="h-4 w-4 mr-2" />
                Wireless ({wirelessCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fibre" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading packages...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <Card
                      key={pkg.id}
                      className={`relative overflow-hidden transition-all hover:shadow-lg ${
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
                    {pkg.promotionalPrice && (
                      <div className="absolute top-0 left-0">
                        <Badge className="bg-green-600 text-white rounded-none rounded-br-lg px-3 py-1 text-xs">
                          3-MONTH PROMO
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pt-8">
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-base">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div>
                        {pkg.promotionalPrice ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-circleTel-orange">
                                R{pkg.promotionalPrice}
                              </span>
                              <span className="text-xl text-gray-400 line-through">R{pkg.price}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">per month for 3 months</p>
                            <p className="text-xs text-gray-500">Then R{pkg.price}/month</p>
                          </div>
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
                            <p className="text-xl font-bold text-gray-900">{pkg.downloadSpeed}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Upload</p>
                            <p className="text-xl font-bold text-gray-900">{pkg.uploadSpeed}</p>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">What you get for free:</p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleContinue}
                        className={`w-full h-12 text-base font-semibold ${
                          isSelected
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange/90'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        disabled={!isSelected}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </CardFooter>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wireless" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading packages...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <Card key={pkg.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-circleTel-orange shadow-xl' : ''}`}
                      onClick={() => handleSelectPackage(pkg.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                        <CardDescription className="text-base">{pkg.description}</CardDescription>
                      </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div>
                        <span className="text-4xl font-bold text-gray-900">R{pkg.price}</span>
                        <p className="text-sm text-gray-600 mt-1">per month</p>
                      </div>

                      {/* Speed */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">Download</p>
                            <p className="text-xl font-bold text-gray-900">{pkg.downloadSpeed}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Upload</p>
                            <p className="text-xl font-bold text-gray-900">{pkg.uploadSpeed}</p>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">What you get for free:</p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleContinue}
                        className={`w-full h-12 text-base font-semibold ${
                          isSelected
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange/90'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        disabled={!isSelected}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </CardFooter>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <Shield className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Secure Payment</p>
              <p className="text-sm text-gray-600">Bank-level encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <Clock className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">No Contract</p>
              <p className="text-sm text-gray-600">Cancel anytime</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-circleTel-orange flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">24/7 Support</p>
              <p className="text-sm text-gray-600">Always here to help</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
