import type { ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type ShopCtaVariant = 'primary' | 'outline-navy' | 'outline-white';

interface ShopCtaProps {
  href: string;
  children: ReactNode;
  variant?: ShopCtaVariant;
  className?: string;
}

const variantClass: Record<ShopCtaVariant, string> = {
  primary:
    'bg-circleTel-orange text-white hover:bg-circleTel-orange-dark',
  'outline-navy':
    'border-2 border-circleTel-navy bg-transparent text-circleTel-navy hover:bg-circleTel-navy hover:text-white',
  'outline-white':
    'border-2 border-white bg-transparent text-white hover:bg-white hover:text-circleTel-navy',
};

export function ShopCta({
  href,
  children,
  variant = 'primary',
  className,
}: ShopCtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2',
        variantClass[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
