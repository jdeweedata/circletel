'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PiArrowLeftBold, PiFileTextBold } from 'react-icons/pi';
import { AdminPage, EmptyState, ErrorState, LoadingState } from '@/components/backend';
import {
  FilterChips,
  KpiStrip,
  PageHeader as PortalPageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatPrice } from '@/lib/types/products';
import type { UnifiedProduct } from '@/lib/types/unified-product';
import type { ProductLineWithRelations } from '@/lib/types/product-lines';
import { rulesEngine, type ProductRuleEvaluation, type RuleConfig } from '@/lib/products/rules';
import {
  MarginBar,
  ProductSourceChip,
  PublishReadinessChecklist,
  RuleHealthBadge,
  RuleLevelBadge,
  type ChecklistItem,
} from '@/components/admin/products/shared';
import { RelationshipsPanel } from './RelationshipsPanel';
import { ProductEditDrawer } from './ProductEditDrawer';
import { DocRegistry } from '@/components/admin/products/governance/DocRegistry';

type DetailTab = 'overview' | 'pricing' | 'docs' | 'rules';

const TABS: Array<{ value: DetailTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'docs', label: 'Docs' },
  { value: 'rules', label: 'Rules' },
];

const CARD = 'rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.06]';

function zar(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function UnifiedProductDetailPage({
  sourceTable,
  id,
}: {
  sourceTable: string;
  id: string;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<UnifiedProduct | null>(null);
  const [line, setLine] = useState<ProductLineWithRelations | null>(null);
  const [showCosts, setShowCosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [editing, setEditing] = useState<UnifiedProduct | null>(null);
  const [ruleConfig, setRuleConfig] = useState<Partial<RuleConfig>>({});
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ source_table: sourceTable, id });
      const res = await fetch(`/api/admin/products/unified/item?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load product');
      setProduct(data.product);
      setLine(data.line ?? null);
      setShowCosts(Boolean(data.show_costs));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [sourceTable, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadRuleConfig = async () => {
      try {
        const res = await fetch('/api/admin/products/rules-config');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.config) setRuleConfig(json.config);
      } catch {
        // Keep engine defaults if the config endpoint is unavailable.
      }
    };
    loadRuleConfig();
  }, []);

  const evaluation = useMemo<ProductRuleEvaluation | null>(
    () => (product ? rulesEngine.evaluateProduct(product, ruleConfig) : null),
    [product, ruleConfig]
  );

  const canPublish = product?.publishTarget === 'service_packages';
  const blocked = evaluation?.blocked ?? false;
  const blockerTitle = blocked
    ? `Blocked: ${evaluation?.results.filter((r) => r.level === 'fail').map((r) => r.ruleName).join(', ')}`
    : undefined;

  async function handlePublish() {
    if (!product) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const reason =
          data.blockers?.map((b: { message: string }) => b.message).join('; ') ||
          data.errors?.join('; ') ||
          data.error ||
          `Failed (${res.status})`;
        setPublishMsg({ ok: false, text: reason });
      } else {
        setPublishMsg({ ok: true, text: 'Published to the catalogue.' });
        await load();
      }
    } catch (err) {
      setPublishMsg({ ok: false, text: err instanceof Error ? err.message : 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading product…" />
      </AdminPage>
    );
  }

  if (error || !product) {
    return (
      <AdminPage>
        <ErrorState title="Product not found" message={error ?? undefined} onRetry={load} />
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm font-extrabold"
          style={{ color: 'var(--pm-navy)' }}
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back to catalogue
        </Link>
      </AdminPage>
    );
  }

  const kpiItems = [
    { label: 'Retail', value: formatPrice(product.price) },
    { label: 'Cost', value: showCosts ? formatPrice(product.cost) : '—' },
    { label: 'Margin', value: showCosts ? `${product.margin}%` : '—' },
    ...(line
      ? [
          { label: 'List ARPU', value: zar(line.list_arpu_zar) },
          { label: 'Live billed MRR', value: zar(line.live_mrr_zar) },
        ]
      : []),
  ];

  return (
    <AdminPage>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide"
        style={{ color: 'var(--pm-navy)' }}
      >
        <PiArrowLeftBold className="h-3.5 w-3.5" />
        Catalogue
      </Link>

      <PortalPageHeader
        eyebrow={`${product.source} · ${product.sku ?? product.id}`}
        title={product.name}
        subtitle={`${product.type}${product.technology ? ` · ${product.technology}` : ''} · ${product.status}`}
        actions={
          <>
            <ProductSourceChip source={product.source} />
            {evaluation && <RuleHealthBadge summary={evaluation.summary} />}
            {product.sourceTable === 'admin_products' ? (
              <PmButton variant="secondary" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                Edit
              </PmButton>
            ) : (
              <PmButton variant="secondary" onClick={() => setEditing(product)}>
                Edit
              </PmButton>
            )}
            {canPublish && (
              <PmButton
                disabled={blocked || publishing}
                title={blockerTitle}
                onClick={handlePublish}
              >
                {publishing ? 'Publishing…' : blocked ? 'Blocked by rules' : 'Publish'}
              </PmButton>
            )}
          </>
        }
      />

      {publishMsg && (
        <p
          className="rounded-md px-3 py-2 text-sm"
          style={{
            background: publishMsg.ok ? '#ECFDF5' : '#FEF2F2',
            color: publishMsg.ok ? '#047857' : '#B91C1C',
          }}
        >
          {publishMsg.text}
        </p>
      )}

      <KpiStrip variant="cards" items={kpiItems} />

      <FilterChips
        options={TABS}
        value={tab}
        onChange={(value) => setTab(value as DetailTab)}
      />

      <div className={CARD}>
        {tab === 'overview' && (
          <OverviewTab product={product} evaluation={evaluation} showCosts={showCosts} />
        )}
        {tab === 'pricing' && (
          <PricingTab product={product} line={line} showCosts={showCosts} />
        )}
        {tab === 'docs' && <DocsTab line={line} onSaved={load} />}
        {tab === 'rules' && <RulesTab evaluation={evaluation} />}
      </div>

      <ProductEditDrawer
        product={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </AdminPage>
  );
}

function OverviewTab({
  product,
  evaluation,
  showCosts,
}: {
  product: UnifiedProduct;
  evaluation: ProductRuleEvaluation | null;
  showCosts: boolean;
}) {
  const checklist: ChecklistItem[] = [
    { label: 'Has a name', ok: Boolean(product.name?.trim()) },
    { label: 'Has a description', ok: (product.description?.trim().length ?? 0) >= 20 },
    { label: 'Has a price', ok: product.price > 0 },
    ...(showCosts ? [{ label: 'Cost of sale set', ok: product.cost > 0 }] : []),
    {
      label: 'Passes all rules',
      ok: evaluation ? evaluation.publishable : false,
      blocking: evaluation ? evaluation.blocked : false,
      detail: evaluation?.blocked
        ? `${evaluation.summary.fail} blocking rule${evaluation.summary.fail > 1 ? 's' : ''}`
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
        {product.description?.trim() || 'No description.'}
      </p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="Type" value={product.type} />
        <Row label="Technology" value={product.technology ?? '—'} />
        <Row label="Category" value={product.category} />
        <Row label="Channels" value={product.channels.length ? product.channels.join(', ') : '—'} />
      </dl>
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}
      <PublishReadinessChecklist items={checklist} />
      {product.sourceTable === 'service_packages' && (
        <RelationshipsPanel productId={product.id} />
      )}
    </div>
  );
}

function PricingTab({
  product,
  line,
  showCosts,
}: {
  product: UnifiedProduct;
  line: ProductLineWithRelations | null;
  showCosts: boolean;
}) {
  return (
    <dl className="space-y-4 text-sm">
      <Row label="Retail price" value={formatPrice(product.price)} />
      <Row label="Cost of sale" value={showCosts ? formatPrice(product.cost) : '—'} />
      <div>
        <dt
          className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
          style={{ color: 'var(--pm-navy)' }}
        >
          Margin
        </dt>
        {showCosts ? <MarginBar margin={product.margin} /> : <dd>—</dd>}
      </div>
      {line && (
        <>
          <Row label="Line floor" value={`${line.min_margin_pct}%`} />
          <Row label="List ARPU (excl VAT)" value={zar(line.list_arpu_zar)} />
          {line.price_drift_notes && (
            <div>
              <dt
                className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
                style={{ color: 'var(--pm-navy)' }}
              >
                Price drift
              </dt>
              <dd className="text-sm" style={{ color: 'var(--pm-body)' }}>
                {line.price_drift_notes}
              </dd>
            </div>
          )}
        </>
      )}
    </dl>
  );
}

function DocsTab({
  line,
  onSaved,
}: {
  line: ProductLineWithRelations | null;
  onSaved: () => Promise<void> | void;
}) {
  if (!line) {
    return (
      <EmptyState
        icon={<PiFileTextBold />}
        title="Not on a portfolio line — attach this SKU under Product portfolio"
        description="CPS, BRD and FSD live on the parent product line."
        action={
          <Link
            href="/admin/products?section=portfolio"
            className="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-extrabold"
            style={{ background: 'var(--pm-accent)', color: 'var(--pm-navy)' }}
          >
            Open Product portfolio
          </Link>
        }
      />
    );
  }

  return <DocRegistry line={line} onSaved={onSaved} />;
}

function RulesTab({ evaluation }: { evaluation: ProductRuleEvaluation | null }) {
  if (!evaluation || evaluation.results.length === 0) {
    return <p className="text-sm text-ui-text-muted">No rules apply to this product.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-ui-text-muted">
        <span>{evaluation.summary.pass} pass</span>
        <span>{evaluation.summary.warning} warning</span>
        <span>{evaluation.summary.fail} fail</span>
      </div>
      <ul className="space-y-2">
        {evaluation.results.map((r) => (
          <li key={r.ruleId} className="rounded-lg border border-ui-border p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ui-text-primary">{r.ruleName}</span>
              <RuleLevelBadge level={r.level} />
            </div>
            <p className="text-xs text-ui-text-secondary">{r.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ui-text-muted">{label}</dt>
      <dd className="font-medium text-ui-text-primary">{value}</dd>
    </div>
  );
}
