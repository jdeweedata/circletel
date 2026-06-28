'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface InspectorPanelProps {
  title?: string;
  children: React.ReactNode;
  tabs?: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
}

function InspectorContent({
  title,
  tabs,
  children,
  contentClassName,
}: Pick<InspectorPanelProps, 'title' | 'tabs' | 'children' | 'contentClassName'>) {
  return (
    <>
      {title && (
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
        </div>
      )}
      {tabs && <div className="border-b border-gray-200 px-5">{tabs}</div>}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </>
  );
}

export function InspectorPanel({
  title = 'Details',
  children,
  tabs,
  trigger,
  open,
  onOpenChange,
  className,
  contentClassName,
}: InspectorPanelProps) {
  return (
    <>
      <aside className={cn('hidden xl:block w-[360px] shrink-0 border-l border-gray-200 bg-white', className)}>
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <InspectorContent title={title} tabs={tabs} contentClassName={contentClassName}>
            {children}
          </InspectorContent>
        </div>
      </aside>
      <div className="xl:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          {trigger && (
            <SheetTrigger asChild>
              {trigger}
            </SheetTrigger>
          )}
          {!trigger && (
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                {title}
              </Button>
            </SheetTrigger>
          )}
          <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <InspectorContent title={title} tabs={tabs} contentClassName={contentClassName}>
              {children}
            </InspectorContent>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
