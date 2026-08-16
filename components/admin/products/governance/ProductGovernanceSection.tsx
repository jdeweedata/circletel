'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PiWarningBold } from 'react-icons/pi';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductDocStatus, ProductLineWithRelations } from '@/lib/types/product-lines';
import { PublishReadinessChecklist } from '@/components/admin/products/shared/PublishReadinessChecklist';
import { evaluateDraftToActive, isSalesQuotePackLine } from '@/lib/products/product-line-gates';

const TABS = [
  { id: 'exec', label: 'Exec' },
  { id: 'sales', label: 'Sales' },
  { id: 'finance', label: 'Finance' },
] as const;

const DOC_STATUSES: ProductDocStatus[] = ['missing', 'draft', 'current', 'stale'];

function zar(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n);
}

function statusBadge(value: string) {
  const tone =
    value === 'active' || value === 'current' || value === 'sell_now'
      ? 'bg-emerald-50 text-emerald-700'
      : value === 'missing' || value === 'not_gate_1' || value === 'stale'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-slate-100 text-slate-700';
  return <Badge className={tone}>{value}</Badge>;
}

export function ProductGovernanceSection() {
  const [tab, setTab] = useState('exec');
  const [lines, setLines] = useState<ProductLineWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductLineWithRelations | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/product-lines');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setLines(data.lines);
      setSelected((prev) =>
        prev ? data.lines.find((l: ProductLineWithRelations) => l.id === prev.id) ?? prev : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const salesLines = useMemo(
    () => lines.filter(isSalesQuotePackLine),
    [lines]
  );

  async function approve(id: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/product-lines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finance_approve: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approve failed');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/product-lines/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'active' }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.gate?.items?.find((i: { ok: boolean }) => !i.ok)?.detail;
        throw new Error(data.error || detail || 'Transition blocked');
      }
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Transition blocked');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-ui-text-muted">Loading portfolio…</div>;
  }
  if (error) {
    return (
      <div className="p-8 text-sm text-red-700">
        {error}{' '}
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ui-text-primary">Product portfolio</h1>
        <p className="text-sm text-ui-text-muted">
          Roadmap lines for exec, sales, and finance. CPS/BRD/FSD stay in git; this record is the system of record.
        </p>
      </div>

      <UnderlineTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {actionError && <p className="text-sm text-red-700">{actionError}</p>}

      <TabPanel id="exec" activeTab={tab}>
        <div className="overflow-x-auto rounded-lg border border-ui-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-ui-text-muted">
              <tr>
                <th className="p-3">Line</th>
                <th className="p-3">Lifecycle</th>
                <th className="p-3">Gate 1</th>
                <th className="p-3">Sellability</th>
                <th className="p-3">Live MRR</th>
                <th className="p-3">List ARPU</th>
                <th className="p-3">Docs</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-t border-ui-border cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelected(line)}
                >
                  <td className="p-3 font-medium">{line.name}</td>
                  <td className="p-3">{statusBadge(line.lifecycle_stage)}</td>
                  <td className="p-3">{line.gate1_eligible ? 'Yes' : 'No'}</td>
                  <td className="p-3">{statusBadge(line.sellability)}</td>
                  <td className="p-3">{zar(line.live_mrr_zar)}</td>
                  <td className="p-3">{zar(line.list_arpu_zar)}</td>
                  <td className="p-3">
                    CPS {line.cps_status} · BRD {line.brd_status} · FSD {line.fsd_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel id="sales" activeTab={tab}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/quotes/bundles/new?template=circleconnect-5g-essential">
              Compose CircleConnect 5G
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/quotes/bundles/new?template=otg">Compose OTG</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/quotes/new">Simple quote (SkyFibre / BizFibre)</Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {salesLines.map((line) => (
            <div key={line.id} className="rounded-lg border border-ui-border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{line.name}</h3>
                {statusBadge(line.sellability)}
              </div>
              <p className="mt-1 text-xs text-ui-text-muted">
                {line.channel} · {line.revenue_model}
                {line.revenue_model === 'dealer_commission' ? ' (cash, not MRR)' : ''}
              </p>
              {line.price_drift_notes && (
                <p className="mt-2 flex items-start gap-1 text-xs text-amber-800">
                  <PiWarningBold className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {line.price_drift_notes}
                </p>
              )}
              <p className="mt-2 text-sm">{line.notes}</p>
              <p className="mt-2 text-sm font-medium">
                {line.list_arpu_incl_vat_zar
                  ? `${zar(line.list_arpu_incl_vat_zar)} incl VAT`
                  : 'Price on deal'}
              </p>
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel id="finance" activeTab={tab}>
        <div className="overflow-x-auto rounded-lg border border-ui-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-ui-text-muted">
              <tr>
                <th className="p-3">Line</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">ARPU excl</th>
                <th className="p-3">Live billed</th>
                <th className="p-3">Floor</th>
                <th className="p-3">MSC</th>
                <th className="p-3">Finance</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-ui-border">
                  <td className="p-3 font-medium">{line.name}</td>
                  <td className="p-3">{line.revenue_model}</td>
                  <td className="p-3">{zar(line.list_arpu_zar)}</td>
                  <td className="p-3">{zar(line.live_mrr_zar)}</td>
                  <td className="p-3">{line.min_margin_pct}%</td>
                  <td className="p-3">{line.msc_flag ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    {line.finance_approved_at ? 'Approved' : 'Pending'}
                  </td>
                  <td className="p-3 text-right">
                    {!line.finance_approved_at && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => approve(line.id)}>
                        Approve
                      </Button>
                    )}
                    {line.lifecycle_stage === 'draft' && (
                      <Button
                        size="sm"
                        className="ml-2"
                        disabled={busy}
                        onClick={() => activate(line.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabPanel>

      {selected && (
        <div className="rounded-lg border border-ui-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <p className="text-sm text-ui-text-muted">{selected.code}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <p className="mt-2 text-sm">{selected.notes}</p>
          <DocRegistry line={selected} busy={busy} onSaved={load} />
          <div className="mt-4">
            <PublishReadinessChecklist items={evaluateDraftToActive(selected).items} />
          </div>
        </div>
      )}
    </div>
  );
}

function DocRegistry({
  line,
  busy,
  onSaved,
}: {
  line: ProductLineWithRelations;
  busy: boolean;
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
      <p className="text-xs font-semibold uppercase tracking-wide text-ui-text-muted">
        Document registry (git paths under products/)
      </p>
      <DocPathRow label="CPS" path={cpsPath} status={cpsStatus} onPath={setCpsPath} onStatus={setCpsStatus} />
      <DocPathRow label="BRD" path={brdPath} status={brdStatus} onPath={setBrdPath} onStatus={setBrdStatus} />
      <DocPathRow label="FSD" path={fsdPath} status={fsdStatus} onPath={setFsdPath} onStatus={setFsdStatus} />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <Button size="sm" variant="outline" disabled={busy || saving} onClick={save}>
        {saving ? 'Saving…' : 'Save document links'}
      </Button>
    </div>
  );
}

function DocPathRow({
  label,
  path,
  status,
  onPath,
  onStatus,
}: {
  label: string;
  path: string;
  status: ProductDocStatus;
  onPath: (v: string) => void;
  onStatus: (v: ProductDocStatus) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[3rem_1fr_8rem] md:items-center">
      <Label className="text-xs">{label}</Label>
      <Input
        value={path}
        onChange={(e) => onPath(e.target.value)}
        placeholder="products/…/*.md"
        className="h-8 text-xs"
      />
      <select
        className="h-8 rounded-md border border-ui-border px-2 text-xs"
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
