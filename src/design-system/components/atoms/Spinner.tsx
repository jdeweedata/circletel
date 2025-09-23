/**
 * CircleTel Design System - Spinner Atom
 *
 * A loading spinner component with consistent styling and sizing options.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-solid border-t-transparent', {
  variants: {
    size: {
      xs: 'w-3 h-3 border',
      sm: 'w-4 h-4 border',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-2',
      xl: 'w-12 h-12 border-4',
    },
    color: {
      primary: 'border-circleTel-orange',
      secondary: 'border-muted-foreground',
      white: 'border-white',
      current: 'border-current',
    },
    speed: {
      slow: 'animate-spin [animation-duration:2s]',
      normal: 'animate-spin',
      fast: 'animate-spin [animation-duration:0.5s]',
    }
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
    speed: 'normal',
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Screen reader label */
  'aria-label'?: string;
  /** Additional CSS classes */
  className?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({
    size,
    color,
    speed,
    'aria-label': ariaLabel = 'Loading',
    className,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, color, speed }), className)}
        role="status"
        aria-label={ariaLabel}
        {...props}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';