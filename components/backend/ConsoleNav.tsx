'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ConsoleNavItem, ConsoleNavSection } from './console-types';
import { isConsoleNavItemActive } from './console-utils';

interface ConsoleNavProps {
  sections: ConsoleNavSection[];
  collapsed?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function NavItem({ item, collapsed, pathname }: { item: ConsoleNavItem; collapsed?: boolean; pathname: string }) {
  const active = isConsoleNavItemActive(pathname, item);
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  const content = (
    <Link
      href={item.disabled || !item.href ? '#' : item.href}
      aria-disabled={item.disabled}
      className={cn(
        'group flex min-h-9 items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition',
        collapsed ? 'justify-center' : 'gap-2.5',
        active
          ? 'bg-gray-100 text-gray-950'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-circleTel-orange/25',
        item.disabled && 'pointer-events-none opacity-50'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            active ? 'text-gray-950' : 'text-gray-500 group-hover:text-gray-800'
          )}
        />
      )}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-circleTel-orange-light px-2 py-0.5 text-xs font-semibold text-circleTel-orange-accessible">
              {item.badge}
            </span>
          )}
          {hasChildren && <PiCaretRightBold className="h-3.5 w-3.5 text-gray-400" />}
        </>
      )}
    </Link>
  );

  if (!collapsed) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="font-medium">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function ConsoleNav({ sections, collapsed, header, footer, className }: ConsoleNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-gray-200 bg-white transition-all duration-200 lg:flex lg:flex-col print:hidden',
          collapsed ? 'w-16' : 'w-60',
          className
        )}
      >
        {header && <div className="border-b border-gray-100 p-3">{header}</div>}
        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          {sections.map((section, sectionIndex) => (
            <div key={section.label ?? `section-${sectionIndex}`} className={cn(sectionIndex > 0 && 'mt-4')}>
              {section.label && !collapsed && (
                <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={`${section.label ?? 'main'}-${item.label}`}>
                    <NavItem item={item} collapsed={collapsed} pathname={pathname} />
                    {!collapsed && item.children?.length && isConsoleNavItemActive(pathname, item) && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-2">
                        {item.children.map((child) => (
                          <NavItem key={child.label} item={child} pathname={pathname} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {footer && <div className="border-t border-gray-100 p-3">{footer}</div>}
      </aside>
    </TooltipProvider>
  );
}
