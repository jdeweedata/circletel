'use client';

import { PricingGrid } from '@/components/coverage/PricingGrid';

// Sample coverage data to demonstrate pricing cards
const sampleCoverageOptions = [
  {
    type: 'Fibre',
    subtype: 'FTTH',
    signal: 'excellent',
    speeds: { download: 1000, upload: 1000 }
  },
  {
    type: 'Fibre',
    subtype: 'Fibre',
    signal: 'excellent',
    speeds: { download: 100, upload: 100 }
  },
  {
    type: '5g',
    subtype: '5G NR',
    signal: 'excellent',
    speeds: { download: 500, upload: 100 }
  },
  {
    type: 'Fixed Lte',
    subtype: 'Fixed LTE',
    signal: 'good',
    speeds: { download: 80, upload: 40 }
  },
  {
    type: 'Uncapped Wireless',
    subtype: 'Wireless',
    signal: 'good',
    speeds: { download: 40, upload: 16 }
  },
  {
    type: 'Lte',
    subtype: 'LTE-A',
    signal: 'good',
    speeds: { download: 40, upload: 16 }
  }
];

export default function PricingDemoPage() {
  const handlePackageSelect = (packageId: string) => {
    alert(`Selected package: ${packageId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="CircleTel" className="h-8 w-auto" />
              <span className="text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Home</a>
              <a href="/coverage" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Coverage</a>
              <a href="/bundles" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Bundles</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
            Pricing Cards Demo
          </h1>
          <p className="text-xl text-circleTel-secondaryNeutral">
            Showcasing Supersonic-style pricing cards with real coverage data
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sample data for address: 18 Rasmus Erasmus, Centurion
          </p>
        </div>

        <PricingGrid
          coverageOptions={sampleCoverageOptions}
          onPackageSelect={handlePackageSelect}
        />

        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
              ✅ Implementation Complete
            </h2>
            <div className="text-left space-y-2 text-sm text-gray-600">
              <p>• ✅ Created PricingCard component with Supersonic-style design</p>
              <p>• ✅ Integrated with shadcn/ui Card, Badge, and Button components</p>
              <p>• ✅ Built PricingGrid for displaying multiple options</p>
              <p>• ✅ Added pricing calculation based on service type and speed</p>
              <p>• ✅ Integrated with coverage check results</p>
              <p>• ✅ Added promotional pricing and provider logos</p>
              <p>• ✅ Responsive design for mobile and desktop</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}