'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  FilterChips,
  PageHeader as PortalPageHeader,
  PmButton,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';
import { FLYER_CHIP_LABEL, FLYER_CHIP_TONE } from './flyer-copy';
import type { FlyerChip } from '@/lib/products/bundle-template-service';

interface FlyerRow {
  code: string;
  name: string;
  billedInclVat: number;
  chip: FlyerChip;
  published: { billedInclVat: number } | null;
}

const FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'working', label: 'Working on it' },
  { value: 'waiting', label: 'Waiting on finance' },
  { value: 'ready', label: 'Ready to sell' },
  { value: 'price_change', label: 'Price change' },
];

export function BundleTemplateList() {
  const router = useRouter();
  const [rows, setRows] = useState<FlyerRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/bundle-templates');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not load flyers');
        return;
      }
      setRows(
        (data.templates || []).map((t: FlyerRow) => ({
          code: t.code,
          name: t.name,
          billedInclVat: t.billedInclVat,
          chip: t.chip,
          published: t.published,
        }))
      );
    })();
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.chip === filter)),
    [rows, filter]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PortalPageHeader
        eyebrow="Sales"
        title="Flyers"
        subtitle="Reusable deals sales can quote. Finance signs the numbers before anything goes live."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
        <div className="flex gap-2">
          <PmButton variant="secondary" onClick={() => router.push('/admin/quotes/bundles/new')}>
            Build a quote
          </PmButton>
          <PmButton onClick={() => router.push('/admin/quotes/bundles/templates/new')}>
            New flyer
          </PmButton>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <RuledTable headers={['Flyer', 'Customer pays', 'Status', '']}>
        {visible.map((row) => (
          <tr key={row.code} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
            <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
              {row.name}
              {row.chip === 'waiting' && (
                <p className="text-xs font-normal text-amber-800">Numbers not signed off yet.</p>
              )}
            </td>
            <td className="px-4 py-3 tabular-nums">
              R{Number(row.billedInclVat || 0).toFixed(0)} incl. VAT
            </td>
            <td className="px-4 py-3">
              <Badge className={FLYER_CHIP_TONE[row.chip]}>{FLYER_CHIP_LABEL[row.chip]}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <PmButton
                variant="secondary"
                onClick={() => router.push(`/admin/quotes/bundles/templates/${row.code}`)}
              >
                Edit
              </PmButton>
            </td>
          </tr>
        ))}
      </RuledTable>
    </div>
  );
}
