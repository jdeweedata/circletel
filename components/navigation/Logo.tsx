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
      // Footer: larger for better visibility
      return `h-24 sm:h-28 md:h-32 lg:h-36 w-auto ${className}`;
    }
    // Navbar: Significantly increased size for better brand presence
    return `h-20 sm:h-24 md:h-28 lg:h-32 w-auto ${className}`;
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