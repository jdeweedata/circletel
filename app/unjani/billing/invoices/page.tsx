'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  PortalModernistShell,
  PageHeader,
  FilterChips,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatClinicShortName, formatZar } from '@/lib/portal/site-format';
import { usePortalCapability } from '@/lib/portal/use-portal-capability';
import {
  formatMonthLabel,
  invoiceMonthKey,
} from '@/lib/portal/billing-period';

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
  corporate_site_id?: string | null;
}

function openInvoicePdf(invoiceId: string) {
  window.open(
    `/api/portal/billing/${invoiceId}/download?disposition=inline`,
    '_blank',
    'noopener,noreferrer'
  );
}

export default function PortalBillingInvoicesPage() {
  const { user } = usePortalAuth();
  const { href } = usePortalApp();
  const { allowed } = usePortalCapability('billing.read');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/billing')
      .then((r) => r.json())
      .then((data) => {
        const rows: Invoice[] = data.invoices ?? [];
        const npc = rows.filter((inv) => inv.corporate_site_id == null);
        setInvoices(npc.length > 0 ? npc : rows);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load invoices');
      })
      .finally(() => setLoading(false));
  }, []);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const inv of invoices) {
      const key = invoiceMonthKey(inv.period_start) ?? invoiceMonthKey(inv.period_end);
      if (key) keys.add(key);
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [invoices]);

  const visible = useMemo(() => {
    if (month === 'all') return invoices;
    return invoices.filter((inv) => {
      const key = invoiceMonthKey(inv.period_start) ?? invoiceMonthKey(inv.period_end);
      return key === month;
    });
  }, [invoices, month]);

  if (!user || !allowed) return null;

  async function handleDownload(invoice: Invoice) {
    setBusyId(invoice.id);
    setError('');
    try {
      const res = await fetch(
        `/api/portal/billing/${invoice.id}/download?disposition=attachment`
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Could not download invoice PDF');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Billing · Invoices"
        title="Invoices by month"
        subtitle={`NPC tax invoices for ${user.organisation_name}`}
        actions={
          <>
            <Link href={href('/billing')}>
              <PmButton variant="ghost">Billing hub</PmButton>
            </Link>
            <Link href={href('/billing/statement')}>
              <PmButton variant="secondary">Account statement</PmButton>
            </Link>
          </>
        }
      />

      <div className="mt-6">
        <FilterChips
          value={month}
          onChange={setMonth}
          options={[
            { value: 'all', label: 'All months' },
            ...monthOptions.map((key) => ({
              value: key,
              label: formatMonthLabel(key),
            })),
          ]}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading invoices…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          No invoices for this month.
        </div>
      ) : (
        <RuledTable headers={['Invoice', 'Period', 'Total', 'Due', 'Status', 'Actions']}>
          {visible.map((inv) => {
            const expanded = expandedId === inv.id;
            const lines = inv.line_items ?? [];
            return (
              <React.Fragment key={inv.id}>
                <tr style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {inv.invoice_number}
                    {inv.clinic_name ? (
                      <span className="ml-2 text-xs font-normal opacity-70">
                        {formatClinicShortName(inv.clinic_name)}
                      </span>
                    ) : null}
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
                        onClick={() => openInvoicePdf(inv.id)}
                      >
                        View
                      </PmButton>
                      <PmButton
                        variant="secondary"
                        disabled={busyId === inv.id}
                        onClick={() => handleDownload(inv)}
                      >
                        {busyId === inv.id ? '…' : 'Download'}
                      </PmButton>
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                    <td colSpan={6} className="px-4 py-3" style={{ background: 'var(--pm-surface)' }}>
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
