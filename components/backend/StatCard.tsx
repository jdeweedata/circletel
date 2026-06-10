'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PiMinusBold, PiTrendDownBold, PiTrendUpBold } from 'react-icons/pi';

/**
 * Unified backend StatCard — single source of truth for metric cards across the
 * admin (`/admin/*`) and consumer (`/dashboard/*`) dashboards.
 *
 * Consolidates the three former implementations:
 *  - components/admin/shared/StatCard.tsx (icon + simple variants)
 *  - components/dashboard/ModernStatCard.tsx
 *  - the inline <div> stat cards on app/admin/dashboard/page.tsx
 *
 * Three layouts, chosen by props, so every existing call site keeps its current
 * look while new/migrated code gets the billing-dashboard reference look:
 *  1. no `icon`                → compact "simple" card (legacy admin dense rows)
 *  2. `icon` + `iconBgColor`   → boxed-icon card (legacy admin icon cards)
 *  3. `icon`, no `iconBgColor` → inline-icon card  ← REFERENCE look (billing/consumer)
 */
export interface StatCardProps {
  /** Card heading. `label` and `title` are aliases (title kept for ModernStatCard parity). */
  label?: string;
  title?: string;
  value: string | number;
  icon?: React.ReactNode;
  /** When set (with `icon`), renders the icon inside a coloured box — legacy admin look. */
  iconBgColor?: string;
  iconColor?: string;
  trend?: { value: number; isPositive: boolean; label?: string };
  /** Top-right corner badge (e.g. an "URGENT" pill). Takes precedence over `trend`. */
  badge?: React.ReactNode;
  subtitle?: string;
  subtitleIcon?: React.ReactNode;
  description?: string;
  /** Small pulsing dot next to the value (legacy "simple" variant). */
  indicator?: 'pulse' | 'none';
  onClick?: () => void;
  isActive?: boolean;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  badge,
  subtitle,
  subtitleIcon,
  description,
  indicator,
  onClick,
  isActive,
  href,
  className,
}: StatCardProps) {
  const heading = label ?? title ?? '';
  const isClickable = !!onClick || !!href;

  const withLink = (node: React.ReactNode) =>
    href ? (
      <Link href={href} className="block">
        {node}
      </Link>
    ) : (
      node
    );

  // --- Variant 1: compact "simple" card (no icon) — preserves legacy admin look ---
  if (!icon) {
    return withLink(
      <div
        onClick={onClick}
        className={cn(
          'bg-white p-5 rounded-xl border border-gray-200 shadow-sm',
          isClickable && 'cursor-pointer hover:shadow-md transition-shadow',
          isActive && 'border-circleTel-orange ring-2 ring-circleTel-orange/20',
          className
        )}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{heading}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
          {indicator === 'pulse' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
        </div>
        {subtitle && (
          <div className="mt-2 text-xs text-gray-500 font-medium flex items-center gap-1">
            {subtitleIcon}
            {subtitle}
          </div>
        )}
      </div>
    );
  }

  // --- Variants 2 & 3: icon cards ---
  const trendIcon =
    trend == null ? null : trend.value === 0 ? (
      <PiMinusBold className="h-4 w-4" />
    ) : trend.isPositive ? (
      <PiTrendUpBold className="h-4 w-4" />
    ) : (
      <PiTrendDownBold className="h-4 w-4" />
    );

  const trendColor =
    trend == null
      ? ''
      : trend.value === 0
        ? 'text-gray-500'
        : trend.isPositive
          ? 'text-green-600'
          : 'text-red-600';

  // --- Variant 2: boxed-icon card (iconBgColor set) — preserves legacy admin look ---
  if (iconBgColor) {
    return withLink(
      <div
        onClick={onClick}
        className={cn(
          'relative overflow-hidden border bg-white shadow-sm rounded-lg transition-all duration-200',
          isActive
            ? 'border-circleTel-orange ring-2 ring-circleTel-orange/20'
            : isClickable
              ? 'border-gray-200 cursor-pointer hover:shadow-md hover:border-circleTel-orange/30'
              : 'border-gray-200',
          className
        )}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBgColor)}>
              <div className={iconColor}>{icon}</div>
            </div>
            {badge
              ? badge
              : trend && (
                  <div className={cn('flex items-center gap-1 text-sm font-semibold', trendColor)}>
                    {trendIcon}
                    <span>{trend.value}%</span>
                  </div>
                )}
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{heading}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
      </div>
    );
  }

  // --- Variant 3: inline-icon card (icon, no box) — REFERENCE look (billing/consumer) ---
  return withLink(
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 rounded-lg',
        isClickable && 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-circleTel-orange/30',
        isActive && 'border-circleTel-orange ring-2 ring-circleTel-orange/20',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-gray-400">{icon}</div>
            <h3 className="text-sm font-medium text-gray-600">{heading}</h3>
          </div>
          {badge
            ? badge
            : trend && (
                <div className={cn('flex items-center gap-1 text-sm font-semibold', trendColor)}>
                  {trendIcon}
                  <span>
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </span>
                </div>
              )}
        </div>

        <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>

        {subtitle && (
          <p className="text-sm font-medium text-gray-700 mt-1 flex items-center gap-1.5">
            {subtitleIcon}
            {subtitle}
          </p>
        )}
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
}
