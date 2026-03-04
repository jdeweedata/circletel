'use client';
import { PiArrowRightBold } from 'react-icons/pi';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { urlFor } from '@/lib/sanity/image';

interface HeroBlockProps {
  headline: string;
  subheadline?: string;
  backgroundImage?: any;
  cta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  alignment?: 'left' | 'center' | 'right';
  overlay?: boolean;
}

export function HeroBlock({
  headline,
  subheadline,
  backgroundImage,
  cta,
  alignment = 'center',
  overlay = true,
}: HeroBlockProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      {backgroundImage?.asset && (
        <>
          <Image
            src={urlFor(backgroundImage).width(1920).quality(85).url()}
            alt={backgroundImage.alt || ''}
            fill
            className="object-cover"
            priority
          />
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-b from-circleTel-navy/80 to-circleTel-navy/60" />
          )}
        </>
      )}

      {/* Fallback gradient background */}
      {!backgroundImage?.asset && (
        <div className="absolute inset-0 bg-gradient-to-br from-circleTel-navy via-circleTel-navy to-circleTel-navy/95" />
      )}

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 py-16 md:py-24 flex flex-col ${alignmentClasses[alignment]}`}>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-4xl">
          {headline}
        </h1>

        {subheadline && (
          <p className="font-body text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
            {subheadline}
          </p>
        )}

        {cta && (
          <Button
            asChild
            size="lg"
            variant={cta.variant === 'outline' ? 'outline' : 'default'}
            className={
              cta.variant === 'outline'
                ? 'border-white text-white hover:bg-white hover:text-circleTel-navy'
                : 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
            }
          >
            <Link href={cta.href}>
              {cta.label}
              <PiArrowRightBold className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
