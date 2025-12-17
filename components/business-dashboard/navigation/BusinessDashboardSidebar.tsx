'use client';

/**
 * Business Dashboard Sidebar
 *
 * Collapsible sidebar navigation for B2B customer portal.
 *
 * @module components/business-dashboard/navigation/BusinessDashboardSidebar
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BUSINESS_NAV_ITEMS, BUSINESS_SECONDARY_NAV, JOURNEY_STAGE_NAV } from './nav-config';
import { JourneyStageId } from '@/lib/business/journey-config';

interface BusinessDashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function BusinessDashboardSidebar({
  collapsed,
  onToggleCollapse,
}: BusinessDashboardSidebarProps) {
  const pathname = usePathname();
  const [journeyStage, setJourneyStage] = useState<JourneyStageId | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Fetch current journey stage
  useEffect(() => {
    const fetchJourneyStatus = async () => {
      try {
        const response = await fetch('/api/business-dashboard/journey');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setJourneyStage(data.data.currentStage);
            setIsBlocked(!!data.data.blockedStage);
          }
        }
      } catch (error) {
        console.error('Failed to fetch journey status:', error);
      }
    };
    fetchJourneyStatus();
  }, []);

  const currentStageNav = journeyStage ? JOURNEY_STAGE_NAV[journeyStage] : null;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Journey Progress Card */}
      {!collapsed && currentStageNav && (
        <div className="p-4 border-b">
          <div className="bg-gradient-to-br from-circleTel-orange/10 to-orange-100 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Next Step
            </p>
            <Link
              href={currentStageNav.href}
              className="flex items-center gap-2 text-circleTel-orange hover:text-orange-600 transition-colors"
            >
              <currentStageNav.icon className="h-4 w-4" />
              <span className="font-medium">{currentStageNav.label}</span>
            </Link>
            {isBlocked && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Action required</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {BUSINESS_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isJourneyNext = currentStageNav?.href === item.href;

            const content = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                  isActive
                    ? 'bg-circleTel-orange text-white'
                    : isJourneyNext
                    ? 'bg-orange-50 text-circleTel-orange border border-circleTel-orange/30'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {isJourneyNext && (
                      <Badge variant="secondary" className="text-xs bg-orange-100">
                        Next
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <li key={item.href}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              );
            }

            return <li key={item.href}>{content}</li>;
          })}
        </ul>

        {/* Secondary Navigation */}
        <div className="mt-6 pt-6 border-t">
          <ul className="space-y-1">
            {BUSINESS_SECONDARY_NAV.map((item) => {
              const isActive = pathname === item.href;

              const content = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  )}
                >
                  <item.icon
                    className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                );
              }

              return <li key={item.href}>{content}</li>;
            })}
          </ul>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn('w-full', collapsed && 'px-0')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
