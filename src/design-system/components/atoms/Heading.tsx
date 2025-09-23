/**
 * CircleTel Design System - Heading Atom
 *
 * A semantic heading component that enforces proper HTML hierarchy
 * while providing flexible styling options.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('font-inter font-bold tracking-tight scroll-m-20', {
  variants: {
    level: {
      1: 'text-4xl lg:text-5xl',
      2: 'text-2xl lg:text-3xl',
      3: 'text-xl lg:text-2xl',
      4: 'text-lg lg:text-xl',
      5: 'text-base lg:text-lg',
      6: 'text-sm lg:text-base',
    },
    variant: {
      default: '',
      display: 'text-5xl lg:text-6xl',
      hero: 'text-3xl md:text-4xl lg:text-5xl',
      section: 'text-2xl md:text-3xl lg:text-4xl',
      subsection: 'text-xl md:text-2xl lg:text-3xl',
      card: 'text-lg font-semibold',
    },
    color: {
      primary: 'text-foreground',
      secondary: 'text-muted-foreground',
      accent: 'text-circleTel-orange',
      inverse: 'text-white',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    gradient: {
      none: '',
      primary: 'bg-gradient-to-r from-circleTel-orange to-orange-600 bg-clip-text text-transparent',
      brand: 'bg-gradient-to-r from-circleTel-orange via-orange-500 to-yellow-500 bg-clip-text text-transparent',
    }
  },
  defaultVariants: {
    level: 1,
    variant: 'default',
    color: 'primary',
    align: 'left',
    gradient: 'none',
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /** The heading level (1-6) - determines both HTML tag and default styling */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Override the visual style while maintaining semantic level */
  variant?: 'default' | 'display' | 'hero' | 'section' | 'subsection' | 'card';
  /** Additional CSS classes */
  className?: string;
  /** The heading content */
  children: React.ReactNode;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({
    level,
    variant,
    color,
    align,
    gradient,
    className,
    children,
    ...props
  }, ref) => {
    const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ level, variant, color, align, gradient }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';