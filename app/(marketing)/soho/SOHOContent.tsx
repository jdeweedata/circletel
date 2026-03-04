'use client';
import { PiArrowRightBold, PiCalendarBold, PiCellSignalFullBold, PiCheckCircleBold, PiClockBold, PiMapPinBold, PiShieldBold, PiStarBold, PiUploadSimpleBold, PiVideoCameraBold, PiWifiHighBold, PiWrenchBold } from 'react-icons/pi';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { cn } from '@/lib/utils';

// Plan interface matching what page.tsx transforms
interface Plan {
  id: string;
  name: string;
  price: number;
  speed: string;
  type: 'fibre' | '5g';
  description: string;
  features: string[];
  badge?: string;
  featured?: boolean;
  slug?: string;
}

// Features for remote work
const FEATURES = [
  {
    icon: PiVideoCameraBold,
    title: 'HD Video Calls',
    description: 'Crystal-clear Zoom, Teams & Meet calls with symmetric upload speeds.',
  },
  {
    icon: PiUploadSimpleBold,
    title: 'Fast Uploads',
    description: 'Upload large files, backup to cloud, and push code without waiting.',
  },
  {
    icon: PiWrenchBold,
    title: 'Free Installation',
    description: 'Professional installation included. Router configured and optimized.',
  },
  {
    icon: PiCalendarBold,
    title: 'No Lock-in',
    description: 'Month-to-month billing. Cancel anytime with no penalties.',
  },
];

// Why choose CircleTel
const WHY_CIRCLETEL = [
  { icon: PiShieldBold, label: 'Dedicated support' },
  { icon: PiClockBold, label: 'Same-day install' },
  { icon: PiWifiHighBold, label: 'Fibre & 5G options' },
  { icon: PiCellSignalFullBold, label: '99.9% uptime' },
];

interface SOHOContentProps {
  plans: Plan[];
}

export default function SOHOContent({ plans }: SOHOContentProps) {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleLocationSelect = (data: {
    address: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setAddress(data.address);
    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }
  };

  const handleCheckCoverage = async () => {
    if (!address.trim()) return;

    setIsChecking(true);
    try {
      // Store address in sessionStorage
      sessionStorage.setItem(
        'circletel_coverage_address',
        JSON.stringify({
          address: address.trim(),
          coordinates,
          type: 'residential', // SOHO uses residential coverage
          timestamp: new Date().toISOString(),
        })
      );

      // Create coverage lead
      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coordinates,
          coverageType: 'residential',
          source: 'soho-landing',
        }),
      });

      if (!response.ok) throw new Error('Failed to create coverage lead');

      const data = await response.json();
      window.location.href = `/packages/${data.leadId}?type=residential&segment=soho`;
    } catch (error) {
      console.error('Coverage check failed:', error);
      alert('Coverage check failed. Please try again.');
      setIsChecking(false);
    }
  };

  // Calculate the lowest price for display
  const lowestPrice = Math.min(...plans.map((p) => p.price));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-circleTel-grey200 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange/10 rounded-full mb-6">
              <PiVideoCameraBold className="w-4 h-4 text-circleTel-orange" />
              <span className="text-sm font-medium text-circleTel-orange">Built for Remote Work</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-6">
              Work from Home,
              <br />
              <span className="text-circleTel-orange">Without the Hassle</span>
            </h1>

            {/* Subheadline */}
            <p className="font-body text-lg md:text-xl text-circleTel-grey600 mb-8 max-w-2xl mx-auto">
              Reliable connectivity for freelancers, remote workers, and small home offices. From{' '}
              <span className="font-semibold text-circleTel-navy">R{lowestPrice.toLocaleString()}/month</span>.
            </p>

            {/* Address Search */}
            <div className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <PiMapPinBold className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-circleTel-orange z-10" />
                  <AddressAutocomplete
                    value={address}
                    onLocationSelect={handleLocationSelect}
                    placeholder="Enter your home office address"
                    className="w-full [&_input]:pl-12 [&_input]:pr-4 [&_input]:py-4 [&_input]:h-14 [&_input]:text-base [&_input]:rounded-xl [&_input]:border-2 [&_input]:border-gray-200 [&_input]:focus:border-circleTel-orange"
                    showLocationButton={false}
                    showMapButton={false}
                  />
                </div>
                <Button
                  onClick={handleCheckCoverage}
                  disabled={!address.trim() || isChecking}
                  className="h-14 px-8 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold rounded-xl"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Coverage
                      <PiArrowRightBold className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-circleTel-grey600">
              {WHY_CIRCLETEL.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-circleTel-orange" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-4">
            Built for Remote Work
          </h2>
          <p className="font-body text-circleTel-grey600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to work productively from home, without worrying about your connection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">{feature.title}</h3>
                  <p className="font-body text-sm text-circleTel-grey600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="bg-circleTel-grey200 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-4">
            WorkConnect Plans
          </h2>
          <p className="font-body text-circleTel-grey600 text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your work style. All plans include free installation and no contracts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-300',
                  plan.featured ? 'ring-2 ring-circleTel-orange shadow-xl scale-[1.02] z-10' : 'shadow-lg hover:shadow-xl'
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-circleTel-orange text-white">
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="font-heading text-xl font-semibold text-circleTel-navy mb-1">WorkConnect {plan.name}</h3>
                <p className="font-body text-sm text-circleTel-grey600 mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-heading text-4xl font-bold text-circleTel-navy">
                    R{plan.price.toLocaleString()}
                  </span>
                  <span className="text-circleTel-grey600">/mo</span>
                </div>

                {/* Speed */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <PiWifiHighBold className="w-4 h-4 text-circleTel-orange" />
                  <span className="font-body text-sm font-medium text-circleTel-navy">
                    {plan.speed} {plan.type === '5g' ? '5G' : 'Fibre'}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <PiCheckCircleBold className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-circleTel-navy">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA - Link to product page if slug available */}
                <Button
                  className={cn(
                    'w-full',
                    plan.featured
                      ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
                      : 'bg-circleTel-navy hover:bg-circleTel-navy/90 text-white'
                  )}
                  asChild
                >
                  <Link href={plan.slug ? `/workconnect/${plan.slug}` : '/?segment=wfh'}>
                    Learn More
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Add-on mention */}
          <p className="text-center text-sm text-circleTel-grey600 mt-8">
            Need backup connectivity? Add <span className="font-semibold">5G Failover</span> for R399/mo
          </p>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <PiStarBold key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="font-body text-xl md:text-2xl text-circleTel-navy italic mb-6 leading-relaxed">
              &ldquo;Finally, an ISP that understands remote work. Video calls never drop, and the 5G backup kicks in
              automatically if anything goes wrong. My productivity has never been better.&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-circleTel-orange/10 rounded-full flex items-center justify-center">
                <span className="font-heading text-lg font-semibold text-circleTel-orange">T</span>
              </div>
              <div>
                <p className="font-heading font-semibold text-circleTel-navy">Thabo M.</p>
                <p className="font-body text-sm text-circleTel-orange">Freelance Developer</p>
                <p className="font-body text-sm text-circleTel-grey600">Johannesburg</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-circleTel-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to upgrade your home office?
          </h2>
          <p className="font-body text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Check coverage at your address and get connected in as little as 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
              asChild
            >
              <Link href="/?segment=wfh">
                Check Coverage
                <PiArrowRightBold className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-circleTel-navy px-8"
              asChild
            >
              <Link href="/contact">Talk to an Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
