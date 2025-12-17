'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { SharedInfoBoxProps } from './types';
import { infoBoxVariantMap } from './types';

/**
 * SharedInfoBox Component
 *
 * A styled info/alert box with color variants.
 * Used for highlighting important information, warnings, or success messages.
 *
 * @example
 * ```tsx
 * <SharedInfoBox variant="orange" title="Account Number" icon={User}>
 *   <p className="text-lg font-bold">CT-2025-00001</p>
 *   <p className="text-sm">Use this number when contacting support</p>
 * </SharedInfoBox>
 * ```
 */
export function SharedInfoBox({
  children,
  variant = 'gray',
  title,
  icon: Icon,
  className,
}: SharedInfoBoxProps) {
  const variantClasses = infoBoxVariantMap[variant];

  return (
    <div className={cn('border rounded-lg p-4', variantClasses, className)}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-5 w-5 text-current opacity-70" />}
          {title && <h4 className="font-semibold text-gray-900">{title}</h4>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * SharedHighlightBox Component
 *
 * A prominent highlight box for key information like account numbers.
 * Uses orange gradient background.
 *
 * @example
 * ```tsx
 * <SharedHighlightBox
 *   label="Account Number"
 *   value="CT-2025-00001"
 *   hint="Use this number when contacting support"
 *   icon={User}
 * />
 * ```
 */
export interface SharedHighlightBoxProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function SharedHighlightBox({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: SharedHighlightBoxProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * SharedAlertBox Component
 *
 * An alert box for warnings, errors, or important notices.
 *
 * @example
 * ```tsx
 * <SharedAlertBox variant="red" icon={AlertCircle}>
 *   Payment is overdue. Please update your payment method.
 * </SharedAlertBox>
 * ```
 */
export function SharedAlertBox({
  children,
  variant = 'orange',
  icon: Icon,
  className,
}: Omit<SharedInfoBoxProps, 'title'>) {
  const variantClasses = infoBoxVariantMap[variant];

  return (
    <div className={cn('border rounded-lg p-4 flex items-start gap-3', variantClasses, className)}>
      {Icon && (
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-current opacity-70" />
        </div>
      )}
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}
