import React, { useState } from 'react';
import { MapPin, Wifi, Building2, Zap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedAddressInput } from './EnhancedAddressInput';
import { CircleTelOrderModal } from './CircleTelOrderModal';
import { multiProviderCoverageService, MultiProviderCoverageResult, TechnologyType } from '@/services/multiProviderCoverage';
import { zohoIntegrationService } from '@/services/zohoIntegration';
import clsx from 'clsx';

interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    sublocality?: string;
    administrativeAreaLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

interface EnhancedCoverageCheckProps {
  mode?: 'embedded' | 'fullpage' | 'modal';
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };
  focusTechnologies?: TechnologyType[];
  onCoverageFound?: (result: MultiProviderCoverageResult, packages: ServicePackage[]) => void;
  onLeadCreated?: (leadId: string) => void;
  onOrderStarted?: (package: ServicePackage) => void;
  className?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  technology: TechnologyType;
  provider: string;
  speed: string;
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  contract: number;
  features: string[];
  available: boolean;
  isRecommended?: boolean;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

const TECHNOLOGY_CONFIG = {
  'FIBRE': {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Zap,
    label: 'Fibre',
    description: 'Ultra-fast fibre optic internet'
  },
  'FIXED_WIRELESS': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Wifi,
    label: 'SkyFibre',
    description: 'High-speed wireless internet'
  },
  'LTE': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Building2,
    label: '4G/5G',
    description: 'Mobile broadband internet'
  }
} as const;

// Mock package data - in real implementation, this would come from a service
const MOCK_PACKAGES: ServicePackage[] = [
  {
    id: 'bizfibre-100',
    name: 'BizFibreConnect 100Mbps',
    technology: 'FIBRE',
    provider: 'DFA',
    speed: '100Mbps',
    price: 899,
    installation: 0,
    originalInstallation: 1299,
    router: 0,
    originalRouter: 899,
    contract: 24,
    features: ['Uncapped', 'Static IP', '24/7 Support', 'SLA Guarantee'],
    available: false,
    isRecommended: true,
    promotionalOffer: {
      freeInstallation: true,
      freeRouter: true,
      validUntil: '31 Dec 2025'
    }
  },
  {
    id: 'skyfibre-50',
    name: 'SkyFibre 50Mbps',
    technology: 'FIXED_WIRELESS',
    provider: 'CircleTel Wireless',
    speed: '50Mbps',
    price: 699,
    installation: 0,
    originalInstallation: 999,
    router: 0,
    originalRouter: 699,
    contract: 12,
    features: ['Uncapped', 'Quick Setup', 'Mobile Backup'],
    available: false,
    promotionalOffer: {
      freeInstallation: true,
      freeRouter: true,
      validUntil: '31 Dec 2025'
    }
  },
  {
    id: 'skyfibre-100',
    name: 'SkyFibre 100Mbps',
    technology: 'FIXED_WIRELESS',
    provider: 'CircleTel Wireless',
    speed: '100Mbps',
    price: 999,
    installation: 0,
    originalInstallation: 999,
    router: 0,
    originalRouter: 899,
    contract: 24,
    features: ['Uncapped', 'Priority Support', 'Static IP', 'Mobile Backup'],
    available: false,
    isRecommended: true,
    promotionalOffer: {
      freeInstallation: true,
      freeRouter: true,
      validUntil: '31 Dec 2025'
    }
  },
  {
    id: 'openserve-100',
    name: 'Openserve Fibre 100Mbps',
    technology: 'FIBRE',
    provider: 'Openserve',
    speed: '100Mbps',
    price: 849,
    installation: 999,
    router: 0,
    originalRouter: 599,
    contract: 24,
    features: ['Uncapped', 'Standard Support'],
    available: false,
    promotionalOffer: {
      freeInstallation: false,
      freeRouter: true,
      validUntil: '31 Dec 2025'
    }
  }
];

export const EnhancedCoverageCheck: React.FC<EnhancedCoverageCheckProps> = ({
  mode = 'embedded',
  initialAddress,
  initialCoordinates,
  focusTechnologies,
  onCoverageFound,
  onLeadCreated,
  onOrderStarted,
  className
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [coverageResult, setCoverageResult] = useState<MultiProviderCoverageResult | null>(null);
  const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', company: '' });
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  const handleAddressSelect = async (addressResult: AddressResult) => {
    setSelectedAddress(addressResult);
    setIsChecking(true);
    setCoverageResult(null);
    setAvailablePackages([]);

    try {
      console.log('Checking coverage for:', addressResult);

      // Check coverage across all providers
      const result = await multiProviderCoverageService.checkAllProviders(
        addressResult.latitude,
        addressResult.longitude,
        addressResult.address
      );

      setCoverageResult(result);

      // Get available packages based on coverage
      const packages = getAvailablePackages(result);
      setAvailablePackages(packages);

      // Call callback if provided
      if (onCoverageFound) {
        onCoverageFound(result, packages);
      }

      // If no coverage, show lead capture form
      if (!result.overall.hasAnyConcentration) {
        setShowLeadForm(true);
      }

    } catch (error) {
      console.error('Coverage check failed:', error);
      // Show error state or fallback
    } finally {
      setIsChecking(false);
    }
  };

  const getAvailablePackages = (result: MultiProviderCoverageResult): ServicePackage[] => {
    if (!result.overall.hasAnyConcentration) {
      return [];
    }

    // Filter packages based on available technologies and providers
    const availableProviders = result.providers
      .filter(p => p.hasConcentration)
      .map(p => p.provider);

    const availableTechs = result.overall.availableTechnologies;

    return MOCK_PACKAGES
      .filter(pkg =>
        availableProviders.includes(pkg.provider) &&
        availableTechs.includes(pkg.technology)
      )
      .map(pkg => ({ ...pkg, available: true }))
      .sort((a, b) => {
        // Sort by recommendation, then by price
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.price - b.price;
      });
  };

  const handleLeadSubmit = async () => {
    if (!selectedAddress || !leadData.email) return;

    setIsCreatingLead(true);
    try {
      // Create lead through Zoho integration
      const response = await zohoIntegrationService.coverageCheck({
        email: leadData.email,
        phone: leadData.phone,
        address: selectedAddress.address,
        hasConcentration: false,
        availableServices: [],
        requestedServices: focusTechnologies || ['FIBRE', 'FIXED_WIRELESS']
      });

      if (response.success) {
        setShowLeadForm(false);
        if (onLeadCreated) {
          onLeadCreated(response.data?.id || 'unknown');
        }
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setShowOrderModal(true);
    if (onOrderStarted) {
      onOrderStarted(pkg);
    }
  };

  interface CustomerInfo {
    address: string;
    coordinates: { lat: number; lng: number };
  }

  interface CustomerDetails {
    name: string;
    email: string;
    phone: string;
    alternatePhone: string;
    customAddress: string;
  }

  interface AddOn {
    id: string;
    name: string;
    price: number;
  }

  interface OrderData {
    package: ServicePackage;
    addOns: (AddOn | undefined)[];
    customerDetails: CustomerDetails;
    customerInfo?: CustomerInfo;
    total: number;
    savings: number;
  }

  const handleOrderComplete = (orderData: OrderData) => {
    console.log('Order completed:', orderData);
    setShowOrderModal(false);
    setSelectedPackage(null);
    // Here you would typically send the order to your backend
    // and navigate to a confirmation page
  };

  const containerClasses = clsx(
    'w-full',
    {
      'max-w-4xl mx-auto': mode === 'fullpage',
      'max-w-2xl': mode === 'embedded',
      'max-w-3xl': mode === 'modal'
    },
    className
  );

  return (
    <div className={containerClasses}>
      {/* Address Input */}
      <div className="mb-6">
        <EnhancedAddressInput
          onAddressSelect={handleAddressSelect}
          placeholder="Enter your business address to check coverage..."
          showLocationButton={true}
          showQuickLocations={mode === 'fullpage'}
          variant={mode === 'fullpage' ? 'hero' : 'default'}
          value={initialAddress}
        />
      </div>

      {/* Loading State */}
      {isChecking && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange mr-3"></div>
              <span className="text-lg">Checking coverage across all providers...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Results */}
      {coverageResult && !isChecking && (
        <div className="space-y-6">
          {/* Overall Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {coverageResult.overall.hasAnyConcentration ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <span>
                  {coverageResult.overall.hasAnyConcentration
                    ? 'Great! We found coverage'
                    : 'No direct coverage found'
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{coverageResult.address}</span>
              </div>

              {coverageResult.overall.hasAnyConcentration && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Available Technologies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {coverageResult.overall.availableTechnologies.map(tech => {
                        const config = TECHNOLOGY_CONFIG[tech];
                        const Icon = config.icon;
                        return (
                          <Badge
                            key={tech}
                            variant="outline"
                            className={`${config.color} flex items-center gap-1`}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Best Provider:</h4>
                    <p className="text-lg font-medium text-circleTel-orange">
                      {coverageResult.overall.bestProvider}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageResult.providers.map(provider => (
              <Card key={provider.provider} className={`${provider.hasConcentration ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{provider.provider}</span>
                    {provider.hasConcentration ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {provider.technologies.map(tech => {
                        const config = TECHNOLOGY_CONFIG[tech];
                        const Icon = config.icon;
                        return (
                          <Badge
                            key={tech}
                            variant="outline"
                            size="sm"
                            className={`${config.color} flex items-center gap-1`}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>

                    {provider.estimatedInstallTime && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{provider.estimatedInstallTime} days installation</span>
                      </div>
                    )}

                    <p className="text-sm">{provider.notes}</p>

                    <div className="text-xs text-muted-foreground">
                      Confidence: {provider.confidence}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Available Packages */}
          {availablePackages.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Available Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePackages.map(pkg => (
                  <Card key={pkg.id} className={`${pkg.isRecommended ? 'border-circleTel-orange bg-orange-50' : ''}`}>
                    <CardHeader>
                      {pkg.isRecommended && (
                        <Badge className="w-fit mb-2 bg-circleTel-orange text-white">
                          🥇 RECOMMENDED
                        </Badge>
                      )}
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold">R{pkg.price}</span>
                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                Usually R{pkg.originalPrice}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">/month</span>
                        </div>

                        {/* Installation Cost Display */}
                        <div className="text-sm">
                          {pkg.promotionalOffer?.freeInstallation ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">Installation: FREE</span>
                              {pkg.originalInstallation && (
                                <span className="text-muted-foreground line-through text-xs">
                                  Usually R{pkg.originalInstallation}
                                </span>
                              )}
                            </div>
                          ) : pkg.installation > 0 ? (
                            <span className="text-muted-foreground">
                              Installation: R{pkg.installation}
                            </span>
                          ) : (
                            <span className="text-green-600 font-medium">
                              Installation: Included
                            </span>
                          )}
                        </div>

                        {/* Router Cost Display */}
                        {pkg.promotionalOffer?.freeRouter && (
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">WiFi Router: FREE</span>
                              {pkg.originalRouter && (
                                <span className="text-muted-foreground line-through text-xs">
                                  Usually R{pkg.originalRouter}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Promotional Notice */}
                        {(pkg.promotionalOffer?.freeInstallation || pkg.promotionalOffer?.freeRouter) && (
                          <div className="text-xs text-center p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-green-700 font-medium">
                              🎉 Limited Time Offer - Save up to R{((pkg.originalInstallation || 0) + (pkg.originalRouter || 0))}!
                            </span>
                            <br />
                            <span className="text-green-600">
                              Valid until {pkg.promotionalOffer?.validUntil}. T&C apply.
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {pkg.features.map(feature => (
                            <Badge key={feature} variant="secondary" size="sm">
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          Select Package
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Coverage - Lead Form */}
          {!coverageResult.overall.hasAnyConcentration && showLeadForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Join Our Waiting List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Don't worry! We're constantly expanding our network. Leave your details and we'll notify you when coverage becomes available in your area.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="px-3 py-2 border border-input rounded-md"
                    value={leadData.name}
                    onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="px-3 py-2 border border-input rounded-md"
                    value={leadData.email}
                    onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="px-3 py-2 border border-input rounded-md"
                    value={leadData.phone}
                    onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Company (Optional)"
                    className="px-3 py-2 border border-input rounded-md"
                    value={leadData.company}
                    onChange={(e) => setLeadData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleLeadSubmit}
                  disabled={!leadData.email || isCreatingLead}
                  className="w-full"
                >
                  {isCreatingLead ? 'Joining...' : 'Join Waiting List'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Order Modal */}
      {selectedPackage && (
        <CircleTelOrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          selectedPackage={selectedPackage}
          customerInfo={selectedAddress ? {
            address: selectedAddress.address,
            coordinates: { lat: selectedAddress.latitude, lng: selectedAddress.longitude }
          } : undefined}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </div>
  );
};