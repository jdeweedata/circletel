'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[];
  current: string;
}

export function PrototypeSwitcher({ variants, current }: PrototypeSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentIndex = variants.findIndex((v) => v.key === current);
  const currentVariant = variants[currentIndex];

  const navigate = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('variant', key);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const prev = () => {
    const idx = (currentIndex - 1 + variants.length) % variants.length;
    navigate(variants[idx].key);
  };

  const next = () => {
    const idx = (currentIndex + 1) % variants.length;
    navigate(variants[idx].key);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-full bg-gray-900 px-5 py-3 text-white shadow-2xl border border-gray-700">
      <button onClick={prev} className="hover:bg-gray-700 rounded-full p-1.5 transition-colors" aria-label="Previous variant">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <span className="text-sm font-medium min-w-[200px] text-center">
        {currentVariant?.key} &mdash; {currentVariant?.name}
      </span>
      <button onClick={next} className="hover:bg-gray-700 rounded-full p-1.5 transition-colors" aria-label="Next variant">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <span className="text-xs text-gray-400 ml-2">← → to switch</span>
    </div>
  );
}
