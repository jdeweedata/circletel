'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PiWarningBold } from 'react-icons/pi';
import { TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductDocStatus, ProductLineWithRelations } from '@/lib/types/product-lines';
import { PublishReadinessChecklist } from '@/components/admin/products/shared/PublishReadinessChecklist';
import { evaluateDraftToActive, isSalesQuotePackLine } from '@/lib/products/product-line-gates';
import { AdminPage, EmptyState, ErrorState, LoadingState } from '@/components/backend';
import {
  FilterChips,
  KpiStrip,
  PageHeader as PortalPageHeader,
  PmButton,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';

const TABS = [
  { value: 'exec', label: 'Exec' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
] as const;

const DOC_STATUSES: ProductDocStatus[] = ['missing', 'draft', 'current', 'stale'];

const CARD =
  'rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.06]';

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

function PmLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-extrabold"
      style={
        variant === 'primary'
          ? { background: 'var(--pm-accent)', color: 'var(--pm-navy)' }
          : {
              background: '#FFFFFF',
              color: 'var(--pm-navy)',
              border: '1px solid #E5E7EB',
            }
      }
    >
      {children}
    </Link>
  );
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

  const liveMrr = useMemo(
    () => lines.reduce((sum, line) => sum + (line.live_mrr_zar ?? 0), 0),
    [lines]
  );
  const gate1Count = useMemo(
    () => lines.filter((line) => line.gate1_eligible).length,
    [lines]
  );
  const docsMissing = useMemo(
    () =>
      lines.filter(
        (line) =>
          line.cps_status === 'missing' ||
          line.brd_status === 'missing' ||
          line.fsd_status === 'missing'
      ).length,
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
    return (
      <AdminPage>
        <LoadingState message="Loading portfolio…" />
      </AdminPage>
    );
  }
  if (error) {
    return (
      <AdminPage>
        <ErrorState title="Failed to load portfolio" message={error} onRetry={load} />
      </AdminPage>
    );
  }

  return (
    <AdminPage className="p-6">
      <PortalPageHeader
        eyebrow="Product Workspace"
        title="Product portfolio"
        subtitle="Roadmap lines for exec, sales, and finance. CPS/BRD/FSD stay in git; this record is the system of record."
      />

      <KpiStrip
        variant="cards"
        items={[
          {
            label: 'Product lines',
            value: String(lines.length),
            accent: '#13274A',
          },
          {
            label: 'Gate 1 eligible',
            value: String(gate1Count),
            note: 'Ready to sell',
            accent: '#2F9E5E',
            valueColor: '#2F9E5E',
          },
          {
            label: 'Live billed MRR',
            value: zar(liveMrr),
            accent: '#13274A',
          },
          {
            label: 'Docs missing',
            value: String(docsMissing),
            note: 'CPS / BRD / FSD',
            accent: docsMissing > 0 ? '#F5841E' : '#13274A',
            valueColor: docsMissing > 0 ? '#F5841E' : undefined,
          },
        ]}
      />

      <div className="mt-6">
        <FilterChips
          options={TABS.map((t) => ({ value: t.value, label: t.label }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {actionError && <p className="text-sm text-red-700">{actionError}</p>}

      <TabPanel id="exec" activeTab={tab}>
        {lines.length === 0 ? (
          <EmptyState
            icon={<PiWarningBold />}
            title="No product lines yet"
            description="Seed product_lines to populate the portfolio."
          />
        ) : (
          <RuledTable headers={['Line', 'Lifecycle', 'Gate 1', 'Sellability', 'Live MRR', 'List ARPU', 'Docs']}>
            {lines.map((line) => (
              <tr
                key={line.id}
                className="cursor-pointer hover:bg-[color-mix(in_srgb,#13274A_4%,#FFFFFF)]"
                style={{ borderBottom: '1px solid var(--pm-divider)' }}
                onClick={() => setSelected(line)}
              >
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
                  {line.name}
                </td>
                <td className="px-4 py-3">{statusBadge(line.lifecycle_stage)}</td>
                <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                  {line.gate1_eligible ? 'Yes' : 'No'}
                </td>
                <td className="px-4 py-3">{statusBadge(line.sellability)}</td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                  {zar(line.live_mrr_zar)}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                  {zar(line.list_arpu_zar)}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--pm-body)' }}>
                  CPS {line.cps_status} · BRD {line.brd_status} · FSD {line.fsd_status}
                </td>
              </tr>
            ))}
          </RuledTable>
        )}
      </TabPanel>

      <TabPanel id="sales" activeTab={tab}>
        <div className="mb-4 flex flex-wrap gap-2">
          <PmLink href="/admin/quotes/bundles/new?template=circleconnect-5g-essential">
            Compose CircleConnect 5G
          </PmLink>
          <PmLink href="/admin/quotes/bundles/new?template=otg" variant="secondary">
            Compose OTG
          </PmLink>
          <PmLink href="/admin/quotes/new" variant="secondary">
            Simple quote (SkyFibre / BizFibre)
          </PmLink>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {salesLines.map((line) => (
            <div key={line.id} className={CARD}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                  {line.name}
                </h3>
                {statusBadge(line.sellability)}
              </div>
              <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                {line.channel} · {line.revenue_model}
                {line.revenue_model === 'dealer_commission' ? ' (cash, not MRR)' : ''}
              </p>
              {line.price_drift_notes && (
                <p className="mt-2 flex items-start gap-1 text-xs text-amber-800">
                  <PiWarningBold className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {line.price_drift_notes}
                </p>
              )}
              <p className="mt-2 text-sm" style={{ color: 'var(--pm-body)' }}>
                {line.notes}
              </p>
              <p className="mt-2 text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                {line.list_arpu_incl_vat_zar
                  ? `${zar(line.list_arpu_incl_vat_zar)} incl VAT`
                  : 'Price on deal'}
              </p>
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel id="finance" activeTab={tab}>
        <RuledTable
          headers={['Line', 'Revenue', 'ARPU excl', 'Live billed', 'Floor', 'MSC', 'Finance', 'Actions']}
        >
          {lines.map((line) => (
            <tr
              key={line.id}
              style={{ borderBottom: '1px solid var(--pm-divider)' }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
                {line.name}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {line.revenue_model}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                {zar(line.list_arpu_zar)}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                {zar(line.live_mrr_zar)}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {line.min_margin_pct}%
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {line.msc_flag ? 'Yes' : 'No'}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {line.finance_approved_at ? 'Approved' : 'Pending'}
              </td>
              <td className="px-4 py-3 text-right">
                {!line.finance_approved_at && (
                  <PmButton
                    variant="secondary"
                    className="min-h-9 px-3 py-1 text-xs"
                    disabled={busy}
                    onClick={() => approve(line.id)}
                  >
                    Approve
                  </PmButton>
                )}
                {line.lifecycle_stage === 'draft' && (
                  <PmButton
                    className="ml-2 min-h-9 px-3 py-1 text-xs"
                    disabled={busy}
                    onClick={() => activate(line.id)}
                  >
                    Activate
                  </PmButton>
                )}
              </td>
            </tr>
          ))}
        </RuledTable>
      </TabPanel>

      {selected && (
        <div className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                {selected.name}
              </h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                {selected.code}
              </p>
            </div>
            <PmButton variant="ghost" className="min-h-9 px-3 py-1 text-xs" onClick={() => setSelected(null)}>
              Close
            </PmButton>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--pm-body)' }}>
            {selected.notes}
          </p>
          <DocRegistry line={selected} busy={busy} onSaved={load} />
          <div className="mt-4">
            <PublishReadinessChecklist items={evaluateDraftToActive(selected).items} />
          </div>
        </div>
      )}
    </AdminPage>
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
      <p
        className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: 'var(--pm-navy)' }}
      >
        Document registry (git paths under products/)
      </p>
      <DocPathRow label="CPS" path={cpsPath} status={cpsStatus} onPath={setCpsPath} onStatus={setCpsStatus} />
      <DocPathRow label="BRD" path={brdPath} status={brdStatus} onPath={setBrdPath} onStatus={setBrdStatus} />
      <DocPathRow label="FSD" path={fsdPath} status={fsdStatus} onPath={setFsdPath} onStatus={setFsdStatus} />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <PmButton variant="secondary" className="min-h-9 px-3 py-1 text-xs" disabled={busy || saving} onClick={save}>
        {saving ? 'Saving…' : 'Save document links'}
      </PmButton>
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
      <Label className="text-xs font-extrabold" style={{ color: 'var(--pm-navy)' }}>
        {label}
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
