'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { dashboardTabs, getActiveTab } from './nav-config';

interface MobileBottomNavProps {
  className?: string;
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
        'bg-white border-t border-gray-200 shadow-lg',
        className
      )}
      style={{
        // Safe area padding for notched phones (iPhone X+)
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center h-16">
        {dashboardTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 min-w-0',
                'transition-colors duration-200',
                isActive
                  ? 'text-circleTel-orange'
                  : 'text-gray-400 active:text-gray-600'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                  isActive && 'bg-circleTel-orange/10'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium mt-0.5 truncate',
                  isActive ? 'text-circleTel-orange' : 'text-gray-500'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
