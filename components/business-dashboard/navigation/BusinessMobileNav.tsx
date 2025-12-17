'use client';

/**
 * Business Mobile Navigation
 *
 * Bottom navigation bar for mobile devices in B2B customer portal.
 *
 * @module components/business-dashboard/navigation/BusinessMobileNav
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BUSINESS_MOBILE_NAV } from './nav-config';

export function BusinessMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {BUSINESS_MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                isActive
                  ? 'text-circleTel-orange'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive && 'text-circleTel-orange')}
              />
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'font-medium' : 'font-normal'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-circleTel-orange rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
