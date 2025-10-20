'use client';

import React, { useState } from 'react';
import { ServiceToggle, SubToggle, ServiceType } from '@/components/ui/service-toggle';
import { EnhancedPackageCard, CompactEnhancedPackageCard } from '@/components/ui/enhanced-package-card';
import { PackageDetailSidebar, MobilePackageDetailOverlay } from '@/components/ui/package-detail-sidebar';
import { CheckoutProgress, CompactCheckoutProgress, VerticalCheckoutProgress, CheckoutStep } from '@/components/ui/checkout-progress';

/**
 * UI Components Demo Page
 *
 * Showcases all new CircleTel UI components based on WebAfrica analysis.
 * This page demonstrates the immediate next steps implementation.
 */
export default function UIComponentsDemoPage() {
  // Service toggle state
  const [activeService, setActiveService] = useState<ServiceType>('fibre');

  // Router sub-toggle state
  const [activeRouterOption, setActiveRouterOption] = useState<'with-router' | 'free-router' | 'sim-only'>('with-router');

  // Package selection state
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>('package-1');

  // Checkout progress state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('package');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sample package data
  const samplePackages = [
    {
      id: 'package-1',
      name: 'MetroFibre NEXUS',
      promoPrice: 459,
      originalPrice: 589,
      promoBadge: '2-MONTH PROMO',
      promoDescription: 'first 2 months',
      downloadSpeed: 25,
      uploadSpeed: 25,
      type: 'uncapped' as const,
      recommended: true,
      providerName: 'MetroFibre NEXUS',
      benefits: [
        'Free setup worth R1699',
        'Fully insured, free-to-use router',
        '24/7 customer support',
      ],
      additionalInfo: {
        items: [
          'Month-to-month contract',
          'Free installation',
          'No throttling or shaping',
          '30-day money-back guarantee',
        ],
      },
    },
    {
      id: 'package-2',
      name: 'Openserve Fibre',
      promoPrice: 399,
      originalPrice: 529,
      promoBadge: '2-MONTH PROMO',
      promoDescription: 'first 2 months',
      downloadSpeed: 30,
      uploadSpeed: 30,
      type: 'uncapped' as const,
      providerName: 'Openserve',
      benefits: [
        'Free setup worth R2199',
        'Free router included',
      ],
      additionalInfo: {
        items: [
          'Flexible contract terms',
          'Professional installation',
          'Unlimited data',
        ],
      },
    },
    {
      id: 'package-3',
      name: 'Budget 50GB',
      promoPrice: 299,
      originalPrice: 399,
      savingsAmount: 100,
      dataLimit: '50GB',
      type: 'capped' as const,
      providerName: 'SkyFibre',
      benefits: [
        'Free router included',
        'No setup fees',
      ],
      additionalInfo: {
        items: [
          'Perfect for light users',
          'Rollover unused data',
        ],
      },
    },
  ];

  const selectedPackage = samplePackages.find(pkg => pkg.id === selectedPackageId);

  const routerOptions = [
    { value: 'with-router' as const, label: 'SIM + New Router' },
    { value: 'free-router' as const, label: 'SIM + Free Router' },
    { value: 'sim-only' as const, label: 'SIM Only' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            UI Components Demo
          </h1>
          <p className="text-circleTel-secondaryNeutral mt-2">
            CircleTel components based on WebAfrica analysis
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Section 1: Service Toggle */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
            1. Service Toggle Component
          </h2>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Main navigation toggle for switching between service types (Fibre, LTE, Wireless).
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Standard Toggle:</h3>
              <ServiceToggle
                activeService={activeService}
                onServiceChange={setActiveService}
              />
            </div>

            {activeService === 'lte' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Sub-Toggle (Router Options):</h3>
                <SubToggle
                  options={routerOptions}
                  activeOption={activeRouterOption}
                  onOptionChange={setActiveRouterOption}
                />
              </div>
            )}

            <div className="bg-gray-100 rounded p-4">
              <p className="text-sm font-mono text-gray-700">
                Active Service: <span className="font-bold">{activeService}</span>
                {activeService === 'lte' && (
                  <> | Router Option: <span className="font-bold">{activeRouterOption}</span></>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Enhanced Package Cards */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
            2. Enhanced Package Card Component
          </h2>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Package cards with promotional badges, speed indicators, and benefits.
          </p>

          <div className="space-y-8">
            {/* Standard Cards Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Standard Cards:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {samplePackages.map((pkg) => (
                  <EnhancedPackageCard
                    key={pkg.id}
                    promoPrice={pkg.promoPrice}
                    originalPrice={pkg.originalPrice}
                    promoBadge={pkg.promoBadge}
                    savingsAmount={pkg.savingsAmount}
                    promoDescription={pkg.promoDescription}
                    name={pkg.name}
                    type={pkg.type}
                    dataLimit={pkg.dataLimit}
                    downloadSpeed={pkg.downloadSpeed}
                    uploadSpeed={pkg.uploadSpeed}
                    recommended={pkg.recommended}
                    providerName={pkg.providerName}
                    benefits={pkg.benefits}
                    selected={selectedPackageId === pkg.id}
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      setIsMobileSidebarOpen(true);
                    }}
                    onOrderClick={() => {
                      alert(`Ordering ${pkg.name}`);
                      setCheckoutStep('account');
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Compact Cards Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Compact Cards (for dense layouts):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {samplePackages.map((pkg) => (
                  <CompactEnhancedPackageCard
                    key={`compact-${pkg.id}`}
                    promoPrice={pkg.promoPrice}
                    originalPrice={pkg.originalPrice}
                    promoBadge={pkg.promoBadge}
                    downloadSpeed={pkg.downloadSpeed}
                    uploadSpeed={pkg.uploadSpeed}
                    type={pkg.type}
                    dataLimit={pkg.dataLimit}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Package Detail Sidebar */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
            3. Package Detail Sidebar Component
          </h2>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Sticky sidebar with detailed package information (shown on right in desktop view).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Package selection */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Click a package to view details:</h3>
              {samplePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackageId(pkg.id);
                    setIsMobileSidebarOpen(true);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-circleTel-orange bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-circleTel-darkNeutral">{pkg.name}</div>
                  <div className="text-sm text-circleTel-secondaryNeutral">
                    R{pkg.promoPrice}pm • {pkg.type}
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Sidebar (hidden on mobile, click opens overlay) */}
            <div className="hidden lg:block">
              {selectedPackage && (
                <PackageDetailSidebar
                  packageId={selectedPackage.id}
                  name={selectedPackage.name}
                  promoPrice={selectedPackage.promoPrice}
                  originalPrice={selectedPackage.originalPrice}
                  promoDescription={selectedPackage.promoDescription}
                  type={selectedPackage.type}
                  dataLimit={selectedPackage.dataLimit}
                  downloadSpeed={selectedPackage.downloadSpeed}
                  uploadSpeed={selectedPackage.uploadSpeed}
                  providerName={selectedPackage.providerName}
                  benefits={selectedPackage.benefits}
                  additionalInfo={selectedPackage.additionalInfo}
                  onOrderClick={() => {
                    alert(`Ordering ${selectedPackage.name}`);
                    setCheckoutStep('account');
                  }}
                />
              )}
            </div>
          </div>

          {/* Mobile overlay */}
          {selectedPackage && (
            <MobilePackageDetailOverlay
              isOpen={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
              packageId={selectedPackage.id}
              name={selectedPackage.name}
              promoPrice={selectedPackage.promoPrice}
              originalPrice={selectedPackage.originalPrice}
              promoDescription={selectedPackage.promoDescription}
              type={selectedPackage.type}
              dataLimit={selectedPackage.dataLimit}
              downloadSpeed={selectedPackage.downloadSpeed}
              uploadSpeed={selectedPackage.uploadSpeed}
              providerName={selectedPackage.providerName}
              benefits={selectedPackage.benefits}
              additionalInfo={selectedPackage.additionalInfo}
              onOrderClick={() => {
                alert(`Ordering ${selectedPackage.name}`);
                setIsMobileSidebarOpen(false);
                setCheckoutStep('account');
              }}
            />
          )}
        </section>

        {/* Section 4: Checkout Progress */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
            4. Checkout Progress Component
          </h2>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Step indicators for multi-step checkout process.
          </p>

          <div className="space-y-8">
            {/* Standard Horizontal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Standard Horizontal:</h3>
              <CheckoutProgress
                currentStep={checkoutStep}
                allowNavigation={true}
                onStepClick={setCheckoutStep}
              />
            </div>

            {/* Compact Version */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Compact Version:</h3>
              <CompactCheckoutProgress currentStep={checkoutStep} />
            </div>

            {/* Vertical Version */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Vertical Version (for sidebars):</h3>
              <div className="max-w-sm">
                <VerticalCheckoutProgress
                  currentStep={checkoutStep}
                  allowNavigation={true}
                  onStepClick={setCheckoutStep}
                  steps={[
                    {
                      id: 'package',
                      label: 'Choose Package',
                      description: 'Select your ideal fibre package',
                    },
                    {
                      id: 'account',
                      label: 'Create Account',
                      description: 'Enter your personal details',
                    },
                    {
                      id: 'payment',
                      label: 'Secure Checkout',
                      description: 'Complete your payment',
                    },
                  ]}
                />
              </div>
            </div>

            {/* Step Controls */}
            <div className="bg-gray-100 rounded p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Test Navigation:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCheckoutStep('package')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  Package
                </button>
                <button
                  onClick={() => setCheckoutStep('account')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  Account
                </button>
                <button
                  onClick={() => setCheckoutStep('payment')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  Payment
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Notes */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            📋 Implementation Notes
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>✅ All components implemented:</strong> ServiceToggle, EnhancedPackageCard,
              PackageDetailSidebar, CheckoutProgress
            </p>
            <p>
              <strong>🎨 Design System:</strong> Using CircleTel brand colors (circleTel-orange,
              circleTel-darkNeutral) with Tailwind CSS
            </p>
            <p>
              <strong>♿ Accessibility:</strong> ARIA labels, keyboard navigation, semantic HTML
            </p>
            <p>
              <strong>📱 Responsive:</strong> Mobile-first design with breakpoint adaptations
            </p>
            <p>
              <strong>⚡ Performance:</strong> Client-side only components, no server dependencies
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
