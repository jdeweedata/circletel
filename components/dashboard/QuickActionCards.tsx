'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  FileText,
  Settings,
  UserCircle,
  HeadphonesIcon,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  icon: LucideIcon;
  href: string;
  description: string;
  iconBg: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'payment-method',
    title: 'Payment Method',
    icon: CreditCard,
    href: '/dashboard/payment-method',
    description: 'Manage payment method',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'invoices',
    title: 'View Invoices',
    icon: FileText,
    href: '/dashboard/billing',
    description: 'View your invoices',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'manage-service',
    title: 'Manage Service',
    icon: Settings,
    href: '/dashboard/services',
    description: 'Manage your services',
    iconBg: 'bg-orange-100',
    iconColor: 'text-circleTel-orange',
  },
  {
    id: 'update-profile',
    title: 'My Profile',
    icon: UserCircle,
    href: '/dashboard/profile',
    description: 'Update your details',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'log-ticket',
    title: 'Log a Ticket',
    icon: HeadphonesIcon,
    href: '/dashboard/tickets',
    description: 'Get technical support',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'get-help',
    title: 'Get Help',
    icon: HelpCircle,
    href: '/dashboard/support',
    description: 'FAQ and support',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
];

export interface QuickActionCardsProps {
  className?: string;
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
export function QuickActionCards({ className }: QuickActionCardsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-600 mt-1">Common tasks and shortcuts</p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'group relative flex flex-col items-center gap-3 p-6',
                'bg-white border-2 border-gray-200 rounded-xl',
                'hover:border-circleTel-orange hover:shadow-lg',
                'transition-all duration-300 hover:scale-[1.02]',
                'cursor-pointer'
              )}
            >
              {/* Icon Container */}
              <div className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center',
                'transition-transform duration-300 group-hover:scale-110',
                action.iconBg
              )}>
                <Icon className={cn('h-7 w-7', action.iconColor)} />
              </div>

              {/* Title */}
              <div className="text-center">
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-circleTel-orange transition-colors">
                  {action.title}
                </h3>
              </div>

              {/* Hover Indicator (subtle bottom border) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-circleTel-orange rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity" />
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
