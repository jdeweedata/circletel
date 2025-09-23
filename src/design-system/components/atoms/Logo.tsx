/**
 * CircleTel Design System - Logo Atom
 *
 * The CircleTel logo component with standardized sizing and variants.
 * Supports both full logo and icon-only variants.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Link } from './Link';

const logoVariants = cva('inline-block', {
  variants: {
    size: {
      xs: 'h-6',       // 24px
      sm: 'h-8',       // 32px
      md: 'h-10',      // 40px
      lg: 'h-12',      // 48px
      xl: 'h-16',      // 64px
      '2xl': 'h-20',   // 80px
    },
    variant: {
      full: 'w-auto',     // Full logo with text
      icon: 'w-10 h-10',  // Icon only, square aspect
      wordmark: 'w-auto', // Text only, no icon
    },
    color: {
      default: '',
      white: 'brightness-0 invert',
      orange: 'sepia saturate-200 hue-rotate-15',
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'full',
    color: 'default',
  },
});

export interface LogoProps extends VariantProps<typeof logoVariants> {
  /** Whether the logo should link to homepage */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for the logo */
  alt?: string;
  /** Click handler for logo */
  onClick?: () => void;
}

export const Logo = React.forwardRef<HTMLElement, LogoProps>(
  ({
    size,
    variant,
    color,
    href = '/',
    className,
    alt = 'CircleTel',
    onClick,
    ...props
  }, ref) => {
    const logoClasses = cn(logoVariants({ size, variant, color }), className);

    // For now, we'll use a placeholder SVG. In a real implementation,
    // you would replace this with your actual logo SVG or image
    const LogoContent = () => (
      <svg
        className={logoClasses}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={alt}
      >
        {/* Circle icon */}
        <circle
          cx="30"
          cy="30"
          r="25"
          fill="#F5831F"
          stroke="#F5831F"
          strokeWidth="2"
        />

        {/* Tel/Communication symbol inside circle */}
        <path
          d="M20 20 L25 25 L30 20 M35 25 L40 20 M25 35 L30 40 L35 35"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Text - only show for full and wordmark variants */}
        {(variant === 'full' || variant === 'wordmark') && (
          <>
            <text
              x="70"
              y="25"
              className="font-inter font-bold text-lg fill-current"
              fill="#1F2937"
            >
              Circle
            </text>
            <text
              x="70"
              y="45"
              className="font-inter font-bold text-lg fill-current"
              fill="#F5831F"
            >
              Tel
            </text>
          </>
        )}
      </svg>
    );

    if (href && !onClick) {
      return (
        <Link
          ref={ref as any}
          href={href}
          variant="ghost"
          className="p-0 h-auto hover:bg-transparent focus:ring-offset-0"
          {...props}
        >
          <LogoContent />
        </Link>
      );
    }

    return (
      <button
        ref={ref as any}
        onClick={onClick}
        className="inline-block p-0 border-none bg-transparent hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
        {...props}
      >
        <LogoContent />
      </button>
    );
  }
);

Logo.displayName = 'Logo';