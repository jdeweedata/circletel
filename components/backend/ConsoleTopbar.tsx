'use client';

import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

interface ConsoleTopbarProps {
  brand?: React.ReactNode;
  title?: string;
  subtitle?: string;
  leadingAction?: React.ReactNode;
  center?: React.ReactNode;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  className?: string;
}

export function ConsoleTopbar({
  brand,
  title,
  subtitle,
  leadingAction,
  center,
  actions,
  searchPlaceholder = 'Search...',
  showSearch = true,
  className,
}: ConsoleTopbarProps) {
  return (
    <header className={cn('sticky top-0 z-40 border-b border-gray-200 bg-white print:hidden', className)}>
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {leadingAction}
        {brand}
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && <h1 className="truncate text-sm font-semibold text-gray-900">{title}</h1>}
            {subtitle && <p className="hidden truncate text-xs text-gray-500 sm:block">{subtitle}</p>}
          </div>
        )}
        {center && <div className="hidden min-w-0 flex-1 justify-center lg:flex">{center}</div>}
        {showSearch && (
          <div className="ml-auto hidden w-full max-w-sm md:block">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-circleTel-orange focus:ring-2 focus:ring-circleTel-orange/15"
              />
            </label>
          </div>
        )}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
