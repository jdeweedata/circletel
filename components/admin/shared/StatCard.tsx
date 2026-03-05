'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PiTrendUpBold, PiTrendDownBold } from 'react-icons/pi';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleIcon?: React.ReactNode;
  indicator?: 'pulse' | 'none';
  // Extended props for icon-based stat cards
  icon?: React.ReactNode;
  iconBgColor?: string; // e.g., 'bg-blue-100'
  iconColor?: string; // e.g., 'text-blue-600'
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  isActive?: boolean;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  subtitleIcon,
  indicator,
  icon,
  iconBgColor,
  iconColor,
  trend,
  onClick,
  isActive,
  href,
  className,
}: StatCardProps) {
  const isClickable = !!onClick || !!href;

  // Icon-based variant (with icon prop)
  if (icon) {
    const content = (
      <div
        onClick={onClick}
        className={cn(
          'relative overflow-hidden border bg-white shadow-sm rounded-lg transition-all duration-200',
          isClickable && 'cursor-pointer',
          isActive
            ? 'border-circleTel-orange ring-2 ring-circleTel-orange/20'
            : isClickable
              ? 'border-gray-200 hover:shadow-md hover:border-circleTel-orange/30'
              : 'border-gray-200',
          className
        )}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBgColor)}>
              <div className={iconColor}>{icon}</div>
            </div>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-semibold',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <PiTrendUpBold className="h-4 w-4" />
                ) : (
                  <PiTrendDownBold className="h-4 w-4" />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>

          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>

          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
      </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
  }

  // Simple variant (original design)
  const simpleContent = (
    <div
      onClick={onClick}
      className={cn(
        'bg-white p-5 rounded-xl border border-slate-200 shadow-sm',
        isClickable && 'cursor-pointer hover:shadow-md transition-shadow',
        isActive && 'border-circleTel-orange ring-2 ring-circleTel-orange/20',
        className
      )}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {indicator === 'pulse' && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1">
          {subtitleIcon}
          {subtitle}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{simpleContent}</Link> : simpleContent;
}
