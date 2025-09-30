'use client';

import { PricingCard } from './PricingCard';

interface CoverageOption {
  type: string;
  subtype: string;
  signal: string;
  speeds: {
    download: number;
    upload: number;
  };
}

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

interface PricingGridProps {
  coverageOptions: CoverageOption[];
  packages?: ServicePackage[];
  onPackageSelect: (packageId: string) => void;
}

const mapCoverageToPackages = (options: CoverageOption[]): ServicePackage[] => {
  // Convert coverage options to package format for display
  return options.map((option, index) => {
    const basePrice = getBasePriceForOption(option);
    const promoPrice = Math.round(basePrice * 0.7); // 30% discount for promo

    return {
      id: `coverage_${index}`,
      name: `${option.type} ${option.speeds.download}Mbps`,
      service_type: option.type,
      speed_down: option.speeds.download,
      speed_up: option.speeds.upload,
      price: basePrice,
      promotion_price: promoPrice,
      promotion_months: 3,
      description: `${option.subtype} - ${option.signal} signal quality`,
      features: getDefaultFeatures(option.type)
    };
  });
};

const getBasePriceForOption = (option: CoverageOption): number => {
  // Calculate price based on speed and type
  const speedTier = option.speeds.download;
  const type = option.type.toLowerCase();

  if (type.includes('fibre') || type.includes('ftth')) {
    if (speedTier >= 1000) return 799; // 1Gbps fibre
    if (speedTier >= 500) return 699;  // 500Mbps fibre
    if (speedTier >= 200) return 599;  // 200Mbps fibre
    if (speedTier >= 100) return 499;  // 100Mbps fibre
    if (speedTier >= 50) return 399;   // 50Mbps fibre
    return 299; // Basic fibre
  }

  if (type.includes('5g')) {
    if (speedTier >= 500) return 899;  // 5G high speed
    if (speedTier >= 200) return 699;  // 5G standard
    return 599; // 5G basic
  }

  if (type.includes('lte') || type.includes('wireless')) {
    if (speedTier >= 80) return 549;   // High speed LTE
    if (speedTier >= 40) return 449;   // Standard LTE
    return 349; // Basic LTE
  }

  return 299; // Default price
};

const getDefaultFeatures = (serviceType: string): string[] => {
  const baseFeatures = [
    'Month-to-month contract',
    'Free installation',
    'Uncapped data',
    '24/7 support'
  ];

  const type = serviceType.toLowerCase();

  if (type.includes('fibre')) {
    return [
      ...baseFeatures,
      'Ultra-low latency',
      'Symmetric speeds',
      '99.9% uptime SLA'
    ];
  }

  if (type.includes('5g')) {
    return [
      ...baseFeatures,
      'Next-gen mobile tech',
      'Low latency gaming',
      'Future-ready speeds'
    ];
  }

  return [
    ...baseFeatures,
    'Quick setup',
    'Reliable connection',
    'Load-shedding ready'
  ];
};

const getProviderForType = (serviceType: string): string => {
  const type = serviceType.toLowerCase();

  if (type.includes('fibre') || type.includes('ftth')) {
    return ['Vuma', 'MetroFibre', 'Openserve', 'Frogfoot'][Math.floor(Math.random() * 4)];
  }

  if (type.includes('5g') || type.includes('lte')) {
    return 'MTN';
  }

  return 'CircleTel';
};

export function PricingGrid({ coverageOptions, packages, onPackageSelect }: PricingGridProps) {
  // Use provided packages or convert coverage options to packages
  const displayPackages = packages && packages.length > 0
    ? packages
    : mapCoverageToPackages(coverageOptions);

  if (!displayPackages || displayPackages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No packages available for your location.</p>
      </div>
    );
  }

  // Sort packages by price and mark the middle one as popular
  const sortedPackages = [...displayPackages].sort((a, b) =>
    (a.promotion_price || a.price) - (b.promotion_price || b.price)
  );

  const popularIndex = Math.floor(sortedPackages.length / 2);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose your perfect plan
        </h2>
        <p className="text-gray-600">
          {sortedPackages.length} connectivity options available at your location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {sortedPackages.map((pkg, index) => {
          const provider = packages && packages.length > 0
            ? 'CircleTel'
            : getProviderForType(pkg.service_type);

          const signalQuality = determineSignalQuality(pkg.service_type);
          const isPopular = index === popularIndex;
          const speedDisplay = formatSpeed(pkg.speed_down);

          return (
            <PricingCard
              key={pkg.id}
              price={pkg.promotion_price?.toString() || pkg.price.toString()}
              originalPrice={pkg.promotion_price ? pkg.price.toString() : undefined}
              speed={speedDisplay}
              provider={provider}
              serviceType={pkg.service_type}
              signalQuality={signalQuality}
              features={pkg.features}
              isPopular={isPopular}
              onSelect={() => onPackageSelect(pkg.id)}
            />
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>* Promotional pricing valid for {sortedPackages[0]?.promotion_months || 3} months</p>
        <p>All plans include free installation and 24/7 South African support</p>
      </div>
    </div>
  );
}

function determineSignalQuality(serviceType: string): 'excellent' | 'good' | 'fair' {
  const type = serviceType.toLowerCase();

  if (type.includes('fibre') || type.includes('ftth')) {
    return 'excellent';
  }

  if (type.includes('5g')) {
    return 'excellent';
  }

  if (type.includes('lte')) {
    return 'good';
  }

  return 'good';
}

function formatSpeed(speedMbps: number): string {
  if (speedMbps >= 1000) {
    return `${speedMbps / 1000}Gbps`;
  }
  return `${speedMbps}Mbps`;
}