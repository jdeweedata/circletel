'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  PortalModernistShell,
  PageHeader,
  AlertBand,
  KpiStrip,
  FilterChips,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatClinicShortName } from '@/lib/portal/site-format';
import type { InvoiceBucket } from '@/lib/portal/billing-summary';

interface LineItem {
  description?: string;
  site_name?: string;
  service?: string;
  sku?: string;
  amount?: number;
  unit_price?: number;
  quantity?: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  line_items: LineItem[] | null;
  invoice_type: string | null;
  status: string;
  paid_at: string | null;
  pdf_url: string | null;
  clinic_name?: string | null;
  bucket?: InvoiceBucket;
}

interface BilledService {
  name: string;
  monthlyFee: number;
  billingStartDate?: string | null;
  billed: boolean;
}

interface BillingSummary {
  billedCount: number;
  monthlySpend: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
}

function formatZar(n: number) {
  return `R${Number(n || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDay(iso: string | null | undefined) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export default function PortalBillingPage() {
  const { user } = usePortalAuth();
  const { href, isUnjani } = usePortalApp();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billedServices, setBilledServices] = useState<BilledService[]>([]);
  const [deferredLive, setDeferredLive] = useState<BilledService[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState<'unpaid' | 'paid'>('unpaid');

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

  const visibleInvoices = useMemo(
    () => invoices.filter((invoice) => (invoice.bucket ?? 'unpaid') === invoiceFilter),
    [invoices, invoiceFilter]
  );

  if (!user) return null;

  const overdue = invoices.filter((i) => i.status === 'overdue');
  const outstanding = summary?.unpaidTotal ?? 0;

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
        title="Invoices"
        subtitle={
          isUnjani
            ? `Active Unjani Connect services being billed, plus paid and unpaid invoices for ${user.organisation_name}`
            : `Itemised billing for ${user.organisation_name}`
        }
        actions={
          <Link href={href('/billing/statement')}>
            <PmButton variant="secondary">Account statement</PmButton>
          </Link>
        }
      />

      {overdue.length > 0 && (
        <AlertBand>
          You have {overdue.length} overdue invoice
          {overdue.length > 1 ? 's' : ''}. Please arrange payment with CircleTel.
        </AlertBand>
      )}

      <KpiStrip
        items={[
          {
            label: 'Monthly billed',
            value: formatZar(summary?.monthlySpend ?? 0),
            note: `${summary?.billedCount ?? 0} active services`,
          },
          {
            label: 'Unpaid',
            value: formatZar(outstanding),
            note: `${summary?.unpaidCount ?? 0} open invoices`,
          },
          {
            label: 'Paid',
            value: formatZar(summary?.paidTotal ?? 0),
            note: `${summary?.paidCount ?? 0} settled`,
          },
          {
            label: 'Deferred live',
            value: String(deferredLive.length),
            note: deferredLive.length > 0 ? 'Billed from 1 Sep' : 'None',
          },
        ]}
      />

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading billing…
        </div>
      ) : (
        <>
          <h2
            className="mt-8 text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Active services being billed
          </h2>
          <RuledTable headers={['Clinic', 'Monthly fee excl VAT', 'Billing start']}>
            {billedServices.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                  No clinics are on a collectable service this month.
                </td>
              </tr>
            ) : (
              billedServices.map((service) => (
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

          {deferredLive.length > 0 && (
            <>
              <h2
                className="mt-8 text-[10px] font-extrabold tracking-[0.08em] uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                Live — not billed this month
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--pm-body)' }}>
                These clinics stay live. Oukasie, Chloorkop, Phoenix, Alexandra and Sicelo move to
                NPC billing on 1 September 2026; their clinic invoices were voided and are not
                collectable.
              </p>
              <RuledTable headers={['Clinic', 'Monthly fee excl VAT', 'Billing start']}>
                {deferredLive.map((service) => (
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
                ))}
              </RuledTable>
            </>
          )}

          <div className="mt-8">
            <FilterChips
              value={invoiceFilter}
              onChange={(value) => setInvoiceFilter(value as 'unpaid' | 'paid')}
              options={[
                { value: 'unpaid', label: `Unpaid (${summary?.unpaidCount ?? 0})` },
                { value: 'paid', label: `Paid (${summary?.paidCount ?? 0})` },
              ]}
            />
          </div>

          {visibleInvoices.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
              {invoiceFilter === 'unpaid' ? 'No unpaid invoices.' : 'No paid invoices.'}
            </div>
          ) : (
            <RuledTable
              headers={['Invoice', 'Clinic', 'Period', 'Total', 'Due', 'Status', 'Actions']}
            >
              {visibleInvoices.map((inv) => {
                const expanded = expandedId === inv.id;
                const lines = inv.line_items ?? [];
                return (
                  <React.Fragment key={inv.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--pm-divider)',
                        borderLeft:
                          inv.status === 'overdue' ? '3px solid #DC2626' : undefined,
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
                            {expanded ? 'Hide lines' : isUnjani ? 'Clinics' : 'Lines'}
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
                        <td
                          colSpan={7}
                          className="px-4 py-3"
                          style={{ background: 'var(--pm-surface)' }}
                        >
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
                                    <td
                                      className="py-1.5 text-right"
                                      style={{ color: 'var(--pm-body)' }}
                                    >
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
        </>
      )}
    </PortalModernistShell>
  );
}
