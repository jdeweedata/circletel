'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  priceBundle,
  type BundlePriceResult,
  type BundleTemplate,
} from '@/lib/products/bundle-pricing';
import {
  PageHeader as PortalPageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';

interface CpeRow {
  sku: string;
  name: string;
  cost_price: number | null;
  manufacturer?: string | null;
}

const CARD = 'rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.06]';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label
      className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
      style={{ color: 'var(--pm-navy)' }}
    >
      {children}
    </Label>
  );
}

export function BundleComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCode = searchParams.get('template') || '';

  const [flyers, setFlyers] = useState<BundleTemplate[]>([]);
  const [templateCode, setTemplateCode] = useState(requestedCode);
  const spec = flyers.find((f) => f.code === templateCode) ?? flyers[0] ?? null;
  const [termMonths, setTermMonths] = useState<12 | 24 | 36>(12);
  const [heliosIncludesCpe, setHeliosIncludesCpe] = useState(false);
  const [addCpeUpgrade, setAddCpeUpgrade] = useState(false);
  const [m365Seats, setM365Seats] = useState(0);
  const [heliosDealCode, setHeliosDealCode] = useState('');
  const [cpeQuery, setCpeQuery] = useState('');
  const [cpeRows, setCpeRows] = useState<CpeRow[]>([]);
  const [cpe, setCpe] = useState<CpeRow | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [pricing, setPricing] = useState<BundlePriceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/bundle-templates?sellable=1');
      const data = await res.json();
      if (cancelled || !res.ok || !data.success) return;
      const list = (data.templates || []) as BundleTemplate[];
      setFlyers(list);
      const match = list.find((f) => f.code === requestedCode);
      setTemplateCode(match?.code || list[0]?.code || '');
    })();
    return () => {
      cancelled = true;
    };
  }, [requestedCode]);

  useEffect(() => {
    if (!spec) return;
    setTermMonths(spec.defaultTermMonths);
    setHeliosIncludesCpe(spec.defaultHeliosIncludesCpe);
    setM365Seats(spec.defaultM365Seats);
    setAddCpeUpgrade(false);
  }, [spec]);

  const input = useMemo(
    () =>
      spec
        ? {
            template: spec,
            termMonths,
            heliosIncludesCpe,
            cpeCostExcl: Number(cpe?.cost_price) || (spec.code === 'otg' ? 360 : 0),
            addCpeUpgrade,
            m365Seats,
          }
        : null,
    [spec, termMonths, heliosIncludesCpe, cpe, addCpeUpgrade, m365Seats]
  );

  useEffect(() => {
    setPricing(input ? priceBundle(input) : null);
  }, [input]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/bundles/cpe?q=${encodeURIComponent(cpeQuery)}`);
      const data = await res.json();
      if (data.success) {
        setCpeRows(data.products);
        setLastSynced(data.last_synced_at);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [cpeQuery]);

  async function submit() {
    if (!input) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bundles/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing: input,
          heliosDealCode,
          cpeSku: cpe?.sku,
          cpeName: cpe?.name,
          company_name: company,
          contact_name: contact,
          contact_email: email,
          contact_phone: phone,
          service_address: address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Quote failed');
      router.push(`/admin/quotes/${data.quoteId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const selectStyle = {
    borderColor: 'var(--pm-divider)',
    color: 'var(--pm-navy)',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PortalPageHeader
        eyebrow="Sales"
        title="Build a quote"
        subtitle="SkyTel SIM + curated Rectron CPE + optional Microsoft 365. Does not double-count a router already on the Helios deal."
      />

      <div className={`grid gap-4 md:grid-cols-2 ${CARD}`}>
        <div className="space-y-2">
          <FieldLabel>Flyer</FieldLabel>
          <select
            className="h-11 w-full rounded-lg border-2 bg-white px-3 text-sm"
            style={selectStyle}
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            disabled={flyers.length === 0}
          >
            {flyers.length === 0 && <option value="">No live flyers yet</option>}
            {flyers.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} — R{t.billedInclVat} incl VAT / {t.defaultTermMonths} mo
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <FieldLabel>Term (months)</FieldLabel>
          <select
            className="h-11 w-full rounded-lg border-2 bg-white px-3 text-sm"
            style={selectStyle}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value) as 12 | 24)}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={36}>36</option>
          </select>
        </div>
        <div className="space-y-2">
          <FieldLabel>Helios deal code</FieldLabel>
          <Input value={heliosDealCode} onChange={(e) => setHeliosDealCode(e.target.value)} placeholder="e.g. 202501EBU2013" />
        </div>
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ border: '2px solid var(--pm-divider)' }}
        >
          <FieldLabel>Helios deal includes CPE</FieldLabel>
          <Switch checked={heliosIncludesCpe} onCheckedChange={setHeliosIncludesCpe} />
        </div>
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ border: '2px solid var(--pm-divider)' }}
        >
          <FieldLabel>Add Rectron CPE as upgrade</FieldLabel>
          <Switch checked={addCpeUpgrade} onCheckedChange={setAddCpeUpgrade} />
        </div>
        <div className="space-y-2">
          <FieldLabel>M365 Business Standard seats</FieldLabel>
          <Input
            type="number"
            min={0}
            value={m365Seats}
            onChange={(e) => setM365Seats(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {(addCpeUpgrade || !heliosIncludesCpe) && (
        <div className={`space-y-2 ${CARD}`}>
          <FieldLabel>Rectron CPE (MiFi / 5G / LTE only)</FieldLabel>
          {lastSynced && (
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Catalogue last synced {new Date(lastSynced).toLocaleDateString('en-ZA')}
            </p>
          )}
          <Input placeholder="Search Huawei, Vida, Tozed…" value={cpeQuery} onChange={(e) => setCpeQuery(e.target.value)} />
          <div className="max-h-40 overflow-y-auto text-sm" style={{ borderTop: '2px solid var(--pm-divider)' }}>
            {cpeRows.length === 0 && (
              <p className="px-2 py-3 text-xs" style={{ color: '#6B7280' }}>
                No curated MiFi / 5G / LTE devices yet. Sync Rectron from Product Workspace → Suppliers.
              </p>
            )}
            {cpeRows.map((row) => (
              <button
                key={row.sku}
                type="button"
                className="flex w-full justify-between px-2 py-2 text-left"
                style={{
                  background: cpe?.sku === row.sku ? 'color-mix(in srgb, #F5841E 18%, #FFFFFF)' : 'transparent',
                  color: 'var(--pm-navy)',
                  borderBottom: '1px solid var(--pm-divider)',
                }}
                onClick={() => setCpe(row)}
              >
                <span>
                  {row.name} <span style={{ color: '#6B7280' }}>({row.sku})</span>
                </span>
                <span className="tabular-nums">R{Number(row.cost_price || 0).toFixed(0)} excl</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pricing && (
        <div className={`${CARD} space-y-1 text-sm`} style={{ color: 'var(--pm-body)' }}>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
            style={{ color: 'var(--pm-navy)' }}
          >
            Cash-out
          </p>
          <p>
            Billed <strong style={{ color: 'var(--pm-navy)' }}>R{pricing.billedInclVat} incl</strong> / R{pricing.billedExclVat.toFixed(2)} excl
          </p>
          <p>Connectivity cost R{pricing.connectivityCostExcl.toFixed(2)} excl</p>
          <p>
            CPE {pricing.cpeCharged ? `amortised R${pricing.cpeAmortisedMonthlyExcl.toFixed(2)}/mo · cash-out R${pricing.cpeCashOutExcl.toFixed(2)}` : 'included on Helios deal'}
          </p>
          <p>M365 CSP R{pricing.m365CspMonthlyExcl.toFixed(2)} / mo</p>
          <p>
            Direct cost R{pricing.directCostExcl.toFixed(2)} · contribution R{pricing.contributionExcl.toFixed(2)} ·{' '}
            <strong className={pricing.belowFloor ? 'text-red-700' : 'text-emerald-700'}>
              {pricing.marginPct}% margin
            </strong>
          </p>
          <p>Month-1 cash-out R{pricing.month1CashOutExcl.toFixed(2)} excl</p>
          {pricing.priceDriftNote && <p className="text-amber-800">{pricing.priceDriftNote}</p>}
          {pricing.belowFloor && (
            <p className="text-red-700">Below {pricing.floorPct}% finance floor — products:approve required to quote.</p>
          )}
        </div>
      )}

      <div className={`grid gap-3 md:grid-cols-2 ${CARD}`}>
        <div className="space-y-1">
          <FieldLabel>Company</FieldLabel>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-1">
          <FieldLabel>Contact</FieldLabel>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="space-y-1">
          <FieldLabel>Email</FieldLabel>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <FieldLabel>Phone</FieldLabel>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2782…" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <FieldLabel>Service address</FieldLabel>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <PmButton onClick={submit} disabled={busy || !input || !company || !email}>
        {busy ? 'Creating…' : 'Create draft quote'}
      </PmButton>
    </div>
  );
}
