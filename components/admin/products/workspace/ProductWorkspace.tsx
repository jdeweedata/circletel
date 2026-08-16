'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PiSquaresFourBold,
  PiTruckBold,
  PiHandshakeBold,
  PiChartLineBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  parseWorkspaceParams,
  type WorkspaceSection,
} from '@/lib/products/workspace-params';
import { UnifiedProductConsole } from '@/components/admin/products/unified/UnifiedProductConsole';
import { SuppliersSection } from './SuppliersSection';
import { MTNToolsSection } from './MTNToolsSection';
import { ProductGovernanceSection } from '@/components/admin/products/governance/ProductGovernanceSection';

const SECTIONS: Array<{ id: WorkspaceSection; label: string; icon: React.ReactNode }> = [
  { id: 'portfolio', label: 'Portfolio', icon: <PiChartLineBold className="h-4 w-4" /> },
  { id: 'catalogue', label: 'Catalogue', icon: <PiSquaresFourBold className="h-4 w-4" /> },
  { id: 'suppliers', label: 'Suppliers', icon: <PiTruckBold className="h-4 w-4" /> },
  { id: 'mtn-tools', label: 'MTN Tools', icon: <PiHandshakeBold className="h-4 w-4" /> },
];

/**
 * Product Workspace — single home for product management.
 * Left rail switches sections; the catalogue section is the unified console.
 * Tokens come from AdminLayoutClient (Unjani --pm-* / Archivo).
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
      <aside
        className="w-52 shrink-0 bg-white p-3"
        style={{ borderRight: '2px solid var(--pm-divider)' }}
      >
        <p
          className="px-2 pb-2 text-xs font-extrabold uppercase tracking-[0.08em]"
          style={{ color: 'var(--pm-navy)' }}
        >
          Product Workspace
        </p>
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => switchSection(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors'
                )}
                style={{
                  background: active ? 'var(--pm-navy)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--pm-navy)',
                  fontWeight: active ? 800 : 500,
                }}
              >
                {s.icon}
                {s.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        {section === 'portfolio' && <ProductGovernanceSection />}
        {section === 'catalogue' && <UnifiedProductConsole />}
        {section === 'suppliers' && <SuppliersSection />}
        {section === 'mtn-tools' && <MTNToolsSection />}
      </main>
    </div>
  );
}
