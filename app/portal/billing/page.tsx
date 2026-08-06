'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
  AlertBand,
  KpiStrip,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';

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
}

function formatZar(n: number) {
  return `R${Number(n || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PortalBillingPage() {
  const { user } = usePortalAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portal/billing')
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const overdue = invoices.filter((i) => i.status === 'overdue');
  const outstanding = invoices
    .filter((i) => !['paid', 'cancelled', 'refunded'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.amount_due || 0), 0);
  const clinicLines = invoices.reduce(
    (sum, inv) => sum + (inv.line_items?.length ?? 0),
    0
  );

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
        subtitle={`Itemised Unjani Connect billing for ${user.organisation_name}`}
        actions={
          <Link href="/portal/billing/statement">
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
            label: 'Outstanding',
            value: formatZar(outstanding),
            note: 'Open balance',
          },
          {
            label: 'Invoices',
            value: String(invoices.length),
            note: 'All periods',
          },
          {
            label: 'Overdue',
            value: String(overdue.length),
            note: 'Need attention',
          },
          {
            label: 'Clinic lines',
            value: String(clinicLines),
            note: 'Itemised services',
          },
        ]}
      />

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading invoices…
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          No invoices found.
        </div>
      ) : (
        <RuledTable
          headers={['Invoice', 'Period', 'Total', 'Due', 'Status', 'Actions']}
        >
          {invoices.map((inv) => {
            const expanded = expandedId === inv.id;
            const lines = inv.line_items ?? [];
            return (
              <React.Fragment key={inv.id}>
                <tr
                  style={{
                    borderBottom: '1px solid var(--pm-divider)',
                    borderLeft:
                      inv.status === 'overdue'
                        ? '3px solid #DC2626'
                        : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {inv.invoice_number}
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
                    <div className="flex gap-2">
                      <PmButton
                        variant="ghost"
                        onClick={() =>
                          setExpandedId(expanded ? null : inv.id)
                        }
                      >
                        {expanded ? 'Hide lines' : 'Clinics'}
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
                    <td colSpan={6} className="px-4 py-3" style={{ background: 'var(--pm-surface)' }}>
                      {lines.length === 0 ? (
                        <p className="text-sm opacity-70">No line items on this invoice.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left py-1 font-extrabold text-[11px] uppercase" style={{ color: 'var(--pm-navy)' }}>
                                Service / clinic
                              </th>
                              <th className="text-right py-1 font-extrabold text-[11px] uppercase" style={{ color: 'var(--pm-navy)' }}>
                                Qty
                              </th>
                              <th className="text-right py-1 font-extrabold text-[11px] uppercase" style={{ color: 'var(--pm-navy)' }}>
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
                                <td className="py-1.5 text-right font-medium" style={{ color: 'var(--pm-navy)' }}>
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
