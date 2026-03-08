'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DraftModeIndicator() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span className="font-medium text-sm">Preview Mode</span>
      </div>
      <Link
        href={`/api/sanity/disable-draft?redirect=${encodeURIComponent(pathname)}`}
        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
      >
        Exit
      </Link>
    </div>
  );
}
