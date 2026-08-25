'use client';

import {
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCreditCardBold,
  PiDownloadSimpleBold,
  PiFileTextBold,
  PiMagnifyingGlassBold,
  PiSpinnerBold,
  PiTrendDownBold,
  PiWarningCircleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPage,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/backend';
import {
  HealthCard,
  csvCell,
  downloadCsv,
  formatRand,
  formatDueDate,
} from '@/components/admin/billing/health';

interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  status: 'unpaid' | 'partial' | 'overdue';
  invoice_type: string;
  payment_collection_method: string | null;
  has_active_mandate: boolean;
  created_at: string;
}

interface Summary {
  total_outstanding: number;
  total_overdue: number;
  total_invoices: number;
  overdue_invoices: number;
  invoices_with_mandate: number;
  invoices_without_mandate: number;
}

interface VerificationResult {
  invoiceId: string;
  invoiceNumber: string;
  success: boolean;
  paymentStatus?: string;
  error?: string;
}

export default function OutstandingInvoicesPage() {
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOutstandingInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/finance/outstanding-invoices?status=${statusFilter}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.invoices);
        setSummary(data.data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch outstanding invoices');
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load outstanding invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOutstandingInvoices();
  }, [fetchOutstandingInvoices]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const next = new Set(selectedInvoices);
    if (checked) next.add(invoiceId);
    else next.delete(invoiceId);
    setSelectedInvoices(next);
  };

  const handleVerifyPayments = async (ids?: string[]) => {
    const invoiceIds = ids ?? Array.from(selectedInvoices);
    if (invoiceIds.length === 0) return;

    setVerifying(true);
    setVerificationResults([]);

    try {
      const response = await fetch('/api/admin/finance/outstanding-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResults(data.results);
        await fetchOutstandingInvoices();
        setSelectedInvoices(new Set());
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (invoice: OutstandingInvoice) => {
    if (invoice.days_overdue > 30) {
      return <StatusBadge status="Severely Overdue" variant="error" />;
    }
    if (invoice.days_overdue > 0) {
      return <StatusBadge status={`${invoice.days_overdue} days overdue`} variant="error" />;
    }
    if (invoice.status === 'partial') {
      return <StatusBadge status="Partial" variant="warning" />;
    }
    return <StatusBadge status="Unpaid" variant="neutral" />;
  };

  const getMandateBadge = (hasMandate: boolean) =>
    hasMandate ? (
      <StatusBadge status="Mandate Active" variant="success" icon={<PiCreditCardBold className="h-3 w-3" />} />
    ) : (
      <StatusBadge status="No Mandate" variant="neutral" icon={<PiXCircleBold className="h-3 w-3" />} />
    );

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(search) ||
      inv.customer_name.toLowerCase().includes(search) ||
      inv.customer_email.toLowerCase().includes(search)
    );
  });

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`outstanding-invoices-${today}.csv`, [
      ['Invoice #', 'Customer', 'Email', 'Total', 'Paid', 'Amount due', 'Due date', 'Days overdue', 'Status', 'Mandate'],
      ...filteredInvoices.map((inv) => [
        csvCell(inv.invoice_number),
        csvCell(inv.customer_name),
        csvCell(inv.customer_email),
        inv.total_amount.toFixed(2),
        inv.amount_paid.toFixed(2),
        inv.amount_due.toFixed(2),
        inv.due_date,
        inv.days_overdue,
        inv.status,
        inv.has_active_mandate ? 'active' : 'none',
      ]),
    ]);
  };

  if (error && invoices.length === 0) {
    return (
      <AdminPage>
        <ErrorState
          title="Unable to load outstanding invoices"
          message={error}
          onRetry={fetchOutstandingInvoices}
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-xs text-slate-400">Finance / Receivables / Outstanding</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Outstanding Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor and verify payment status for unpaid invoices</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchOutstandingInvoices}
            disabled={loading || verifying}
            aria-label="Refresh outstanding invoices"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => handleVerifyPayments()}
            disabled={selectedInvoices.size === 0 || verifying}
          >
            {verifying ? (
              <PiSpinnerBold className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PiCheckCircleBold className="mr-2 h-4 w-4" />
            )}
            Verify Selected ({selectedInvoices.size})
          </Button>
        </div>
      </div>

      {error && invoices.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm"
        >
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HealthCard
            label="Total Outstanding"
            value={formatRand(summary.total_outstanding)}
            primaryLine={`${summary.total_invoices} invoices`}
            secondaryLine="Unpaid and partially paid"
            icon={<PiFileTextBold className="h-5 w-5" />}
            iconClassName="bg-orange-50 text-orange-500"
          />
          <HealthCard
            label="Overdue Amount"
            value={formatRand(summary.total_overdue)}
            primaryLine={`${summary.overdue_invoices} overdue invoices`}
            primaryClassName={summary.overdue_invoices > 0 ? 'text-red-600' : undefined}
            secondaryLine="Past due date"
            icon={<PiWarningCircleBold className="h-5 w-5" />}
            iconClassName="bg-red-50 text-red-600"
          />
          <HealthCard
            label="With Active Mandate"
            value={String(summary.invoices_with_mandate)}
            primaryLine="Auto-collection enabled"
            primaryClassName="text-teal-600"
            secondaryLine="Debit order on file"
            icon={<PiCreditCardBold className="h-5 w-5" />}
            iconClassName="bg-teal-50 text-teal-600"
          />
          <HealthCard
            label="Without Mandate"
            value={String(summary.invoices_without_mandate)}
            primaryLine="Manual follow-up required"
            primaryClassName="text-orange-500"
            secondaryLine="No payment method on file"
            icon={<PiTrendDownBold className="h-5 w-5" />}
            iconClassName="bg-orange-50 text-orange-500"
          />
        </div>
      )}

      {verificationResults.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Verification Results</h2>
            <p className="mt-0.5 text-sm text-slate-500">Latest NetCash payment status check</p>
          </div>
          <div className="space-y-2 px-6 py-4">
            {verificationResults.map((result) => (
              <div
                key={result.invoiceId}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  result.paymentStatus === 'paid'
                    ? 'border-teal-200 bg-teal-50'
                    : result.success
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-red-200 bg-red-50'
                }`}
              >
                <span className="font-medium text-slate-900">{result.invoiceNumber}</span>
                <span className="flex items-center gap-2">
                  {result.paymentStatus === 'paid' ? (
                    <>
                      <PiCheckCircleBold className="h-4 w-4 text-teal-600" />
                      <span className="font-medium text-teal-700">Paid</span>
                    </>
                  ) : result.paymentStatus === 'not_found' ? (
                    <>
                      <PiClockBold className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-700">Pending</span>
                    </>
                  ) : (
                    <>
                      <PiXCircleBold className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-700">{result.error || 'Failed'}</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Outstanding Invoices</h2>
            <p className="mt-0.5 text-sm text-slate-500">{filteredInvoices.length} invoices found</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] rounded-lg border-slate-200" aria-label="Filter by status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outstanding</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200"
              onClick={handleExport}
              disabled={filteredInvoices.length === 0}
            >
              <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {loading && invoices.length === 0 ? (
          <div className="px-6 py-12">
            <LoadingState message="Loading outstanding invoices..." />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState icon={<PiFileTextBold />} title="No outstanding invoices found" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-12 pl-6">
                    <Checkbox
                      checked={
                        selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all invoices"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Invoice</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Amount due</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment method</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span className="sr-only">Verify</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-100">
                    <TableCell className="pl-6">
                      <Checkbox
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={(checked) =>
                          handleSelectInvoice(invoice.id, checked as boolean)
                        }
                        aria-label={`Select invoice ${invoice.invoice_number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{invoice.invoice_number}</div>
                      <div className="text-xs capitalize text-slate-400">
                        {invoice.invoice_type.replace(/_/g, ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{invoice.customer_name}</div>
                      <div className="text-xs text-slate-500">{invoice.customer_email}</div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-sm font-semibold tabular-nums ${
                          invoice.days_overdue > 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {formatRand(invoice.amount_due)}
                      </div>
                      {invoice.amount_paid > 0 && (
                        <div className="text-xs text-teal-600 tabular-nums">
                          Paid: {formatRand(invoice.amount_paid)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="whitespace-nowrap text-sm text-slate-500">
                        {formatDueDate(invoice.due_date)}
                      </div>
                      {invoice.days_overdue > 0 && (
                        <div className="text-xs font-medium text-red-600">
                          {invoice.days_overdue} days ago
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice)}</TableCell>
                    <TableCell>{getMandateBadge(invoice.has_active_mandate)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleVerifyPayments([invoice.id])}
                        disabled={verifying}
                        title={`Verify payment for ${invoice.invoice_number}`}
                        aria-label={`Verify payment for ${invoice.invoice_number}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <PiArrowsClockwiseBold className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
