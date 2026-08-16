'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  PortalModernistShell,
  PageHeader,
  KpiStrip,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatClinicShortName, formatZar } from '@/lib/portal/site-format';
import type { InvoiceBucket } from '@/lib/portal/billing-summary';

export type BillingKpiMetric = 'monthly-billed' | 'unpaid' | 'paid' | 'deferred-live';

interface LineItem {
  description?: string;
  site_name?: string;
  service?: string;
  amount?: number;
  unit_price?: number;
  quantity?: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  period_start: string | null;
  period_end: string | null;
  total_amount: number;
  amount_due: number;
  line_items: LineItem[] | null;
  status: string;
  clinic_name?: string | null;
  bucket?: InvoiceBucket;
}

interface BilledService {
  name: string;
  monthlyFee: number;
  billingStartDate?: string | null;
}

interface BillingSummary {
  billedCount: number;
  monthlySpend: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
}

const META: Record<
  BillingKpiMetric,
  { label: string; title: string; subtitle: string; accent: string; valueColor?: string }
> = {
  'monthly-billed': {
    label: 'Monthly billed',
    title: 'Monthly billed',
    subtitle: 'Active Unjani Connect services on a collectable bill this month.',
    accent: '#13274A',
  },
  unpaid: {
    label: 'Unpaid',
    title: 'Unpaid invoices',
    subtitle: 'Open invoices that are still collectable.',
    accent: '#F5841E',
  },
  paid: {
    label: 'Paid',
    title: 'Paid invoices',
    subtitle: 'Settled invoices for this organisation.',
    accent: '#2F9E5E',
    valueColor: '#2F9E5E',
  },
  'deferred-live': {
    label: 'Deferred live',
    title: 'Live — not billed this month',
    subtitle: 'Live clinics whose billing start date is still in the future.',
    accent: '#13274A',
  },
};

function formatDay(iso: string | null | undefined) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function PortalBillingKpiPage({ metric }: { metric: BillingKpiMetric }) {
  const { user } = usePortalAuth();
  const { href } = usePortalApp();
  const meta = META[metric];
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billedServices, setBilledServices] = useState<BilledService[]>([]);
  const [deferredLive, setDeferredLive] = useState<BilledService[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portal/billing')
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.invoices ?? []);
        setBilledServices(data.billedServices ?? []);
        setDeferredLive(data.deferredLive ?? []);
        setSummary(data.summary ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const value =
    metric === 'monthly-billed'
      ? formatZar(summary?.monthlySpend ?? 0)
      : metric === 'unpaid'
        ? formatZar(summary?.unpaidTotal ?? 0)
        : metric === 'paid'
          ? formatZar(summary?.paidTotal ?? 0)
          : String(deferredLive.length);
  const note =
    metric === 'monthly-billed'
      ? `${summary?.billedCount ?? 0} active services`
      : metric === 'unpaid'
        ? `${summary?.unpaidCount ?? 0} open invoices`
        : metric === 'paid'
          ? `${summary?.paidCount ?? 0} settled`
          : deferredLive.length > 0
            ? 'Billed from 1 Sep'
            : 'None';

  const visibleInvoices = invoices.filter((invoice) => invoice.bucket === metric);
  const services = metric === 'monthly-billed' ? billedServices : deferredLive;

  async function handleDownload(invoice: Invoice) {
    setDownloading(invoice.id);
    try {
      const res = await fetch(`/api/portal/billing/${invoice.id}/download`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Billing · Receivables"
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Link
            href={href('/billing')}
            className="text-sm font-semibold underline underline-offset-2"
            style={{ color: 'var(--pm-navy)' }}
          >
            Billing
          </Link>
        }
      />

      <div className="mb-6">
        <KpiStrip
          variant="cards"
          items={[
            {
              label: meta.label,
              value,
              note,
              accent: meta.accent,
              valueColor: meta.valueColor,
            },
          ]}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading billing…
        </div>
      ) : metric === 'monthly-billed' || metric === 'deferred-live' ? (
        <RuledTable headers={['Clinic', 'Monthly fee excl VAT', 'Billing start']}>
          {services.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                No clinics in this list.
              </td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.name} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                  {formatClinicShortName(service.name)}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                  {formatZar(service.monthlyFee)}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                  {formatDay(service.billingStartDate)}
                </td>
              </tr>
            ))
          )}
        </RuledTable>
      ) : visibleInvoices.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          {metric === 'unpaid' ? 'No unpaid invoices.' : 'No paid invoices.'}
        </div>
      ) : (
        <RuledTable headers={['Invoice', 'Clinic', 'Period', 'Total', 'Due', 'Status', 'Actions']}>
          {visibleInvoices.map((inv) => {
            const expanded = expandedId === inv.id;
            const lines = inv.line_items ?? [];
            return (
              <React.Fragment key={inv.id}>
                <tr
                  style={{
                    borderBottom: '1px solid var(--pm-divider)',
                    borderLeft: inv.status === 'overdue' ? '3px solid #DC2626' : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                    {formatClinicShortName(inv.clinic_name)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                    {inv.period_start && inv.period_end
                      ? `${inv.period_start} → ${inv.period_end}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
                    {formatZar(inv.total_amount)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                    {formatZar(inv.amount_due)}
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: 'var(--pm-body)' }}>
                    {inv.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <PmButton
                        variant="ghost"
                        onClick={() => setExpandedId(expanded ? null : inv.id)}
                      >
                        {expanded ? 'Hide lines' : 'Lines'}
                      </PmButton>
                      <PmButton
                        variant="secondary"
                        disabled={downloading === inv.id}
                        onClick={() => handleDownload(inv)}
                      >
                        PDF
                      </PmButton>
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                    <td colSpan={7} className="px-4 py-3" style={{ background: 'var(--pm-surface)' }}>
                      {lines.length === 0 ? (
                        <p className="text-sm opacity-70">No line items on this invoice.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th
                                className="text-left py-1 font-extrabold text-[11px] uppercase"
                                style={{ color: 'var(--pm-navy)' }}
                              >
                                Service / clinic
                              </th>
                              <th
                                className="text-right py-1 font-extrabold text-[11px] uppercase"
                                style={{ color: 'var(--pm-navy)' }}
                              >
                                Qty
                              </th>
                              <th
                                className="text-right py-1 font-extrabold text-[11px] uppercase"
                                style={{ color: 'var(--pm-navy)' }}
                              >
                                Amount excl. VAT
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map((li, idx) => (
                              <tr key={idx}>
                                <td className="py-1.5" style={{ color: 'var(--pm-body)' }}>
                                  {li.description ||
                                    (li.site_name
                                      ? `Unjani Connect — ${li.site_name}`
                                      : li.service) ||
                                    'Service'}
                                </td>
                                <td className="py-1.5 text-right" style={{ color: 'var(--pm-body)' }}>
                                  {li.quantity ?? 1}
                                </td>
                                <td
                                  className="py-1.5 text-right font-medium"
                                  style={{ color: 'var(--pm-navy)' }}
                                >
                                  {formatZar(li.amount ?? li.unit_price ?? 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </RuledTable>
      )}
    </PortalModernistShell>
  );
}
