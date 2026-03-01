'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Wifi, Signal, BatteryCharging } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HeroPlan {
  id: string;
  name: string;
  price: number;
  speed: string;
  type: 'fibre' | '5g' | 'lte';
  description: string;
  badge?: string;
  badgeColor?: 'orange' | 'green';
  featured?: boolean;
}

const HERO_PLANS: HeroPlan[] = [
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

const TYPE_ICONS: Record<string, React.ElementType> = {
  fibre: Wifi,
  '5g': Signal,
  lte: BatteryCharging,
};

const TYPE_LABELS: Record<string, string> = {
  fibre: 'Fibre',
  '5g': '5G',
  lte: 'LTE Backup',
};

export function PlanCards() {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-12">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy">
            Featured Home Deals
          </h2>
          <Link
            href="/packages"
            className="inline-flex items-center text-circleTel-orange-accessible hover:text-circleTel-orange font-semibold transition-colors group"
          >
            View all plans
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HERO_PLANS.map((plan) => {
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
                    R{plan.price}
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
                <p className="font-body text-sm text-circleTel-navy mb-6 min-h-[40px]">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Button
                  variant="outline"
                  className="w-full border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white transition-colors"
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
