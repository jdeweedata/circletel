'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { partnerTabs, getActiveTab } from './nav-config';

interface PartnerTabsProps {
  className?: string;
}

export default function PartnerTabs({ className }: PartnerTabsProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav className={cn('hidden lg:flex items-center gap-1', className)}>
      {partnerTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'text-circleTel-darkNeutral'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>

            {/* Active indicator - Vercel style underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-circleTel-orange rounded-full"
                style={{ transform: 'translateY(8px)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
