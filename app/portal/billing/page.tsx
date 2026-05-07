'use client';

import React, { useEffect, useState } from 'react';
import {
  PiCurrencyDollarBold,
  PiDownloadSimpleBold,
  PiCaretDownBold,
  PiCaretUpBold,
  PiWarningBold,
} from 'react-icons/pi';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';

interface LineItem {
  description?: string;
  site_name?: string;
  service?: string;
  amount?: number;
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
  payment_method: string | null;
  pdf_url: string | null;
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

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PiCurrencyDollarBold className="w-7 h-7 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 mt-0.5">Invoice history for {user.organisation_name}</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <PiWarningBold className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            You have <strong>{overdueCount}</strong> overdue invoice{overdueCount > 1 ? 's' : ''}. Please arrange payment as soon as possible.
          </p>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No invoices found.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Period</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Due</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Due Date</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => {
                const isExpanded = expandedId === inv.id;
                const isOverdue = inv.status === 'overdue';
                const lineItems = Array.isArray(inv.line_items) ? inv.line_items : [];

                return (
                  <React.Fragment key={inv.id}>
                    <tr className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                          className="flex items-center gap-1 font-medium text-gray-900 hover:text-circleTel-orange"
                        >
                          {isExpanded ? (
                            <PiCaretUpBold className="w-3 h-3" />
                          ) : (
                            <PiCaretDownBold className="w-3 h-3" />
                          )}
                          {inv.invoice_number}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {inv.period_start && inv.period_end
                          ? `${formatDate(inv.period_start)} – ${formatDate(inv.period_end)}`
                          : formatDate(inv.invoice_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        R{inv.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={isOverdue ? 'font-semibold text-red-700' : 'text-gray-600'}>
                          R{inv.amount_due.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.pdf_url && (
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloading === inv.id}
                            className="inline-flex items-center gap-1 text-xs text-circleTel-orange hover:underline disabled:opacity-50"
                          >
                            <PiDownloadSimpleBold className="w-4 h-4" />
                            {downloading === inv.id ? '...' : 'PDF'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && lineItems.length > 0 && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 px-8 py-4">
                          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                            Line Items
                          </p>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 text-xs">
                                <th className="text-left pb-2">Description</th>
                                <th className="text-left pb-2 hidden sm:table-cell">Site</th>
                                <th className="text-right pb-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {lineItems.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-1.5 text-gray-900">
                                    {item.description || item.service || '—'}
                                  </td>
                                  <td className="py-1.5 text-gray-500 hidden sm:table-cell">
                                    {item.site_name || '—'}
                                  </td>
                                  <td className="py-1.5 text-right text-gray-900">
                                    {item.amount != null ? `R${item.amount.toFixed(2)}` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex justify-between">
                            <span>
                              Subtotal: R{inv.subtotal.toFixed(2)} | VAT ({inv.vat_rate}%): R{inv.vat_amount.toFixed(2)}
                            </span>
                            <span className="font-medium text-gray-900">
                              Total: R{inv.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    draft: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
