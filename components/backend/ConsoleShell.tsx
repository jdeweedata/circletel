'use client';

import { cn } from '@/lib/utils';

interface ConsoleShellProps {
  topbar?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  mainClassName?: string;
  contentClassName?: string;
}

export function ConsoleShell({
  topbar,
  sidebar,
  children,
  footer,
  className,
  mainClassName,
  contentClassName,
}: ConsoleShellProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50 text-gray-900 flex flex-col lg:flex-row print:block', className)}>
      {sidebar}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {topbar}
        <main className={cn('min-w-0 flex-1', mainClassName)}>
          <div className={cn('p-4 sm:p-6 lg:p-8', contentClassName)}>{children}</div>
        </main>
        {footer}
      </div>
    </div>
  );
}
