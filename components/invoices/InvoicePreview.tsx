'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PiPrinterBold,
  PiDownloadSimpleBold,
  PiSpinnerBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { COMPANY_DETAILS } from '@/lib/invoices/invoice-pdf-generator';
import type { InvoicePreviewData } from '@/lib/invoices/invoice-preview-data';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePreviewProps {
  invoiceId: string;
  apiEndpoint: string;
  pdfEndpoint?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatLongDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'paid':    return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'sent':    return 'bg-blue-100 text-blue-800';
    case 'draft':   return 'bg-gray-100 text-gray-800';
    default:        return 'bg-yellow-100 text-yellow-800';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoicePreview({ invoiceId, apiEndpoint, pdfEndpoint }: InvoicePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoicePreviewData | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!pdfEndpoint) { window.print(); return; }
    setDownloading(true);
    try {
      const res = await fetch(`${pdfEndpoint}/${invoiceId}/pdf?download=true`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CircleTel_Invoice_${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Inject print CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'invoice-print-css';
    style.textContent = `
      @media print {
        @page { size: A4; margin: 15mm; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        /* Hide admin layout chrome */
        header { display: none !important; }
        [data-testid="sidebar"] { display: none !important; }
        /* Hide action bar */
        .no-print { display: none !important; }
        /* Page-break rules */
        .invoice-section { page-break-inside: avoid; break-inside: avoid; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('invoice-print-css');
      if (el) document.head.removeChild(el);
    };
  }, []);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/${invoiceId}/preview`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error ?? 'Failed to load invoice');
        } else {
          setInvoice(data.invoice);
        }
      } catch {
        setError('Network error — please try again');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId, apiEndpoint]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <PiSpinnerBold className="h-8 w-8 animate-spin text-[#F5831F] mx-auto mb-2" />
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <PiFileTextBold className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Invoice Not Available</h2>
          <p className="text-gray-500 text-sm">{error ?? 'Failed to fetch invoice data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">

      {/* ── ACTION BAR (hidden on print) ── */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-end gap-3 px-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PiPrinterBold className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#F5831F] rounded-lg hover:bg-[#e07010] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <PiSpinnerBold className="h-4 w-4 animate-spin" />
          ) : (
            <PiDownloadSimpleBold className="h-4 w-4" />
          )}
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-10">

        {/* ── 1. HEADER ── */}
        <div className="invoice-section flex items-start justify-between mb-6">
          <div className="flex-shrink-0">
            <Image
              src="/images/circletel-logo.png"
              alt="CircleTel"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 tracking-wide">TAX INVOICE</h1>
            <p className="text-gray-500 text-sm mt-1">
              Invoice Date: {formatLongDate(invoice.invoiceDate)}
            </p>
            <p className="text-gray-500 text-sm">
              Due Date: {formatLongDate(invoice.dueDate)}
            </p>
            <p className="text-gray-700 font-mono text-sm mt-1">
              {invoice.invoiceNumber}
            </p>
            {invoice.status && (
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusStyle(invoice.status)}`}
              >
                {invoice.status}
              </span>
            )}
          </div>
        </div>

        {/* ── ORANGE RULE ── */}
        <div className="h-1 rounded mb-6" style={{ backgroundColor: '#F5831F' }} />

        {/* ── 2. FROM / TO ── */}
        <div className="invoice-section grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
            <p className="font-bold text-gray-900">{COMPANY_DETAILS.name}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.line1}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.line2}</p>
            <p className="text-sm text-gray-600">
              {COMPANY_DETAILS.address.province} {COMPANY_DETAILS.address.postalCode}
            </p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.country}</p>
            <p className="text-sm text-gray-600 mt-1">VAT No: {COMPANY_DETAILS.vatNumber}</p>
            <p className="text-sm text-gray-600">Reg No: {COMPANY_DETAILS.registrationNumber}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.contact.email}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.contact.website}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">To</p>
            <p className="font-bold text-gray-900">{invoice.customer.name}</p>
            {invoice.customer.accountNumber && (
              <p className="text-sm text-gray-600">Account: {invoice.customer.accountNumber}</p>
            )}
            {invoice.customer.email && (
              <p className="text-sm text-gray-600">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            )}
            {invoice.customer.address?.line1 && (
              <>
                <p className="text-sm text-gray-600 mt-1">{invoice.customer.address.line1}</p>
                {invoice.customer.address.line2 && (
                  <p className="text-sm text-gray-600">{invoice.customer.address.line2}</p>
                )}
                {invoice.customer.address.city && (
                  <p className="text-sm text-gray-600">{invoice.customer.address.city}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 3. LINE ITEMS TABLE ── */}
        <div className="invoice-section mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Line Items
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-600 border border-gray-200">
                  Description
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-16">
                  Qty
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Unit Price (excl)
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-16">
                  VAT %
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Amount (excl)
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Amount (incl)
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 border border-gray-200">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 border border-gray-200">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 border border-gray-200">
                      {item.vat_percent}%
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">
                      {formatCurrency(item.excl_total)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900 border border-gray-200">
                      {formatCurrency(item.incl_total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-3 px-3 text-center text-gray-400 border border-gray-200"
                  >
                    Service Invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. VAT SUMMARY ── */}
        <div className="invoice-section flex justify-end mb-6">
          <div className="w-72 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal (excl VAT)</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT (15%)</span>
              <span className="font-mono">{formatCurrency(invoice.totalVat)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total (incl VAT)</span>
              <span className="font-mono">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* ── 5. PAYMENT SUMMARY ── */}
        <div className="invoice-section flex justify-end mb-8">
          <div className="w-72 bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-mono font-medium text-green-600">
                {formatCurrency(invoice.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Amount Due</span>
              <span
                className={`font-mono ${
                  invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(invoice.amountDue)}
              </span>
            </div>
          </div>
        </div>

        {/* ── 6. BANKING DETAILS ── */}
        <div className="invoice-section mb-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Banking Details
          </h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900">{COMPANY_DETAILS.banking.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Branch Code</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.branchCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-[#F5831F] font-mono">
                  {invoice.customer.accountNumber ?? invoice.invoiceNumber}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Please use your account number as payment reference:{' '}
              <strong>{invoice.customer.accountNumber ?? invoice.invoiceNumber}</strong>
            </p>
          </div>
        </div>

        {/* ── 7. NOTES (conditional) ── */}
        {invoice.notes && (
          <div className="invoice-section mb-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Notes</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{invoice.notes}</p>
          </div>
        )}

        {/* ── 8. FOOTER ── */}
        <div className="border-t border-gray-200 pt-4 mt-6 text-center text-xs text-gray-400">
          <p>
            {COMPANY_DETAILS.name} | Reg: {COMPANY_DETAILS.registrationNumber} | VAT:{' '}
            {COMPANY_DETAILS.vatNumber}
          </p>
          <p>
            {COMPANY_DETAILS.address.line1}, {COMPANY_DETAILS.address.line2} |{' '}
            {COMPANY_DETAILS.contact.email} | {COMPANY_DETAILS.contact.website}
          </p>
        </div>

      </div>
    </div>
  );
}
