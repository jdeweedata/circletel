'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PiSquaresFourBold,
  PiTruckBold,
  PiHandshakeBold,
  PiChartLineBold,
} from 'react-icons/pi';
import {
  parseWorkspaceParams,
  type WorkspaceSection,
} from '@/lib/products/workspace-params';
import { UnifiedProductConsole } from '@/components/admin/products/unified/UnifiedProductConsole';
import { SuppliersSection } from './SuppliersSection';
import { MTNToolsSection } from './MTNToolsSection';
import { ProductGovernanceSection } from '@/components/admin/products/governance/ProductGovernanceSection';

const SECTIONS: Array<{ id: WorkspaceSection; label: string; icon: React.ReactNode }> = [
  { id: 'portfolio', label: 'Portfolio', icon: <PiChartLineBold className="h-3.5 w-3.5" /> },
  { id: 'catalogue', label: 'Catalogue', icon: <PiSquaresFourBold className="h-3.5 w-3.5" /> },
  { id: 'suppliers', label: 'Suppliers', icon: <PiTruckBold className="h-3.5 w-3.5" /> },
  { id: 'mtn-tools', label: 'MTN Tools', icon: <PiHandshakeBold className="h-3.5 w-3.5" /> },
];

/**
 * Product Workspace — single home for product management.
 * Section switcher is a Unjani-style ruled chip strip (not a nested sidebar).
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
    <div>
      <nav
        aria-label="Product workspace sections"
        className="px-6 pt-1 pb-4"
        style={{ borderBottom: '2px solid var(--pm-divider)' }}
      >
        <div
          className="inline-flex max-w-full flex-wrap overflow-x-auto"
          style={{ border: '2px solid var(--pm-divider)' }}
          role="tablist"
        >
          {SECTIONS.map((s, i) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${s.id}-panel`}
                id={`${s.id}-tab`}
                onClick={() => switchSection(s.id)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide"
                style={{
                  background: active ? 'var(--pm-navy)' : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--pm-navy)',
                  borderRight:
                    i < SECTIONS.length - 1 ? '1px solid var(--pm-divider)' : undefined,
                }}
              >
                {s.icon}
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div id={`${section}-panel`} role="tabpanel" aria-labelledby={`${section}-tab`}>
        {section === 'portfolio' && <ProductGovernanceSection />}
        {section === 'catalogue' && <UnifiedProductConsole />}
        {section === 'suppliers' && <SuppliersSection />}
        {section === 'mtn-tools' && <MTNToolsSection />}
      </div>
    </div>
  );
}
