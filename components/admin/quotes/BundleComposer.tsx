'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  BUNDLE_TEMPLATES,
  type BundleTemplateCode,
  priceBundle,
  type BundlePriceResult,
} from '@/lib/products/bundle-pricing';

interface CpeRow {
  sku: string;
  name: string;
  cost_price: number | null;
  manufacturer?: string | null;
}

export function BundleComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = (searchParams.get('template') as BundleTemplateCode) || 'circleconnect-5g-essential';

  const [template, setTemplate] = useState<BundleTemplateCode>(
    initial in BUNDLE_TEMPLATES ? initial : 'circleconnect-5g-essential'
  );
  const spec = BUNDLE_TEMPLATES[template];
  const [termMonths, setTermMonths] = useState<12 | 24>(spec.defaultTermMonths);
  const [heliosIncludesCpe, setHeliosIncludesCpe] = useState(spec.defaultHeliosIncludesCpe);
  const [addCpeUpgrade, setAddCpeUpgrade] = useState(false);
  const [m365Seats, setM365Seats] = useState(spec.defaultM365Seats);
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
    setTermMonths(BUNDLE_TEMPLATES[template].defaultTermMonths);
    setHeliosIncludesCpe(BUNDLE_TEMPLATES[template].defaultHeliosIncludesCpe);
    setM365Seats(BUNDLE_TEMPLATES[template].defaultM365Seats);
    setAddCpeUpgrade(false);
  }, [template]);

  const input = useMemo(
    () => ({
      template,
      termMonths,
      heliosIncludesCpe,
      cpeCostExcl: Number(cpe?.cost_price) || (template === 'otg' ? 360 : 0),
      addCpeUpgrade,
      m365Seats,
    }),
    [template, termMonths, heliosIncludesCpe, cpe, addCpeUpgrade, m365Seats]
  );

  useEffect(() => {
    setPricing(priceBundle(input));
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Compose bundle</h1>
        <p className="text-sm text-ui-text-muted">
          SkyTel SIM + curated Rectron CPE + optional Microsoft 365. Does not double-count a router already on the Helios deal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Template</Label>
          <select
            className="h-10 w-full rounded-md border border-ui-border px-3 text-sm"
            value={template}
            onChange={(e) => setTemplate(e.target.value as BundleTemplateCode)}
          >
            {Object.values(BUNDLE_TEMPLATES).map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} — R{t.billedInclVat} incl VAT / {t.defaultTermMonths} mo
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Term (months)</Label>
          <select
            className="h-10 w-full rounded-md border border-ui-border px-3 text-sm"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value) as 12 | 24)}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Helios deal code</Label>
          <Input value={heliosDealCode} onChange={(e) => setHeliosDealCode(e.target.value)} placeholder="e.g. 202501EBU2013" />
        </div>
        <div className="flex items-center justify-between rounded-md border border-ui-border px-3 py-2">
          <Label>Helios deal includes CPE</Label>
          <Switch checked={heliosIncludesCpe} onCheckedChange={setHeliosIncludesCpe} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-ui-border px-3 py-2">
          <Label>Add Rectron CPE as upgrade</Label>
          <Switch checked={addCpeUpgrade} onCheckedChange={setAddCpeUpgrade} />
        </div>
        <div className="space-y-2">
          <Label>M365 Business Standard seats</Label>
          <Input
            type="number"
            min={0}
            value={m365Seats}
            onChange={(e) => setM365Seats(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {(addCpeUpgrade || !heliosIncludesCpe) && (
        <div className="space-y-2 rounded-lg border border-ui-border bg-white p-4">
          <Label>Rectron CPE (MiFi / 5G / LTE only)</Label>
          {lastSynced && (
            <p className="text-xs text-ui-text-muted">
              Catalogue last synced {new Date(lastSynced).toLocaleDateString('en-ZA')}
            </p>
          )}
          <Input placeholder="Search Huawei, Vida, Tozed…" value={cpeQuery} onChange={(e) => setCpeQuery(e.target.value)} />
          <div className="max-h-40 overflow-y-auto text-sm">
            {cpeRows.length === 0 && (
              <p className="px-2 py-3 text-xs text-ui-text-muted">
                No curated MiFi / 5G / LTE devices yet. Sync Rectron from Product Workspace → Suppliers.
              </p>
            )}
            {cpeRows.map((row) => (
              <button
                key={row.sku}
                type="button"
                className={`flex w-full justify-between px-2 py-1 text-left hover:bg-slate-50 ${cpe?.sku === row.sku ? 'bg-orange-50' : ''}`}
                onClick={() => setCpe(row)}
              >
                <span>
                  {row.name} <span className="text-ui-text-muted">({row.sku})</span>
                </span>
                <span>R{Number(row.cost_price || 0).toFixed(0)} excl</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pricing && (
        <div className="rounded-lg border border-ui-border bg-white p-4 text-sm space-y-1">
          <p>
            Billed <strong>R{pricing.billedInclVat} incl</strong> / R{pricing.billedExclVat.toFixed(2)} excl
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

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Contact</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2782…" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Service address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button onClick={submit} disabled={busy || !company || !email}>
        {busy ? 'Creating…' : 'Create draft quote'}
      </Button>
    </div>
  );
}
