'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Package
} from 'lucide-react';
import CoverageMap from '@/components/coverage/CoverageMap';
import LayerControls, { LayerConfig } from '@/components/coverage/LayerControls';
import { Coordinates, ServiceType, CoverageResponse } from '@/lib/coverage/types';
import { MTNServiceCoverage } from '@/lib/coverage/mtn/types';

interface Package {
  id: string;
  name: string;
  serviceType: ServiceType;
  speed: string;
  price: number;
  features: string[];
  availability: 'available' | 'limited' | 'unavailable';
  signalRequirement: 'poor' | 'fair' | 'good' | 'excellent';
}

interface CoverageStageProps {
  onComplete: (data: {
    address: string;
    coordinates: Coordinates;
    selectedPackages: Package[];
    coverageData: CoverageResponse;
  }) => void;
  onBack?: () => void;
  initialData?: {
    address?: string;
    coordinates?: Coordinates;
    selectedPackages?: Package[];
  };
}

const AVAILABLE_PACKAGES: Package[] = [
  {
    id: 'fibre-100',
    name: 'Fibre 100Mbps',
    serviceType: 'fibre',
    speed: '100/100 Mbps',
    price: 899,
    features: ['Unlimited data', 'Symmetric speeds', 'Static IP available'],
    availability: 'unavailable',
    signalRequirement: 'good'
  },
  {
    id: 'fixed-lte-50',
    name: 'Fixed LTE 50Mbps',
    serviceType: 'fixed_lte',
    speed: '50/20 Mbps',
    price: 699,
    features: ['Unlimited data', 'Backup connectivity', 'Quick installation'],
    availability: 'unavailable',
    signalRequirement: 'fair'
  },
  {
    id: 'uncapped-wireless-25',
    name: 'Uncapped Wireless 25Mbps',
    serviceType: 'uncapped_wireless',
    speed: '25/10 Mbps',
    price: 499,
    features: ['Uncapped data', 'Flexible installation', 'Business grade'],
    availability: 'unavailable',
    signalRequirement: 'fair'
  },
  {
    id: '5g-mobile-100',
    name: '5G Mobile 100GB',
    serviceType: '5g',
    speed: 'Up to 1Gbps',
    price: 599,
    features: ['100GB data', 'Mobile connectivity', 'High speed'],
    availability: 'unavailable',
    signalRequirement: 'good'
  },
  {
    id: 'lte-mobile-50',
    name: 'LTE Mobile 50GB',
    serviceType: 'lte',
    speed: 'Up to 150Mbps',
    price: 399,
    features: ['50GB data', 'Wide coverage', 'Reliable'],
    availability: 'unavailable',
    signalRequirement: 'poor'
  }
];

export default function CoverageStage({
  onComplete,
  onBack,
  initialData
}: CoverageStageProps) {
  const [address, setAddress] = useState(initialData?.address || '');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialData?.coordinates || null);
  const [coverageData, setCoverageData] = useState<CoverageResponse | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<Package[]>(initialData?.selectedPackages || []);
  const [availablePackages, setAvailablePackages] = useState<Package[]>(AVAILABLE_PACKAGES);
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const [layers, setLayers] = useState<LayerConfig[]>([
    { serviceType: 'fibre', enabled: true, opacity: 0.7, layer: 'FTTBCoverage', source: 'business', priority: 1 },
    { serviceType: 'fixed_lte', enabled: true, opacity: 0.7, layer: 'FLTECoverageEBU', source: 'business', priority: 2 },
    { serviceType: 'uncapped_wireless', enabled: false, opacity: 0.7, layer: 'UncappedWirelessEBU', source: 'consumer', priority: 3 },
    { serviceType: '5g', enabled: false, opacity: 0.7, layer: '_5gCoverage', source: 'consumer', priority: 4 },
    { serviceType: 'lte', enabled: false, opacity: 0.7, layer: 'lteCoverage', source: 'consumer', priority: 5 }
  ]);

  // Update package availability based on coverage data
  useEffect(() => {
    if (!coverageData) {
      setAvailablePackages(AVAILABLE_PACKAGES.map(pkg => ({ ...pkg, availability: 'unavailable' })));
      return;
    }

    const updatedPackages = AVAILABLE_PACKAGES.map(pkg => {
      const service = coverageData.services.find(s => s.type === pkg.serviceType);

      if (!service || !service.available) {
        return { ...pkg, availability: 'unavailable' as const };
      }

      // Check signal strength requirement
      const signalLevels = { none: 0, poor: 1, fair: 2, good: 3, excellent: 4 };
      const serviceSignalLevel = signalLevels[service.signal];
      const requiredSignalLevel = signalLevels[pkg.signalRequirement];

      if (serviceSignalLevel >= requiredSignalLevel) {
        return { ...pkg, availability: 'available' as const };
      } else {
        return { ...pkg, availability: 'limited' as const };
      }
    });

    setAvailablePackages(updatedPackages);
  }, [coverageData]);

  const handleLocationSelect = (newCoordinates: Coordinates, newAddress?: string) => {
    setCoordinates(newCoordinates);
    if (newAddress) {
      setAddress(newAddress);
    }
  };

  const handleCoverageCheck = (coverage: CoverageResponse) => {
    setCoverageData(coverage);
    setCoverageError(null);
  };

  const handleLayerToggle = (serviceType: ServiceType) => {
    setLayers(prev => prev.map(layer =>
      layer.serviceType === serviceType
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
  };

  const handleOpacityChange = (serviceType: ServiceType, opacity: number) => {
    setLayers(prev => prev.map(layer =>
      layer.serviceType === serviceType
        ? { ...layer, opacity }
        : layer
    ));
  };

  const handlePackageToggle = (pkg: Package) => {
    if (pkg.availability === 'unavailable') return;

    setSelectedPackages(prev => {
      const isSelected = prev.find(p => p.id === pkg.id);
      if (isSelected) {
        return prev.filter(p => p.id !== pkg.id);
      } else {
        return [...prev, pkg];
      }
    });
  };

  const recheckCoverage = async () => {
    if (!coordinates) return;

    setIsCheckingCoverage(true);
    setCoverageError(null);

    try {
      const response = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates,
          includeSignalStrength: true
        })
      });

      if (!response.ok) {
        throw new Error(`Coverage check failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCoverageData(result.data);
      } else {
        setCoverageError(result.error || 'Failed to check coverage');
      }
    } catch (error) {
      console.error('Coverage check error:', error);
      setCoverageError(error instanceof Error ? error.message : 'Failed to check coverage');
    } finally {
      setIsCheckingCoverage(false);
    }
  };

  const canProceed = () => {
    return address && coordinates && coverageData && selectedPackages.length > 0;
  };

  const handleContinue = () => {
    if (!canProceed() || !coordinates || !coverageData) return;

    onComplete({
      address,
      coordinates,
      selectedPackages,
      coverageData
    });
  };

  const getTotalPrice = () => {
    return selectedPackages.reduce((total, pkg) => total + pkg.price, 0);
  };

  const renderPackageCard = (pkg: Package) => {
    const isSelected = selectedPackages.some(p => p.id === pkg.id);
    const service = coverageData?.services.find(s => s.type === pkg.serviceType);

    return (
      <Card
        key={pkg.id}
        className={`cursor-pointer transition-all ${
          pkg.availability === 'unavailable'
            ? 'opacity-50 cursor-not-allowed'
            : isSelected
            ? 'ring-2 ring-blue-500 border-blue-500'
            : 'hover:border-gray-300'
        }`}
        onClick={() => handlePackageToggle(pkg)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{pkg.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  pkg.availability === 'available' ? 'default' :
                  pkg.availability === 'limited' ? 'secondary' : 'outline'
                }
              >
                {pkg.availability}
              </Badge>
              {isSelected && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">R{pkg.price}</span>
              <span className="text-sm text-gray-600">{pkg.speed}</span>
            </div>

            {service && (
              <div className="flex items-center gap-2 text-sm">
                <Badge
                  variant={
                    service.signal === 'excellent' ? 'default' :
                    service.signal === 'good' ? 'secondary' :
                    service.signal === 'fair' ? 'outline' : 'destructive'
                  }
                >
                  {service.signal} signal
                </Badge>
                {service.estimatedSpeed && (
                  <span className="text-gray-600">
                    Est. {service.estimatedSpeed.download}{service.estimatedSpeed.unit}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1">
              {pkg.features.map((feature, index) => (
                <div key={index} className="text-sm text-gray-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>

            {pkg.availability === 'limited' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Limited availability due to signal strength. Performance may vary.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Check Coverage & Select Package</h2>
        <p className="text-gray-600">
          Find your location to see available services and select your preferred package.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map and Location */}
        <div className="lg:col-span-2 space-y-4">
          {showMap && (
            <CoverageMap
              onLocationSelect={handleLocationSelect}
              onCoverageCheck={handleCoverageCheck}
              initialCenter={coordinates || undefined}
              height="400px"
            />
          )}

          {!showMap && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Location Information</span>
                  <Button variant="outline" onClick={() => setShowMap(true)}>
                    <MapPin className="h-4 w-4 mr-1" />
                    Show Map
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter your address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {coordinates && (
                    <div className="text-sm text-gray-600">
                      Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Layer Controls */}
        <div>
          <LayerControls
            layers={layers}
            onLayerToggle={handleLayerToggle}
            onOpacityChange={handleOpacityChange}
          />
        </div>
      </div>

      {/* Coverage Status */}
      {coordinates && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {coverageData?.available ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                Coverage Status
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={recheckCoverage}
                disabled={isCheckingCoverage}
              >
                {isCheckingCoverage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Recheck
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coverageError && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{coverageError}</AlertDescription>
              </Alert>
            )}

            {coverageData && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={coverageData.available ? 'default' : 'destructive'}
                  >
                    {coverageData.available ? 'Coverage Available' : 'No Coverage'}
                  </Badge>
                  <Badge variant="outline">
                    {coverageData.confidence} confidence
                  </Badge>
                </div>

                {coverageData.available && (
                  <div className="text-sm text-gray-600">
                    Available services: {coverageData.services.filter(s => s.available).length} of {coverageData.services.length}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Package Selection */}
      {coverageData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Available Packages
            </h3>
            {selectedPackages.length > 0 && (
              <Badge variant="outline" className="text-lg px-3 py-1">
                Total: R{getTotalPrice()}/month
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePackages.map(renderPackageCard)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canProceed()}
          className="min-w-[120px]"
        >
          Continue
          {selectedPackages.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {selectedPackages.length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}