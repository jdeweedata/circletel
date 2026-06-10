'use client';

import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * Canonical pill-style tabs for backend UIs, matching the consumer billing
 * dashboard: gray-100 track, white active pill with orange text + shadow.
 * (For detail-page sub-navigation use UnderlineTabs instead.)
 *
 * Usage:
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <ConsoleTabsList items={[{ value: 'a', label: 'A', icon: <Icon/> }]} />
 *     <ConsoleTabsContent value="a">...</ConsoleTabsContent>
 *   </Tabs>
 */

export interface ConsoleTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Hide the label below the `sm` breakpoint (icon stays). */
  hideLabelOnMobile?: boolean;
}

interface ConsoleTabsListProps {
  items: ConsoleTabItem[];
  className?: string;
}

// Static Tailwind class strings (so JIT can see them). Wraps to 2/3 cols on mobile.
const COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-6',
};

export function ConsoleTabsList({ items, className }: ConsoleTabsListProps) {
  return (
    <TabsList
      className={cn(
        'grid w-full lg:w-auto lg:inline-flex h-auto p-1.5 bg-gray-100 border border-gray-200 rounded-xl gap-1',
        COLS[items.length] ?? 'grid-cols-3',
        className
      )}
    >
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          unstyled
          className="gap-2.5 px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200
            data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50
            data-[state=active]:bg-white data-[state=active]:text-circleTel-orange data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
        >
          {item.icon}
          <span className={cn(item.hideLabelOnMobile && 'hidden sm:inline')}>{item.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export function ConsoleTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsContent>) {
  return <TabsContent className={cn('mt-6', className)} {...props} />;
}

export { Tabs, TabsContent };
