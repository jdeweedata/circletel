/**
 * CircleTel Design System - Link Atom
 *
 * A standardized link component that handles both internal (React Router)
 * and external links with consistent styling and accessibility features.
 */

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

const linkVariants = cva('transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', {
  variants: {
    variant: {
      default: 'text-circleTel-orange hover:text-circleTel-orange/80 underline underline-offset-4',
      subtle: 'text-muted-foreground hover:text-circleTel-orange no-underline',
      button: 'inline-flex items-center justify-center rounded-md text-sm font-medium bg-circleTel-orange text-white hover:bg-circleTel-orange/90 h-10 px-4 py-2',
      ghost: 'text-foreground hover:text-circleTel-orange hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2',
      nav: 'text-sm font-medium text-muted-foreground hover:text-circleTel-orange',
      breadcrumb: 'text-sm text-muted-foreground hover:text-foreground',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    weight: 'normal',
  },
});

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof linkVariants> {
  /** The URL to link to */
  href: string;
  /** Whether to show external link icon */
  showExternalIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** The link content */
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({
    href,
    variant,
    size,
    weight,
    showExternalIcon,
    className,
    children,
    target,
    rel,
    ...props
  }, ref) => {
    // Determine if link is external
    const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:');

    // Set default target and rel for external links
    const linkTarget = target || (isExternal ? '_blank' : undefined);
    const linkRel = rel || (isExternal ? 'noopener noreferrer' : undefined);

    // Show external icon by default for external links unless explicitly disabled
    const shouldShowIcon = showExternalIcon ?? (isExternal && variant !== 'button');

    const linkClasses = cn(linkVariants({ variant, size, weight }), className);

    const linkContent = (
      <>
        {children}
        {shouldShowIcon && (
          <ExternalLink
            className="ml-1 w-3 h-3 inline-block"
            aria-hidden="true"
          />
        )}
      </>
    );

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          target={linkTarget}
          rel={linkRel}
          className={linkClasses}
          {...props}
        >
          {linkContent}
        </a>
      );
    }

    return (
      <RouterLink
        ref={ref as any}
        to={href}
        className={linkClasses}
        {...props}
      >
        {linkContent}
      </RouterLink>
    );
  }
);

Link.displayName = 'Link';