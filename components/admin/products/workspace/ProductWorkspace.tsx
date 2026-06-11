'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PiSquaresFourBold,
  PiTruckBold,
  PiHandshakeBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  parseWorkspaceParams,
  type WorkspaceSection,
} from '@/lib/products/workspace-params';
import { UnifiedProductConsole } from '@/components/admin/products/unified/UnifiedProductConsole';
import { SuppliersSection } from './SuppliersSection';
import { MTNToolsSection } from './MTNToolsSection';

const SECTIONS: Array<{ id: WorkspaceSection; label: string; icon: React.ReactNode }> = [
  { id: 'catalogue', label: 'Catalogue', icon: <PiSquaresFourBold className="h-4 w-4" /> },
  { id: 'suppliers', label: 'Suppliers', icon: <PiTruckBold className="h-4 w-4" /> },
  { id: 'mtn-tools', label: 'MTN Tools', icon: <PiHandshakeBold className="h-4 w-4" /> },
];

/**
 * Product Workspace — single home for product management.
 * Left rail switches sections; the catalogue section is the unified console.
 */
export function ProductWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSection = useMemo(
    () => parseWorkspaceParams(new URLSearchParams(searchParams.toString())).section,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [section, setSection] = useState<WorkspaceSection>(initialSection);

  const switchSection = (next: WorkspaceSection) => {
    setSection(next);
    // Section changes reset filter params — each section owns its own state.
    router.replace(next === 'catalogue' ? pathname : `${pathname}?section=${next}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-52 shrink-0 border-r border-ui-border bg-white p-3">
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-ui-text-muted">
          Product Workspace
        </p>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => switchSection(s.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                section === s.id
                  ? 'bg-circleTel-orange/10 text-circleTel-orange'
                  : 'text-ui-text-secondary hover:bg-slate-50'
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        {section === 'catalogue' && <UnifiedProductConsole />}
        {section === 'suppliers' && <SuppliersSection />}
        {section === 'mtn-tools' && <MTNToolsSection />}
      </main>
    </div>
  );
}
