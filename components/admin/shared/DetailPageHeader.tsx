'use client';

import Link from 'next/link';
import { PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusVariant } from './StatusBadge';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DetailPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  status?: {
    label: string;
    variant: StatusVariant;
  };
  actions?: React.ReactNode;
  className?: string;
}

export function DetailPageHeader({
  breadcrumbs,
  title,
  status,
  actions,
  className,
}: DetailPageHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-slate-200', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs font-medium text-slate-500">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <PiCaretRightBold className="w-3 h-3" aria-hidden="true" />}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-primary">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {status && (
              <StatusBadge
                status={status.label}
                variant={status.variant}
              />
            )}
          </div>

          {/* Action Buttons */}
          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
