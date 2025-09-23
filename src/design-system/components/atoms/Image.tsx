/**
 * CircleTel Design System - Image Atom
 *
 * A standardized image component with built-in loading states,
 * error handling, and responsive behavior.
 */

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

const imageVariants = cva('overflow-hidden', {
  variants: {
    variant: {
      default: '',
      avatar: 'rounded-full',
      rounded: 'rounded-lg',
      square: 'aspect-square object-cover',
      hero: 'w-full h-64 sm:h-80 lg:h-96 object-cover',
      card: 'w-full h-48 object-cover',
      thumbnail: 'w-16 h-16 object-cover rounded-md',
    },
    objectFit: {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
      'scale-down': 'object-scale-down',
      none: 'object-none',
    },
    loading: {
      lazy: '',
      eager: '',
    }
  },
  defaultVariants: {
    variant: 'default',
    objectFit: 'cover',
    loading: 'lazy',
  },
});

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'>,
    VariantProps<typeof imageVariants> {
  /** The image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Fallback image URL if main image fails to load */
  fallbackSrc?: string;
  /** Show loading skeleton while image loads */
  showSkeleton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom placeholder component */
  placeholder?: React.ReactNode;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({
    src,
    alt,
    variant,
    objectFit,
    loading = 'lazy',
    fallbackSrc,
    showSkeleton = true,
    className,
    placeholder,
    onLoad,
    onError,
    ...props
  }, ref) => {
    const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleLoad = () => {
      setImageState('loaded');
      onLoad?.();
    };

    const handleError = () => {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      } else {
        setImageState('error');
        onError?.();
      }
    };

    const imageClasses = cn(
      imageVariants({ variant, objectFit }),
      imageState === 'loading' && showSkeleton && 'bg-muted animate-pulse',
      imageState === 'error' && 'bg-muted',
      className
    );

    if (imageState === 'error') {
      return (
        <div className={imageClasses}>
          {placeholder || (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={currentSrc}
        alt={alt}
        loading={loading}
        className={imageClasses}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }
);

Image.displayName = 'Image';