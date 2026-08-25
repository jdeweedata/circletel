'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  PageHeader as PortalPageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import {
  inclToExcl,
  priceBundle,
  workingBundleTemplateFromLine,
  type BundleTemplate,
} from '@/lib/products/bundle-pricing';
import type { ProductLineWithRelations } from '@/lib/types/product-lines';
import { CONTACT } from '@/lib/constants/contact';
import type { FlyerWizardFields } from '@/lib/products/bundle-doc-fields';
import { STEPS } from './flyer-copy';

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

function emptyFields(): FlyerWizardFields {
  return {
    name: '',
    code: '',
    tagline: '',
    buyerType: 'smb',
    salesBlurb: '',
    billedInclVat: 0,
    termMonths: 12,
    connectivityName: 'SkyTel / Helios data',
    connectivityCostExcl: 0,
    heliosIncludesCpe: false,
    cpeName: '',
    cpeCostExcl: 0,
    m365Seats: 0,
    needsSiteCheck: false,
    supportHours: CONTACT.SUPPORT_HOURS,
    fairUse: '',
    needsNewIt: false,
  };
}

function fieldsFromLine(line: ProductLineWithRelations): FlyerWizardFields {
  const cpe = line.bundle_components.find((c) => c.component_role === 'cpe');
  const conn = line.bundle_components.find((c) => c.component_role === 'connectivity');
  const buyer =
    line.target_market === 'soho' ? 'soho' : line.target_market === 'smb' ? 'smb' : 'either';
  return {
    name: line.name,
    code: line.code,
    tagline: line.sales_blurb?.split('.')[0] || line.name,
    buyerType: buyer,
    salesBlurb: line.sales_blurb || '',
    billedInclVat: line.billed_incl_vat_zar ?? 0,
    termMonths: line.default_term_months,
    connectivityName: conn?.name || 'SkyTel / Helios data',
    connectivityCostExcl: line.default_connectivity_cost_excl ?? 0,
    heliosIncludesCpe: line.default_helios_includes_cpe,
    cpeName: cpe?.name || '',
    cpeCostExcl: cpe?.default_cost_excl ?? 0,
    m365Seats: line.default_m365_seats,
    needsSiteCheck: false,
    supportHours: CONTACT.SUPPORT_HOURS,
    fairUse: '',
    needsNewIt: line.fsd_required,
  };
}

export function BundleTemplateBuilder({ code }: { code?: string }) {
  const router = useRouter();
  const isNew = !code;
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<FlyerWizardFields>(emptyFields);
  const [line, setLine] = useState<ProductLineWithRelations | null>(null);
  const [showCosts, setShowCosts] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financeNote, setFinanceNote] = useState('');

  useEffect(() => {
    if (!code) return;
    (async () => {
      const res = await fetch(`/api/admin/bundle-templates/${code}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not load flyer');
        return;
      }
      setLine(data.line);
      setShowCosts(Boolean(data.show_costs));
      setFields(fieldsFromLine(data.line));
    })();
  }, [code]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/product-lines');
      if (!res.ok) return;
      const data = await res.json();
      setCanApprove(Boolean(data.show_costs));
    })();
  }, []);

  const previewTemplate: BundleTemplate = useMemo(() => {
    if (line) {
      return {
        ...workingBundleTemplateFromLine(line),
        billedInclVat: fields.billedInclVat,
        defaultTermMonths: fields.termMonths,
        defaultHeliosIncludesCpe: fields.heliosIncludesCpe,
        defaultM365Seats: fields.m365Seats,
        defaultConnectivityCostExcl: fields.connectivityCostExcl,
      };
    }
    return {
      code: fields.code || 'new-flyer',
      name: fields.name || 'New flyer',
      productLineCode: fields.code || 'new-flyer',
      billedInclVat: fields.billedInclVat,
      defaultTermMonths: fields.termMonths,
      defaultHeliosIncludesCpe: fields.heliosIncludesCpe,
      defaultM365Seats: fields.m365Seats,
      defaultConnectivityCostExcl: fields.connectivityCostExcl,
    };
  }, [line, fields]);

  const pricing = useMemo(
    () =>
      priceBundle({
        template: previewTemplate,
        termMonths: fields.termMonths,
        billedInclVat: fields.billedInclVat,
        heliosIncludesCpe: fields.heliosIncludesCpe,
        cpeCostExcl: fields.cpeCostExcl,
        addCpeUpgrade: false,
        m365Seats: fields.m365Seats,
        connectivityCostExcl: fields.connectivityCostExcl,
      }),
    [previewTemplate, fields]
  );

  function set<K extends keyof FlyerWizardFields>(key: K, value: FlyerWizardFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) return Boolean(fields.name.trim() && (fields.code.trim() || isNew));
    if (step === 2) return Boolean(fields.connectivityName.trim());
    if (step === 3) return fields.billedInclVat > 0;
    if (step === 4) return Boolean(fields.buyerType && fields.termMonths);
    return true;
  }

  async function ensureSaved(): Promise<string> {
    if (code) return code;
    const res = await fetch('/api/admin/bundle-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fields.name,
        code: fields.code || undefined,
        target_market: fields.buyerType === 'either' ? 'smb' : fields.buyerType,
        sales_blurb: fields.salesBlurb,
        billed_incl_vat_zar: fields.billedInclVat,
        default_term_months: fields.termMonths,
        default_helios_includes_cpe: fields.heliosIncludesCpe,
        default_m365_seats: fields.m365Seats,
        default_connectivity_cost_excl: fields.connectivityCostExcl,
        components: [
          {
            component_role: 'connectivity',
            name: fields.connectivityName,
            source: 'skytel_helios',
            helios_includes_cpe: fields.heliosIncludesCpe,
            default_cost_excl: fields.connectivityCostExcl,
          },
          {
            component_role: 'cpe',
            name: fields.cpeName || 'Router',
            source: 'rectron',
            helios_includes_cpe: fields.heliosIncludesCpe,
            default_cost_excl: fields.cpeCostExcl,
            amortise_months: fields.termMonths,
          },
          {
            component_role: 'licence',
            name: 'Microsoft 365 Business Standard',
            source: 'm365_csp',
            default_cost_excl: fields.m365Seats * 270,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not save');
    return data.line.code as string;
  }

  async function saveForLater() {
    setBusy(true);
    setError(null);
    try {
      const saved = await ensureSaved();
      if (code) {
        const res = await fetch(`/api/admin/bundle-templates/${saved}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fields.name,
            sales_blurb: fields.salesBlurb,
            target_market: fields.buyerType === 'either' ? 'smb' : fields.buyerType,
            billed_incl_vat_zar: fields.billedInclVat,
            default_term_months: fields.termMonths,
            default_helios_includes_cpe: fields.heliosIncludesCpe,
            default_m365_seats: fields.m365Seats,
            default_connectivity_cost_excl: fields.connectivityCostExcl,
            needsNewIt: fields.needsNewIt,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not save');
      }
      router.push(`/admin/quotes/bundles/templates/${saved}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function sendToFinance() {
    setBusy(true);
    setError(null);
    try {
      const saved = await ensureSaved();
      const res = await fetch(`/api/admin/bundle-templates/${saved}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, code: saved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send');
      router.push('/admin/quotes/bundles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  async function readyToSell() {
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bundle-templates/${code}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: financeNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not go live');
      router.push('/admin/quotes/bundles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not go live');
    } finally {
      setBusy(false);
    }
  }

  async function sendBack() {
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bundle-templates/${code}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: financeNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send back');
      router.push('/admin/quotes/bundles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send back');
    } finally {
      setBusy(false);
    }
  }

  const title = isNew ? 'New flyer' : `Edit flyer · ${fields.name || code}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PortalPageHeader
        eyebrow="Sales"
        title={title}
        subtitle={
          isNew
            ? 'Build it the way you sell it. Finance sees cost and cash on the right.'
            : 'Changes to price or cost wait for finance. Live quotes stay as they were.'
        }
      />

      <ol className="flex flex-wrap gap-2 text-xs font-extrabold uppercase tracking-wide">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className="rounded-lg px-3 py-2"
              style={{
                background: step === s.id ? 'var(--pm-navy)' : '#FFFFFF',
                color: step === s.id ? '#FFFFFF' : 'var(--pm-navy)',
                border: '1px solid var(--pm-divider)',
              }}
            >
              {s.id}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className={`${CARD} space-y-4`}>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {STEPS[step - 1].helper}
          </p>

          {step === 1 && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <FieldLabel>Flyer name</FieldLabel>
                <Input value={fields.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Short code</FieldLabel>
                <Input
                  value={fields.code}
                  disabled={!isNew}
                  onChange={(e) => set('code', e.target.value.toLowerCase())}
                  placeholder="otg-soho-20gb"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <FieldLabel>One-line pitch</FieldLabel>
                <Input value={fields.tagline} onChange={(e) => set('tagline', e.target.value)} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Who buys it</FieldLabel>
                <select
                  className="h-11 w-full rounded-lg border-2 bg-white px-3 text-sm"
                  value={fields.buyerType}
                  onChange={(e) => set('buyerType', e.target.value as FlyerWizardFields['buyerType'])}
                >
                  <option value="soho">SOHO</option>
                  <option value="smb">SME</option>
                  <option value="either">Either</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <FieldLabel>What we tell the customer</FieldLabel>
                <Input value={fields.salesBlurb} onChange={(e) => set('salesBlurb', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <div className="space-y-1">
                <FieldLabel>Connectivity</FieldLabel>
                <Input
                  value={fields.connectivityName}
                  onChange={(e) => set('connectivityName', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ border: '2px solid var(--pm-divider)' }}>
                <FieldLabel>Helios already sent a router</FieldLabel>
                <Switch
                  checked={fields.heliosIncludesCpe}
                  onCheckedChange={(v) => set('heliosIncludesCpe', v)}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel>Router the customer gets</FieldLabel>
                <Input value={fields.cpeName} onChange={(e) => set('cpeName', e.target.value)} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Microsoft 365 seats</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={fields.m365Seats}
                  onChange={(e) => set('m365Seats', Number(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <FieldLabel>Customer pays (incl. VAT)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={fields.billedInclVat || ''}
                  onChange={(e) => set('billedInclVat', Number(e.target.value) || 0)}
                />
                <p className="text-xs tabular-nums" style={{ color: '#6B7280' }}>
                  R{inclToExcl(fields.billedInclVat).toFixed(2)} excl. VAT
                </p>
              </div>
              <div className="space-y-1">
                <FieldLabel>Contract length</FieldLabel>
                <select
                  className="h-11 w-full rounded-lg border-2 bg-white px-3 text-sm"
                  value={fields.termMonths}
                  onChange={(e) => set('termMonths', Number(e.target.value) as 12 | 24 | 36)}
                >
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </div>
              {showCosts && (
                <>
                  <div className="space-y-1">
                    <FieldLabel>What we pay SkyTel (excl. VAT)</FieldLabel>
                    <Input
                      type="number"
                      value={fields.connectivityCostExcl || ''}
                      onChange={(e) => set('connectivityCostExcl', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Router cost to us</FieldLabel>
                    <Input
                      type="number"
                      value={fields.cpeCostExcl || ''}
                      onChange={(e) => set('cpeCostExcl', Number(e.target.value) || 0)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ border: '2px solid var(--pm-divider)' }}>
                <FieldLabel>Needs a site check</FieldLabel>
                <Switch checked={fields.needsSiteCheck} onCheckedChange={(v) => set('needsSiteCheck', v)} />
              </div>
              <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
                Do not bill a second router if Helios already sent one.
              </p>
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ border: '2px solid var(--pm-divider)' }}>
                <FieldLabel>IT must build something new to deliver or bill this</FieldLabel>
                <Switch checked={fields.needsNewIt} onCheckedChange={(v) => set('needsNewIt', v)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-3">
              <div className="space-y-1">
                <FieldLabel>Support hours</FieldLabel>
                <Input value={fields.supportHours} onChange={(e) => set('supportHours', e.target.value)} />
              </div>
              <div className="space-y-1">
                <FieldLabel>Fair use</FieldLabel>
                <Input value={fields.fairUse} onChange={(e) => set('fairUse', e.target.value)} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 text-sm" style={{ color: 'var(--pm-body)' }}>
              <p>
                <strong style={{ color: 'var(--pm-navy)' }}>{fields.name || 'Untitled flyer'}</strong> —{' '}
                {fields.tagline}
              </p>
              <p>
                {fields.connectivityName}
                {fields.m365Seats ? ` · Microsoft 365 × ${fields.m365Seats}` : ''}
                {fields.cpeName ? ` · ${fields.cpeName}` : ''}
              </p>
              {canApprove && (
                <div className="space-y-1">
                  <FieldLabel>Note for the file</FieldLabel>
                  <Input
                    value={financeNote}
                    onChange={(e) => setFinanceNote(e.target.value)}
                    placeholder="What should sales change?"
                  />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <PmButton variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Back
              </PmButton>
            )}
            {step < 6 && (
              <PmButton disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)}>
                Next
              </PmButton>
            )}
            <PmButton variant="secondary" disabled={busy || !fields.name} onClick={saveForLater}>
              {busy ? 'Saving…' : 'Save for later'}
            </PmButton>
            {step === 6 && (
              <PmButton disabled={busy} onClick={sendToFinance}>
                Send to finance
              </PmButton>
            )}
            {step === 6 && canApprove && code && (
              <>
                <PmButton disabled={busy} onClick={readyToSell}>
                  Sign off these numbers
                </PmButton>
                <PmButton variant="secondary" disabled={busy || !financeNote.trim()} onClick={sendBack}>
                  Send back to sales
                </PmButton>
              </>
            )}
          </div>
        </div>

        {step >= 3 && (
          <aside className={`${CARD} h-fit space-y-2 text-sm`}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em]" style={{ color: 'var(--pm-navy)' }}>
              The numbers
            </p>
            <p>
              Customer pays{' '}
              <strong className="tabular-nums" style={{ color: 'var(--pm-navy)' }}>
                R{pricing.billedInclVat.toFixed(0)} incl. VAT
              </strong>
            </p>
            {showCosts && (
              <>
                <p>Our monthly cost R{pricing.directCostExcl.toFixed(2)}</p>
                <p>What we keep R{pricing.contributionExcl.toFixed(2)}</p>
                <p className={pricing.belowFloor ? 'text-red-700' : 'text-emerald-700'}>
                  Margin {pricing.marginPct}%
                </p>
                <p>Month-1 cash R{pricing.month1CashOutExcl.toFixed(2)}</p>
                {pricing.belowFloor && (
                  <p className="text-red-700">
                    This deal keeps less than 25 cents on the rand. You can save it. Finance has to
                    sign before anyone can sell it.
                  </p>
                )}
              </>
            )}
            {!showCosts && <p style={{ color: '#6B7280' }}>Cost sits with finance.</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
