'use client';

/** PROTOTYPE — throwaway. Floating variant switcher for ticket #688. */

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';

export const PROTO_VARIANTS = [
  { key: 'A', name: 'Split workbench' },
  { key: 'B', name: 'Report-first' },
  { key: 'C', name: 'Tabbed console' },
] as const;

export type ProtoVariantKey = (typeof PROTO_VARIANTS)[number]['key'];

interface PrototypeSwitcherProps {
  current: string;
  /** Defaults to the page-composition variants (#688). */
  variants?: ReadonlyArray<{ key: string; name: string }>;
  /** Search param the switcher writes. */
  param?: string;
}

export function PrototypeSwitcher({
  current,
  variants = PROTO_VARIANTS,
  param = 'variant',
}: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const cycle = useCallback(
    (step: number) => {
      const index = variants.findIndex((variant) => variant.key === current);
      const next = variants[(index + step + variants.length) % variants.length];
      router.replace(`${pathname}?${param}=${next.key}`);
    },
    [current, param, pathname, router, variants]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle]);

  if (process.env.NODE_ENV === 'production') return null;

  const active = variants.find((variant) => variant.key === current);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1.5 text-white shadow-2xl ring-1 ring-white/10">
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous variant"
          className="rounded-full p-2 hover:bg-white/10"
        >
          <PiCaretLeftBold className="h-4 w-4" />
        </button>
        <span className="px-3 text-sm font-medium tabular-nums">
          {current} — {active?.name}
        </span>
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next variant"
          className="rounded-full p-2 hover:bg-white/10"
        >
          <PiCaretRightBold className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        prototype · ← → to switch · fixture data
      </p>
    </div>
  );
}
