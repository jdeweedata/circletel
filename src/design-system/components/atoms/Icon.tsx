/**
 * CircleTel Design System - Icon Atom
 *
 * A standardized icon component that wraps Lucide React icons
 * with consistent sizing, coloring, and accessibility features.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconography, type IconSize, type IconColor } from '@/design-system/foundations/iconography';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size of the icon using design system tokens */
  size?: IconSize;
  /** Color variant using design system tokens */
  color?: IconColor;
  /** Custom className for additional styling */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Whether the icon is decorative (hides from screen readers) */
  decorative?: boolean;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({
    icon: IconComponent,
    size = 'md',
    color = 'default',
    className,
    'aria-label': ariaLabel,
    decorative = false,
    ...props
  }, ref) => {
    const sizeClass = iconography.classes[size];
    const colorClass = iconography.colors[color];

    return (
      <IconComponent
        ref={ref}
        className={cn(sizeClass, colorClass, className)}
        aria-label={ariaLabel}
        aria-hidden={decorative}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';