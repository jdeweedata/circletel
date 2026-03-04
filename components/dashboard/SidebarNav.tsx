'use client';
import { PiCaretLeftBold, PiCaretRightBold, PiCreditCardBold, PiGearBold, PiHouseBold, PiPackageBold, PiQuestionBold } from 'react-icons/pi';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const items: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: PiHouseBold },
  { label: 'Accounts', href: '/dashboard/profile', icon: UserCircle },
  { label: 'Orders', href: '/dashboard/orders', icon: PiPackageBold },
  { label: 'Billing', href: '/dashboard/billing', icon: PiCreditCardBold },
  { label: 'Help & Support', href: '#', icon: PiQuestionBold, disabled: true },
  { label: 'Settings', href: '#', icon: PiGearBold, disabled: true },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}

export default function SidebarNav({ collapsed = false, onToggleCollapse, mobile = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "shrink-0 bg-white transition-all duration-300 ease-in-out z-40",
        !mobile && "hidden lg:flex border-r",
        mobile ? "w-full" : collapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className={cn("flex flex-col gap-2 p-4 w-full", mobile ? "h-full" : "h-screen sticky top-0")}>
        {/* Toggle Button - Only show on desktop */}
        {!mobile && (
          <div className={cn(
            "flex items-center justify-end py-2",
            collapsed ? "px-0" : "px-3"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 hover:bg-gray-100"
            >
              {collapsed ? (
                <PiCaretRightBold className="h-5 w-5 text-gray-600" />
              ) : (
                <PiCaretLeftBold className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <TooltipProvider delayDuration={0}>
            {items.map((item) => {
              const active = item.href !== '#' && pathname.startsWith(item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  key={item.label}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    collapsed ? 'justify-center' : 'gap-3',
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    item.disabled && 'opacity-50 pointer-events-none'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium z-50">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </TooltipProvider>
        </nav>

        {/* Footer Copyright */}
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-gray-500">© 2025 CircleTel</div>
        )}
      </div>
    </aside>
  );
}
