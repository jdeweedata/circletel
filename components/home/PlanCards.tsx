'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Wifi, Signal, BatteryCharging, Building2, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SegmentType } from './SegmentTabs';

interface HeroPlan {
  id: string;
  name: string;
  price: number;
  speed: string;
  type: 'fibre' | '5g' | 'lte' | 'fwa';
  description: string;
  badge?: string;
  badgeColor?: 'orange' | 'green' | 'blue';
  featured?: boolean;
  features?: string[];
}

// Consumer/Home Plans
const HOME_PLANS: HeroPlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 299,
    speed: '25Mbps',
    type: 'fibre',
    description: 'Browsing & streaming for 1-2 people',
  },
  {
    id: 'family',
    name: 'Family',
    price: 399,
    speed: '50Mbps',
    type: 'fibre',
    description: 'Netflix on 3 screens + gaming',
    badge: 'Most Popular',
    badgeColor: 'orange',
    featured: true,
  },
  {
    id: 'power',
    name: 'Power Home',
    price: 599,
    speed: '100Mbps',
    type: '5g',
    description: 'Whole-house coverage, work from home ready',
    badge: 'Uncapped',
    badgeColor: 'orange',
  },
  {
    id: 'backup',
    name: 'LTE Backup',
    price: 199,
    speed: 'LTE',
    type: 'lte',
    description: 'Reliable mobile backup when you need it',
    badge: 'Portable',
    badgeColor: 'green',
  },
];

// SOHO/Work from Home Plans
const WFH_PLANS: HeroPlan[] = [
  {
    id: 'wc-starter',
    name: 'WorkConnect Starter',
    price: 799,
    speed: '50Mbps',
    type: 'fibre',
    description: 'HD video calls, cloud backup, VoIP ready',
    features: ['25GB cloud backup', '2 email accounts', 'VoIP QoS'],
  },
  {
    id: 'wc-plus',
    name: 'WorkConnect Plus',
    price: 999,
    speed: '100Mbps',
    type: 'fibre',
    description: 'Multi-device, team calls, fast uploads',
    badge: 'Popular',
    badgeColor: 'orange',
    featured: true,
    features: ['50GB cloud backup', '5 email accounts', 'Priority support'],
  },
  {
    id: 'wc-pro',
    name: 'WorkConnect Pro',
    price: 1499,
    speed: '200Mbps',
    type: '5g',
    description: 'Enterprise-grade for power users',
    badge: 'Uncapped',
    badgeColor: 'orange',
    features: ['100GB cloud backup', '10 email accounts', 'Static IP'],
  },
  {
    id: 'wfh-backup',
    name: '5G Failover',
    price: 399,
    speed: '5G',
    type: '5g',
    description: 'Auto-switch when primary fails',
    badge: 'Add-on',
    badgeColor: 'green',
  },
];

// Business/SME Plans
const BUSINESS_PLANS: HeroPlan[] = [
  {
    id: 'skyfibre-50',
    name: 'SkyFibre 50',
    price: 1299,
    speed: '50/12.5Mbps',
    type: 'fwa',
    description: 'Uncapped, static IP, 99.9% SLA',
    features: ['Static IP', '99.9% SLA', '24/7 support'],
  },
  {
    id: 'skyfibre-100',
    name: 'SkyFibre 100',
    price: 1599,
    speed: '100/25Mbps',
    type: 'fwa',
    description: 'Business-grade with priority support',
    badge: 'Popular',
    badgeColor: 'orange',
    featured: true,
    features: ['Static IP', '99.9% SLA', '4hr response'],
  },
  {
    id: 'skyfibre-200',
    name: 'SkyFibre 200',
    price: 1899,
    speed: '200/50Mbps',
    type: 'fwa',
    description: 'High-bandwidth for demanding teams',
    badge: 'Enterprise',
    badgeColor: 'blue',
    features: ['Multiple IPs', '99.99% SLA', 'Dedicated support'],
  },
  {
    id: 'biz-failover',
    name: '5G Failover',
    price: 399,
    speed: '5G',
    type: '5g',
    description: 'Automatic backup when primary fails',
    badge: 'Add-on',
    badgeColor: 'green',
  },
];

// Segment-specific titles and link text
const SEGMENT_CONFIG: Record<SegmentType, { title: string; viewAllText: string; viewAllHref: string }> = {
  home: {
    title: 'Featured Home Deals',
    viewAllText: 'View all home plans',
    viewAllHref: '/packages?type=residential',
  },
  wfh: {
    title: 'WorkConnect Plans',
    viewAllText: 'View all SOHO plans',
    viewAllHref: '/soho',
  },
  business: {
    title: 'Business Connectivity',
    viewAllText: 'View all business solutions',
    viewAllHref: '/business',
  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  fibre: Wifi,
  '5g': Signal,
  lte: BatteryCharging,
  fwa: Building2,
};

const TYPE_LABELS: Record<string, string> = {
  fibre: 'Fibre',
  '5g': '5G',
  lte: 'LTE',
  fwa: 'Fixed Wireless',
};

interface PlanCardsProps {
  activeSegment?: SegmentType;
}

export function PlanCards({ activeSegment = 'home' }: PlanCardsProps) {
  // Select plans based on segment
  const plans = activeSegment === 'business'
    ? BUSINESS_PLANS
    : activeSegment === 'wfh'
    ? WFH_PLANS
    : HOME_PLANS;

  const config = SEGMENT_CONFIG[activeSegment];
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-12">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy">
            {config.title}
          </h2>
          <Link
            href={config.viewAllHref}
            className="inline-flex items-center text-circleTel-orange-accessible hover:text-circleTel-orange font-semibold transition-colors group"
          >
            {config.viewAllText}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const TypeIcon = TYPE_ICONS[plan.type];

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-white rounded-2xl p-6 transition-all duration-300',
                  plan.featured
                    ? 'ring-2 ring-circleTel-orange shadow-xl scale-[1.02] z-10'
                    : 'shadow-lg hover:shadow-xl border border-gray-100'
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={cn(
                      'absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold',
                      plan.badgeColor === 'green'
                        ? 'bg-green-500 text-white'
                        : plan.badgeColor === 'blue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-circleTel-orange text-white'
                    )}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="font-heading text-xl font-semibold text-circleTel-navy mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-heading text-3xl md:text-4xl font-bold text-circleTel-navy">
                    R{plan.price.toLocaleString()}
                  </span>
                  <span className="text-circleTel-grey600">/mo</span>
                </div>

                {/* Speed + Type */}
                <div className="flex items-center gap-2 mb-3">
                  <TypeIcon className="h-4 w-4 text-circleTel-grey600" />
                  <span className="font-body text-sm text-circleTel-grey600">
                    {TYPE_LABELS[plan.type]} {plan.speed}
                  </span>
                </div>

                {/* Description */}
                <p className="font-body text-sm text-circleTel-navy mb-3">
                  {plan.description}
                </p>

                {/* Features (for business/SOHO plans) */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="mb-4 space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-circleTel-grey600">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA Button */}
                <Button
                  variant="outline"
                  className="w-full border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white transition-colors mt-auto"
                  asChild
                >
                  <Link href={`/packages?plan=${plan.id}`}>
                    Learn More
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Promotional Banner (optional - can be enabled when promotions are active) */}
        {/* <div className="mt-8 p-4 bg-circleTel-orange/10 rounded-xl text-center">
          <p className="text-circleTel-navy font-semibold">
            <Zap className="inline-block h-5 w-5 text-circleTel-orange mr-2" />
            Sign up this month and get your first month FREE!
          </p>
        </div> */}
      </div>
    </section>
  );
}
