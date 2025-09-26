import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png"
        alt="CircleTel Logo"
        className="h-[80px] sm:h-[100px] md:h-[120px] w-auto"
        width={500}
        height={500}
        priority
      />
    </Link>
  );
}