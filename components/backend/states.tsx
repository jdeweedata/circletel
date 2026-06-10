'use client';

import { cn } from '@/lib/utils';
import { PiSpinnerBold, PiWarningCircleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';

/**
 * Shared loading / empty / error shells so every backend list and data view
 * presents the same states. Derived from the consumer billing dashboard.
 */

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] gap-3', className)}>
      <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** Optional CTA (e.g. a Button or Link). */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto mb-3 h-12 w-12 opacity-20 flex items-center justify-center [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </div>
      <p className="text-gray-500">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] gap-4', className)}>
      <PiWarningCircleBold className="h-12 w-12 text-red-500" />
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </div>
  );
}
