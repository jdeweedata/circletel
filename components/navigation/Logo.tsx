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
    // Navbar: matches circletel.co.za (120px on desktop, responsive on mobile)
    return `h-16 sm:h-20 md:h-24 lg:h-[120px] w-auto ${className}`;
  };

  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image
        src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png"
        alt="CircleTel Logo"
        className={getLogoClasses()}
        width={500}
        height={500}
        priority={variant === 'navbar'}
      />
    </Link>
  );
}