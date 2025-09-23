/**
 * CircleTel Design System - Text Atom
 *
 * A flexible text component that implements the design system's typography scale.
 * Supports semantic HTML elements with consistent styling.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      // Body text variants
      'body-large': 'text-lg leading-relaxed font-inter',
      'body-medium': 'text-base leading-normal font-inter',
      'body-small': 'text-sm leading-normal font-inter',

      // UI text variants
      'ui-large': 'text-base font-medium font-inter',
      'ui-medium': 'text-sm font-medium font-inter',
      'ui-small': 'text-xs font-medium font-inter',

      // Label variants
      'label-large': 'text-sm font-semibold font-inter uppercase tracking-wide',
      'label-medium': 'text-xs font-semibold font-inter uppercase tracking-wide',

      // Code variants
      'code-large': 'text-base font-space-mono leading-normal',
      'code-medium': 'text-sm font-space-mono leading-normal',
      'code-small': 'text-xs font-space-mono leading-normal',

      // Special variants
      'caption': 'text-xs text-muted-foreground font-inter',
      'overline': 'text-xs font-semibold font-inter uppercase tracking-wide',
    },
    color: {
      primary: 'text-foreground',
      secondary: 'text-muted-foreground',
      accent: 'text-circleTel-orange',
      inverse: 'text-white',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    truncate: {
      true: 'truncate',
      false: '',
    }
  },
  defaultVariants: {
    variant: 'body-medium',
    color: 'primary',
    weight: 'normal',
    align: 'left',
    truncate: false,
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  /** The HTML element to render */
  as?: 'p' | 'span' | 'div' | 'label' | 'small' | 'strong' | 'em' | 'code';
  /** Additional CSS classes */
  className?: string;
  /** The text content */
  children: React.ReactNode;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({
    as: Component = 'p',
    variant,
    color,
    weight,
    align,
    truncate,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn(textVariants({ variant, color, weight, align, truncate }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';