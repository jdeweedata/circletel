'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AudienceSelector({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();
  const audiences = [
    { label: 'Personal', href: '/', active: pathname === '/' },
    {
      label: 'Business',
      href: '/business',
      active: pathname === '/business' || pathname.startsWith('/business/'),
    },
  ];

  return (
    <nav aria-label="Customer type" className="flex shrink-0 items-center gap-2">
        {audiences.map(({ label, href, active }) => (
          <Link
            key={href}
            href={href}
            onClick={onSelect}
            aria-current={active ? 'location' : undefined}
            className={cn(
              'inline-flex min-h-[44px] items-center justify-center rounded-lg border px-3 py-2 font-body text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy',
              active
                ? 'border-circleTel-orange bg-circleTel-orange text-circleTel-navy hover:underline underline-offset-4'
                : 'border-white/30 text-white hover:border-white/60 hover:bg-white/10'
            )}
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}
