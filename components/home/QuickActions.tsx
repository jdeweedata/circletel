'use client';

import React from 'react';
import { MapPin, Package, Calculator, Phone, Zap, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: MapPin,
    label: 'Check Coverage',
    description: 'See what\u0027s available',
    href: '#coverage',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    icon: Package,
    label: 'View Packages',
    description: 'Compare plans',
    href: '/pricing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    icon: Calculator,
    label: 'Get Quote',
    description: 'Business pricing',
    href: '/business',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    icon: Phone,
    label: 'Contact Us',
    description: 'Speak to sales',
    href: '/contact',
    color: 'text-circleTel-orange',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
];

interface QuickActionsProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function QuickActions({ className, variant = 'default' }: QuickActionsProps) {
  const handleClick = (href: string) => {
    if (href.startsWith('#')) {
      // Scroll to section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to page
      window.location.href = href;
    }
  };

  const isCompact = variant === 'compact';

  return (
    <section className={cn('py-6 md:py-8 bg-white', className)}>
      <div className="container mx-auto px-4">
        {/* Section Header - optional for non-compact */}
        {!isCompact && (
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-circleTel-grey600 uppercase tracking-wide">
              Quick Actions
            </p>
          </div>
        )}

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleClick(action.href)}
                className={cn(
                  'group flex flex-col items-center p-4 md:p-6 rounded-xl transition-all duration-200',
                  'border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02]',
                  'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2',
                  action.bgColor
                )}
              >
                {/* Icon Container */}
                <div
                  className={cn(
                    'w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 md:mb-3',
                    'bg-white shadow-inner transition-transform group-hover:scale-110'
                  )}
                >
                  <Icon className={cn('w-6 h-6 md:w-7 md:h-7', action.color)} />
                </div>

                {/* Label */}
                <span className="font-heading font-semibold text-sm md:text-base text-circleTel-navy mb-0.5">
                  {action.label}
                </span>

                {/* Description - hidden on mobile compact */}
                <span className="text-xs text-circleTel-grey600 hidden md:block">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional: Promotional Callout */}
        <div className="mt-6 md:mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-circleTel-orange/10 to-orange-100 rounded-full">
            <Zap className="w-4 h-4 text-circleTel-orange" />
            <span className="text-sm font-medium text-circleTel-navy">
              Same-day installation available in most areas
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Alternative: Compact horizontal bar version for integration above fold
export function QuickActionsBar({ className }: { className?: string }) {
  return (
    <div className={cn('py-3 bg-white border-b border-gray-100', className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
                  'hover:bg-gray-50 text-circleTel-navy hover:text-circleTel-orange',
                  'focus:outline-none focus:ring-2 focus:ring-circleTel-orange'
                )}
              >
                <Icon className={cn('w-5 h-5', action.color)} />
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
