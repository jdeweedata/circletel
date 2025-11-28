'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getSidebarItems,
  isSidebarItemActive,
  dashboardTabs,
  getActiveTab,
} from './nav-config';

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export default function DashboardSidebar({
  collapsed = false,
  onToggleCollapse,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const sidebarItems = getSidebarItems(activeTab);

  // Get the tab label for the header
  const activeTabConfig = dashboardTabs.find((t) => t.id === activeTab);
  const tabLabel = activeTabConfig?.label || '';

  // Don't render sidebar if no items for this tab
  if (sidebarItems.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 bg-white border-r border-gray-200',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
        className
      )}
    >
      <div className="flex flex-col h-full p-3">
        {/* Header with section title and collapse toggle */}
        <div
          className={cn(
            'flex items-center mb-4 pb-3 border-b border-gray-100',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {tabLabel}
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 hover:bg-gray-100 flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => {
              const isActive = isSidebarItemActive(pathname, item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    collapsed ? 'justify-center' : 'gap-3',
                    isActive
                      ? 'bg-circleTel-orange/10 text-circleTel-orange'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-circleTel-orange'
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-circleTel-orange text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              // Wrap in tooltip when collapsed
              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="font-medium z-50"
                      sideOffset={8}
                    >
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 text-xs text-circleTel-orange">
                          ({item.badge})
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{linkContent}</div>;
            })}
          </TooltipProvider>
        </nav>
      </div>
    </aside>
  );
}
