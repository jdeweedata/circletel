'use client';
import { PiArrowRightBold, PiCheckBold, PiWhatsappLogoBold } from 'react-icons/pi';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingPlan {
  _key: string;
  name: string;
  price: number;
  originalPrice?: number;  // For strikethrough pricing
  speed?: string;          // e.g., "100/25 Mbps"
  period?: string;
  description?: string;
  features: string[];
  // Support both formats
  cta?: { label: string; href: string };
  ctaLabel?: string;
  ctaUrl?: string;
  badge?: string;
  featured?: boolean;
  isPopular?: boolean;  // Sanity uses isPopular
  isEnterprise?: boolean;  // Renders as full-width banner below main plans
}

interface PricingBlockProps {
  // Support both old and Sanity field names
  title?: string;
  headline?: string;
  subtitle?: string;
  description?: string;
  tiers?: PricingPlan[];
  plans?: PricingPlan[];
  footnote?: string;
  showAnnualToggle?: boolean;
}

export function PricingBlock({
  title,
  headline,
  subtitle,
  description,
  tiers,
  plans,
  footnote,
  showAnnualToggle = false,
}: PricingBlockProps) {
  // Normalize field names to support both old and Sanity formats
  const displayTitle = title || headline;
  const displaySubtitle = subtitle || description;
  const displayPlans = plans || tiers || [];

  return (
    <section className="py-12 md:py-16 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(displayTitle || displaySubtitle) && (
          <div className="text-center mb-12">
            {displayTitle && (
              <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className="font-body text-lg text-circleTel-grey600 max-w-2xl mx-auto">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Separate main plans from enterprise plans */}
        {(() => {
          // Enterprise plans are identified by name containing "Enterprise" or isEnterprise flag
          const mainPlans = displayPlans.filter(
            (p) => !p.isEnterprise && !p.name.toLowerCase().includes('enterprise')
          );
          const enterprisePlans = displayPlans.filter(
            (p) => p.isEnterprise || p.name.toLowerCase().includes('enterprise')
          );

          return (
            <>
              {/* Main Pricing Grid */}
              <div className={cn(
                'grid gap-6 md:gap-8 max-w-5xl mx-auto',
                mainPlans.length === 2 && 'md:grid-cols-2',
                mainPlans.length >= 3 && 'md:grid-cols-3'
              )}>
                {mainPlans.map((plan) => {
                  // Normalize per-plan fields
                  const isFeatured = plan.featured || plan.isPopular;
                  const ctaLabel = plan.cta?.label || plan.ctaLabel || 'Get Started';
                  const ctaHref = plan.cta?.href || plan.ctaUrl || '#';

                  return (
                    <div
                      key={plan._key}
                      className={cn(
                        'relative bg-white rounded-2xl p-6 md:p-8 transition-shadow',
                        isFeatured
                          ? 'ring-2 ring-circleTel-orange shadow-xl scale-105 z-10'
                          : 'shadow-lg hover:shadow-xl border border-gray-100'
                      )}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-circleTel-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Plan Name */}
                      <h3 className="font-heading text-xl font-semibold text-circleTel-navy mb-1">
                        {plan.name}
                      </h3>

                      {/* Speed */}
                      {plan.speed && (
                        <p className="font-body text-sm font-medium text-circleTel-orange mb-2">
                          {plan.speed}
                        </p>
                      )}

                      {/* Description */}
                      {plan.description && (
                        <p className="font-body text-sm text-circleTel-grey600 mb-4">
                          {plan.description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mb-6">
                        {plan.originalPrice && (
                          <div className="mb-1">
                            <span className="font-body text-lg text-circleTel-grey600 line-through">
                              R{plan.originalPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <span className="font-heading text-4xl md:text-5xl font-bold text-circleTel-navy">
                          R{plan.price.toLocaleString()}
                        </span>
                        <span className="text-circleTel-grey600">/{plan.period || 'mo'}</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8">
                        {plan.features?.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <PiCheckBold className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="font-body text-sm text-circleTel-grey600">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA - always rendered */}
                      <Button
                        asChild
                        className={cn(
                          'w-full',
                          isFeatured
                            ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
                            : 'bg-circleTel-navy hover:bg-circleTel-navy/90 text-white'
                        )}
                      >
                        <Link href={ctaHref}>
                          {ctaLabel}
                          <PiArrowRightBold className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Enterprise Plans - Full Width Banner */}
              {enterprisePlans.length > 0 && (
                <div className="mt-8 max-w-5xl mx-auto">
                  {enterprisePlans.map((plan) => {
                    const ctaHref = plan.cta?.href || plan.ctaUrl || 'https://wa.me/27824873900';

                    return (
                      <div
                        key={plan._key}
                        className="bg-gradient-to-r from-circleTel-navy to-slate-800 rounded-2xl p-6 md:p-8 text-white"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          {/* Left: Plan Info */}
                          <div className="flex-1">
                            <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                              {plan.name}
                            </h3>
                            {plan.speed && (
                              <p className="font-body text-sm font-medium text-circleTel-orange mb-2">
                                {plan.speed}
                              </p>
                            )}
                            {plan.description && (
                              <p className="font-body text-white/80 mb-4">
                                {plan.description}
                              </p>
                            )}
                            {/* Features in horizontal layout for enterprise */}
                            <ul className="flex flex-wrap gap-x-6 gap-y-2">
                              {plan.features?.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <PiCheckBold className="w-4 h-4 text-circleTel-orange flex-shrink-0" />
                                  <span className="font-body text-sm text-white/90">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Right: CTA */}
                          <div className="flex-shrink-0">
                            <Button
                              asChild
                              size="lg"
                              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                            >
                              <Link href={ctaHref} className="flex items-center gap-2">
                                <PiWhatsappLogoBold className="w-5 h-5" />
                                Contact Sales
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Footnote */}
        {footnote && (
          <p className="font-body text-sm text-circleTel-grey600 text-center mt-8 max-w-2xl mx-auto">
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
}
