'use client';

import Link from 'next/link';
import { PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { StatusBadge, type StatusVariant } from './StatusBadge';

interface EntityHeaderBreadcrumb {
  label: string;
  href?: string;
}

interface EntityHeaderProps {
  breadcrumbs?: EntityHeaderBreadcrumb[];
  title: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  status?: { label: string; variant?: StatusVariant };
  tabs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function EntityHeader({
  breadcrumbs,
  title,
  eyebrow,
  meta,
  status,
  tabs,
  actions,
  className,
}: EntityHeaderProps) {
  return (
    <header className={cn('border-b border-gray-200 bg-white', className)}>
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-500">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <PiCaretRightBold className="h-3 w-3 text-gray-300" aria-hidden="true" />}
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
        ) : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-medium text-gray-500">{eyebrow}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-normal text-gray-950">{title}</h1>
              {status && <StatusBadge status={status.label} variant={status.variant ?? 'neutral'} />}
            </div>
            {meta && <div className="mt-2 text-sm text-gray-500">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {tabs && <div className="mt-4">{tabs}</div>}
      </div>
    </header>
  );
}
