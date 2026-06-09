import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'navbar' | 'footer';
  className?: string;
}

export function Logo({ variant = 'navbar', className = '' }: LogoProps) {
  const logoSrc =
    variant === 'navbar'
      ? '/images/circletel-logo-white.png'
      : '/images/circletel-enclosed-logo.png';

  const getLogoClasses = () => {
    if (variant === 'footer') {
      // Footer: larger for better visibility
      return `h-24 sm:h-28 md:h-32 lg:h-36 w-auto ${className}`;
    }
    return `h-14 sm:h-16 lg:h-20 w-auto ${className}`;
  };

  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image
        src={logoSrc}
        alt="CircleTel Logo"
        className={getLogoClasses()}
        width={500}
        height={500}
        priority={variant === 'navbar'}
      />
    </Link>
  );
}
