'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PiPrinterBold,
  PiDownloadSimpleBold,
  PiPaperPlaneRightBold,
  PiSpinnerBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { Card, CardContent } from '@/components/ui/card';
import { COMPANY_DETAILS } from '@/lib/invoices/invoice-pdf-generator';
import type {
  StatementData,
} from '@/lib/billing/statement-pdf-generator';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatementPreviewProps {
  customerId: string;
  apiEndpoint: string;
  showEmailButton?: boolean;
  emailEndpoint?: string;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatementPreview({
  customerId,
  apiEndpoint,
  showEmailButton = false,
  emailEndpoint,
  pdfEndpoint,
}: StatementPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [period, setPeriod] = useState<'3m' | '6m' | '12m' | 'all'>('3m');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Inject print-specific CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page { size: A4; margin: 15mm; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        /* Hide admin layout chrome */
        header { display: none !important; }
        [data-testid="sidebar"] { display: none !important; }
        /* Page-break rules */
        .statement-header, .customer-section, .transactions-section, .aging-section, .banking-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch statement data
  useEffect(() => {
    const fetchStatement = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = customerId
          ? `${apiEndpoint}/${customerId}?period=${period}`
          : `${apiEndpoint}?period=${period}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setStatement(data.statement);
        } else {
          setError(data.error || 'Failed to load statement');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load statement');
      } finally {
        setLoading(false);
      }
    };
    fetchStatement();
  }, [period, customerId, apiEndpoint]);

  const handleEmailStatement = async () => {
    if (!emailRecipient || !statement || !emailEndpoint) return;

    setEmailSending(true);
    try {
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          recipientEmail: emailRecipient,
          period,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }
      alert(`Statement successfully sent to ${emailRecipient}`);
      setShowEmailDialog(false);
      setEmailRecipient('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      console.error('Email error:', err);
      alert(`Failed to send email: ${message}`);
    } finally {
      setEmailSending(false);
    }
  };

  const openEmailDialog = () => {
    if (statement) {
      setEmailRecipient(statement.customer.email || '');
      setShowEmailDialog(true);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfEndpoint || !statement) {
      window.print();
      return;
    }
    setDownloading(true);
    try {
      // Admin has customerId set; dashboard has customerId=""
      const url = customerId
        ? `${pdfEndpoint}/${customerId}/pdf?period=${period}`
        : `${pdfEndpoint}/pdf?period=${period}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `CircleTel_Statement_${statement.customer.accountNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-circleTel-lightNeutral">
        <div className="text-center">
          <PiSpinnerBold className="w-12 h-12 animate-spin mx-auto text-circleTel-orange mb-4" />
          <p className="text-circleTel-secondaryNeutral">Loading statement...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !statement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-circleTel-lightNeutral p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <PiFileTextBold className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-circleTel-navy mb-2">Statement Not Available</h2>
              <p className="text-circleTel-secondaryNeutral">
                {error || 'This statement could not be loaded.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Running balance ───────────────────────────────────────────────────────────
  let runningBalance = 0;
  const transactionsWithBalance = statement.transactions.map((tx) => {
    runningBalance += parseFloat(String(tx.debit || 0)) - parseFloat(String(tx.credit || 0));
    return { ...tx, runningBalance };
  });

  const { aging, totalDue, totalPaid, customer, statementDate } = statement;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white print:bg-white">
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">

        {/* ── 1. ACTION BAR ── */}
        <div className="print:hidden flex flex-wrap justify-center items-center gap-3 mb-6">
          {/* Period selector */}
          {(['3m', '6m', '12m', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                period === p
                  ? 'bg-circleTel-orange text-white border-circleTel-orange'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-circleTel-orange'
              }`}
            >
              {p === '3m'
                ? 'Last 3 months'
                : p === '6m'
                ? 'Last 6 months'
                : p === '12m'
                ? 'Last 12 months'
                : 'All time'}
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 hidden sm:block" />

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="bg-white text-circleTel-orange border-2 border-circleTel-orange px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-50 transition-colors flex items-center gap-2"
          >
            <PiPrinterBold className="w-4 h-4" />
            Print
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-white text-circleTel-orange border-2 border-circleTel-orange px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <PiSpinnerBold className="w-4 h-4 animate-spin" />
            ) : (
              <PiDownloadSimpleBold className="w-4 h-4" />
            )}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>

          {/* Email (optional) */}
          {showEmailButton && (
            <button
              onClick={openEmailDialog}
              className="bg-circleTel-orange text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <PiPaperPlaneRightBold className="w-4 h-4" />
              Email Statement
            </button>
          )}
        </div>

        {/* ── 2. EMAIL DIALOG ── */}
        {showEmailDialog && (
          <div className="print:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-circleTel-navy mb-4">Email Statement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowEmailDialog(false);
                    setEmailRecipient('');
                  }}
                  disabled={emailSending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailStatement}
                  disabled={!emailRecipient || emailSending}
                  className="flex-1 px-4 py-2 bg-circleTel-orange text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {emailSending ? (
                    <>
                      <PiSpinnerBold className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PiPaperPlaneRightBold className="w-4 h-4" />
                      Send Statement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. HEADER ── */}
        <div className="bg-white mb-6 statement-header">
          <div className="flex justify-between items-center mb-4 pb-2 border-b-4 border-circleTel-orange">
            <Image
              src="/images/circletel-enclosed-logo.png"
              alt="CircleTel Logo"
              width={240}
              height={96}
              className="h-24 w-auto"
              priority
            />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Statement</div>
              <div className="text-sm text-gray-600 mt-1">
                Statement Date: {formatDate(statementDate)}
              </div>
              <div className="text-sm text-gray-600">
                Account: <span className="font-semibold">{customer.accountNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. FROM / TO GRID ── */}
        <div className="grid grid-cols-2 gap-8 mb-8 customer-section">
          {/* FROM */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From</h3>
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-gray-900">{COMPANY_DETAILS.name}</p>
              <p className="text-gray-600">{COMPANY_DETAILS.address.line1}</p>
              <p className="text-gray-600">
                {COMPANY_DETAILS.address.line2}, {COMPANY_DETAILS.address.province}{' '}
                {COMPANY_DETAILS.address.postalCode}
              </p>
              <p className="text-gray-600">{COMPANY_DETAILS.address.country}</p>
              <p className="text-gray-600 mt-1">VAT No: {COMPANY_DETAILS.vatNumber}</p>
              <p className="text-gray-600">Reg No: {COMPANY_DETAILS.registrationNumber}</p>
              <p className="text-gray-600">{COMPANY_DETAILS.contact.email}</p>
              <p className="text-gray-600">{COMPANY_DETAILS.contact.website}</p>
            </div>
          </div>

          {/* TO */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To</h3>
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-gray-900">{customer.name}</p>
              <p className="text-gray-600">Account: {customer.accountNumber}</p>
              {customer.email && <p className="text-gray-600">{customer.email}</p>}
              {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
              {customer.vatNumber && (
                <p className="text-gray-600">VAT No: {customer.vatNumber}</p>
              )}
              {customer.address && (
                <>
                  {customer.address.line1 && (
                    <p className="text-gray-600 mt-1">{customer.address.line1}</p>
                  )}
                  {customer.address.line2 && (
                    <p className="text-gray-600">{customer.address.line2}</p>
                  )}
                  {(customer.address.city || customer.address.province) && (
                    <p className="text-gray-600">
                      {[customer.address.city, customer.address.province]
                        .filter(Boolean)
                        .join(', ')}
                      {customer.address.postalCode ? ` ${customer.address.postalCode}` : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 5. TRANSACTIONS TABLE ── */}
        <div className="mb-8 transactions-section">
          <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Transaction History
          </h3>
          {transactionsWithBalance.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              No transactions found for the selected period.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Date
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Reference
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Description
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Debit (R)
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Credit (R)
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                    Balance (R)
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactionsWithBalance.map((tx, index) => (
                  <tr
                    key={`${tx.reference}-${index}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-3 py-2 border border-gray-200 text-gray-700 whitespace-nowrap">
                      {formatShortDate(tx.date)}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-700 font-mono text-xs">
                      {tx.reference}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-700">
                      {tx.description}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-right text-gray-700">
                      {tx.debit ? formatCurrency(parseFloat(String(tx.debit))) : '—'}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-right text-green-600">
                      {tx.credit ? formatCurrency(parseFloat(String(tx.credit))) : '—'}
                    </td>
                    <td
                      className={`px-3 py-2 border border-gray-200 text-right font-medium ${
                        tx.runningBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(tx.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 6. AGING BUCKETS TABLE ── */}
        <div className="mb-8 aging-section">
          <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Aging Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    120+ Days
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    90 Days
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    60 Days
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    30 Days
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    Current
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    Amount Due
                  </th>
                  <th className="px-3 py-2 font-semibold text-gray-700 border border-gray-200 text-right">
                    Amount Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td
                    className={`px-3 py-2 border border-gray-200 text-right font-medium ${
                      parseFloat(String(aging.over120Days)) > 0
                        ? 'text-red-600 font-bold'
                        : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(parseFloat(String(aging.over120Days)))}
                  </td>
                  <td
                    className={`px-3 py-2 border border-gray-200 text-right font-medium ${
                      parseFloat(String(aging.days90)) > 0 ? 'text-red-500' : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(parseFloat(String(aging.days90)))}
                  </td>
                  <td
                    className={`px-3 py-2 border border-gray-200 text-right font-medium ${
                      parseFloat(String(aging.days60)) > 0 ? 'text-orange-500' : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(parseFloat(String(aging.days60)))}
                  </td>
                  <td
                    className={`px-3 py-2 border border-gray-200 text-right font-medium ${
                      parseFloat(String(aging.days30)) > 0 ? 'text-yellow-600' : 'text-gray-700'
                    }`}
                  >
                    {formatCurrency(parseFloat(String(aging.days30)))}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-right font-medium text-gray-700">
                    {formatCurrency(parseFloat(String(aging.current)))}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-right font-bold text-circleTel-orange">
                    {formatCurrency(parseFloat(String(totalDue)))}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-right font-bold text-green-600">
                    {formatCurrency(parseFloat(String(totalPaid)))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 7. BANKING DETAILS ── */}
        <div className="mb-8 banking-section">
          <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Banking Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900">{COMPANY_DETAILS.banking.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.accountNumber}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Branch Code</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.branchCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-circleTel-orange font-mono">
                  {customer.accountNumber}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Please use your account number as payment reference:{' '}
            <strong>{customer.accountNumber}</strong>
          </p>
        </div>

        {/* ── 8. FOOTER ── */}
        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
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
