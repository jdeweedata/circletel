'use client';

import React from 'react';
import { MapPin, Package, Calculator, Phone } from 'lucide-react';
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
}

export function QuickActions({ className }: QuickActionsProps) {
  const handleClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  return (
    <section className={cn('py-4 bg-gray-50 border-b border-gray-100', className)}>
      <div className="container mx-auto px-4">
        {/* Compact Quick Action Row */}
        <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleClick(action.href)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap',
                  'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-circleTel-orange/30',
                  'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-1'
                )}
              >
                <Icon className={cn('w-4 h-4', action.color)} />
                <span className="text-sm font-medium text-circleTel-navy">{action.label}</span>
              </button>
            );
          })}
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
