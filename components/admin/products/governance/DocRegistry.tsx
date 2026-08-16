'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductDocStatus, ProductLineWithRelations } from '@/lib/types/product-lines';
import { PmButton } from '@/components/portal/modernist/PortalModernistShell';

const DOC_STATUSES: ProductDocStatus[] = ['missing', 'draft', 'current', 'stale'];

export function DocRegistry({
  line,
  busy,
  onSaved,
}: {
  line: ProductLineWithRelations;
  busy?: boolean;
  onSaved: () => Promise<void> | void;
}) {
  const [cpsPath, setCpsPath] = useState(line.cps_path ?? '');
  const [brdPath, setBrdPath] = useState(line.brd_path ?? '');
  const [fsdPath, setFsdPath] = useState(line.fsd_path ?? '');
  const [cpsStatus, setCpsStatus] = useState<ProductDocStatus>(line.cps_status);
  const [brdStatus, setBrdStatus] = useState<ProductDocStatus>(line.brd_status);
  const [fsdStatus, setFsdStatus] = useState<ProductDocStatus>(line.fsd_status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCpsPath(line.cps_path ?? '');
    setBrdPath(line.brd_path ?? '');
    setFsdPath(line.fsd_path ?? '');
    setCpsStatus(line.cps_status);
    setBrdStatus(line.brd_status);
    setFsdStatus(line.fsd_status);
  }, [line]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/product-lines/${line.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cps_path: cpsPath || null,
          brd_path: brdPath || null,
          fsd_path: fsdPath || null,
          cps_status: cpsStatus,
          brd_status: brdStatus,
          fsd_status: fsdStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <p
        className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: 'var(--pm-navy)' }}
      >
        Document registry (git paths under products/)
      </p>
      <DocPathRow
        label="CPS"
        version={line.cps_version}
        path={cpsPath}
        status={cpsStatus}
        onPath={setCpsPath}
        onStatus={setCpsStatus}
      />
      <DocPathRow
        label="BRD"
        version={line.brd_version}
        path={brdPath}
        status={brdStatus}
        onPath={setBrdPath}
        onStatus={setBrdStatus}
      />
      <DocPathRow
        label="FSD"
        version={line.fsd_version}
        path={fsdPath}
        status={fsdStatus}
        onPath={setFsdPath}
        onStatus={setFsdStatus}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <PmButton
        variant="secondary"
        className="min-h-9 px-3 py-1 text-xs"
        disabled={busy || saving}
        onClick={save}
      >
        {saving ? 'Saving…' : 'Save document links'}
      </PmButton>
    </div>
  );
}

function DocPathRow({
  label,
  version,
  path,
  status,
  onPath,
  onStatus,
}: {
  label: string;
  version?: string | null;
  path: string;
  status: ProductDocStatus;
  onPath: (v: string) => void;
  onStatus: (v: ProductDocStatus) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[3rem_1fr_8rem] md:items-center">
      <Label className="text-xs font-extrabold" style={{ color: 'var(--pm-navy)' }}>
        {label}
        {version ? (
          <span className="mt-0.5 block font-medium normal-case tracking-normal opacity-70">
            v{version}
          </span>
        ) : null}
      </Label>
      <Input
        value={path}
        onChange={(e) => onPath(e.target.value)}
        placeholder="products/…/*.md"
        className="h-8 text-xs"
      />
      <select
        className="h-8 rounded-md border px-2 text-xs"
        style={{ borderColor: 'var(--pm-divider)', color: 'var(--pm-navy)' }}
        value={status}
        onChange={(e) => onStatus(e.target.value as ProductDocStatus)}
      >
        {DOC_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
