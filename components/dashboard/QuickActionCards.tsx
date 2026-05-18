'use client';
import { IconType } from 'react-icons';
import { PiCreditCardBold, PiFileTextBold, PiHeadphonesBold, PiQuestionBold, PiUserCircleBold } from 'react-icons/pi';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  icon: IconType;
  href: string;
  description: string;
  iconBg: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'pay-now',
    title: 'Pay now',
    icon: PiCreditCardBold,
    href: '/dashboard/billing',
    description: 'Make a payment',
    iconBg: 'bg-orange-100',
    iconColor: 'text-circleTel-orange',
  },
  {
    id: 'invoices',
    title: 'Billing & statements',
    icon: PiFileTextBold,
    href: '/dashboard/invoices',
    description: 'View your invoices',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'payment-method',
    title: 'Payment details',
    icon: PiCreditCardBold,
    href: '/dashboard/payment-method',
    description: 'Manage payment method',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'update-profile',
    title: 'My Profile',
    icon: PiUserCircleBold,
    href: '/dashboard/profile',
    description: 'Update your details',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'log-ticket',
    title: 'Log a Ticket',
    icon: PiHeadphonesBold,
    href: '/dashboard/tickets',
    description: 'Get technical support',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'get-help',
    title: 'Get Help',
    icon: PiQuestionBold,
    href: '/dashboard/support',
    description: 'FAQ and support',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
];

export interface QuickActionCardsProps {
  className?: string;
  billingHighlight?: { amountDue: number; overdueCount: number };
}

/**
 * QuickActionCards Component
 *
 * Displays a grid of quick action cards for common dashboard tasks.
 * Inspired by Supersonic's dashboard UX but adapted to CircleTel branding.
 *
 * Features:
 * - 6 action cards in 3-column grid (responsive)
 * - Color-coded icons for visual distinction
 * - Hover effects with scale and shadow
 * - CircleTel orange accent color
 * - Mobile-friendly (stacks to 2 columns on mobile)
 *
 * @example
 * ```tsx
 * <QuickActionCards />
 * ```
 */
export function QuickActionCards({ className, billingHighlight }: QuickActionCardsProps) {
  return (
    <div className={cn('', className)}>
      {/* Action Cards Grid - Matching Stat Card Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isBillingCard = action.id === 'pay-now';
          const shouldHighlight = isBillingCard && billingHighlight && (billingHighlight.amountDue > 0 || billingHighlight.overdueCount > 0);
          const badgeText = billingHighlight?.amountDue && billingHighlight.amountDue > 0
            ? `R${billingHighlight.amountDue.toFixed(2)} due`
            : billingHighlight?.overdueCount ? `${billingHighlight.overdueCount} overdue` : '';

          return (
            <Link
              key={action.id}
              href={action.href}
              className="block group"
            >
              <div className={cn(
                'relative overflow-hidden border bg-white',
                'shadow-sm hover:shadow-lg transition-all duration-200',
                'rounded-lg py-8 px-6 h-full flex flex-col',
                'cursor-pointer hover:scale-[1.02] hover:border-circleTel-orange/30',
                shouldHighlight ? 'border-circleTel-orange' : 'border-gray-200'
              )}>
                {/* Badge for billing highlight */}
                {shouldHighlight && badgeText && (
                  <div className="absolute top-2 right-2 bg-circleTel-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badgeText}
                  </div>
                )}

                {/* Header with Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-12 w-12 rounded-lg flex items-center justify-center',
                      action.iconBg
                    )}>
                      <Icon className={cn('h-6 w-6', action.iconColor)} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * QuickActionCardsCompact Component
 *
 * Compact version of QuickActionCards for smaller spaces.
 * Uses 2-column layout with smaller icons.
 *
 * @example
 * ```tsx
 * <QuickActionCardsCompact />
 * ```
 */
export function QuickActionCardsCompact({ className }: QuickActionCardsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'group flex items-center gap-3 p-4',
                'bg-white border-2 border-gray-200 rounded-lg',
                'hover:border-circleTel-orange hover:shadow-md',
                'transition-all duration-200 hover:scale-[1.02]',
                'cursor-pointer'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                action.iconBg
              )}>
                <Icon className={cn('h-5 w-5', action.iconColor)} />
              </div>

              <span className="font-semibold text-sm text-gray-900 group-hover:text-circleTel-orange transition-colors">
                {action.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
