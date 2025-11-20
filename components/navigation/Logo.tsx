import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'navbar' | 'footer';
  className?: string;
}

export function Logo({ variant = 'navbar', className = '' }: LogoProps) {
  const getLogoClasses = () => {
    if (variant === 'footer') {
      // Footer: slightly larger for better visibility
      return `h-20 sm:h-24 md:h-28 w-auto ${className}`;
    }
    // Navbar: Larger logo for better visibility on desktop
    return `h-20 sm:h-24 md:h-32 lg:h-44 xl:h-52 w-auto ${className}`;
  };

  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image
        src="/images/circletel-enclosed-logo.png"
        alt="CircleTel Logo"
        className={getLogoClasses()}
        width={500}
        height={500}
        priority={variant === 'navbar'}
      />
    </Link>
  );
}