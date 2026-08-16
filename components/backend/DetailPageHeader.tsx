'use client';

import Link from 'next/link';
import { PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { StatusBadge, type StatusVariant } from './StatusBadge';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DetailPageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant: StatusVariant;
  };
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Canonical detail page header — type scale and tokens match PageHeader.
 * Breadcrumbs + optional status sit above the title row. No full-bleed bar
 * (parent AdminLayout already provides shell padding/background).
 */
export function DetailPageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  status,
  actions,
  className,
}: DetailPageHeaderProps) {
  return (
    <div data-pm="detail-header" className={cn('mb-6', className)}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <PiCaretRightBold className="w-3 h-3" aria-hidden="true" />}
                {item.href ? (
                  <Link href={item.href} className="hover:text-circleTel-orange">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {status && <StatusBadge status={status.label} variant={status.variant} />}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
