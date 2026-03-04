'use client';
import { PiArrowRightBold, PiCheckBold} from 'react-icons/pi';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingTier {
  _key: string;
  name: string;
  price: number;
  period?: string;
  description?: string;
  features: string[];
  cta?: {
    label: string;
    href: string;
  };
  badge?: string;
  featured?: boolean;
}

interface PricingBlockProps {
  title?: string;
  subtitle?: string;
  tiers: PricingTier[];
  showAnnualToggle?: boolean;
}

export function PricingBlock({
  title,
  subtitle,
  tiers,
  showAnnualToggle = false,
}: PricingBlockProps) {
  return (
    <section className="py-16 md:py-20 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-body text-lg text-circleTel-grey600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Pricing Grid */}
        <div className={cn(
          'grid gap-6 md:gap-8 max-w-6xl mx-auto',
          tiers.length === 2 && 'md:grid-cols-2',
          tiers.length === 3 && 'md:grid-cols-3',
          tiers.length >= 4 && 'md:grid-cols-2 lg:grid-cols-4'
        )}>
          {tiers?.map((tier) => (
            <div
              key={tier._key}
              className={cn(
                'relative bg-white rounded-2xl p-6 md:p-8 transition-shadow',
                tier.featured
                  ? 'ring-2 ring-circleTel-orange shadow-xl scale-105 z-10'
                  : 'shadow-lg hover:shadow-xl border border-gray-100'
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-circleTel-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="font-heading text-xl font-semibold text-circleTel-navy mb-2">
                {tier.name}
              </h3>

              {/* Description */}
              {tier.description && (
                <p className="font-body text-sm text-circleTel-grey600 mb-4">
                  {tier.description}
                </p>
              )}

              {/* Price */}
              <div className="mb-6">
                <span className="font-heading text-4xl md:text-5xl font-bold text-circleTel-navy">
                  R{tier.price.toLocaleString()}
                </span>
                <span className="text-circleTel-grey600">/{tier.period || 'mo'}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <PiCheckBold className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-circleTel-grey600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.cta && (
                <Button
                  asChild
                  className={cn(
                    'w-full',
                    tier.featured
                      ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
                      : 'bg-circleTel-navy hover:bg-circleTel-navy/90 text-white'
                  )}
                >
                  <Link href={tier.cta.href}>
                    {tier.cta.label}
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
