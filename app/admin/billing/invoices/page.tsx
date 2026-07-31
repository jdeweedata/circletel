'use client';

import {
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiDotsThreeBold,
  PiDownloadSimpleBold,
  PiEnvelopeBold,
  PiEyeBold,
  PiFileTextBold,
  PiMagnifyingGlassBold,
  PiPlusBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminPage,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';
import {
  HealthCard,
  csvCell,
  downloadCsv,
  formatRand,
  formatDueDate,
} from '@/components/admin/billing/health';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  line_items: any[];
}

interface InvoiceStats {
  totalOutstanding: number;
  paidThisMonth: number;
  overdueAmount: number;
  overdueCount: number;
}

const INVOICE_STATUS_VARIANT: Record<string, StatusVariant> = {
  paid: 'success',
  sent: 'info',
  overdue: 'error',
  draft: 'neutral',
  partial: 'warning',
  voided: 'neutral',
  cancelled: 'neutral',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  voided: 'Voided',
  cancelled: 'Voided',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/billing/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.customer_name.toLowerCase().includes(query) ||
      invoice.customer_email.toLowerCase().includes(query)
    );
  });

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`invoices-${today}.csv`, [
      ['Invoice #', 'Customer', 'Email', 'Invoice date', 'Due date', 'Total', 'Paid', 'Due', 'Status'],
      ...filteredInvoices.map((inv) => [
        csvCell(inv.invoice_number),
        csvCell(inv.customer_name),
        csvCell(inv.customer_email),
        inv.invoice_date,
        inv.due_date,
        inv.total_amount.toFixed(2),
        inv.amount_paid.toFixed(2),
        inv.amount_due.toFixed(2),
        inv.status,
      ]),
    ]);
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading invoices..." />
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage>
        <ErrorState title="Unable to load invoices" message={error} onRetry={fetchInvoices} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-xs text-slate-400">Finance / Billing / Invoices</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Manage billing and invoices</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchInvoices}
            disabled={loading}
            aria-label="Refresh invoices"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={handleExport}
            disabled={filteredInvoices.length === 0}
          >
            <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange-dark" disabled>
            <PiPlusBold className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HealthCard
          label="Total Outstanding"
          value={formatRand(stats?.totalOutstanding ?? 0)}
          primaryLine="Unpaid balances"
          primaryClassName="text-orange-500"
          secondaryLine="Sent, partial & overdue"
          icon={<PiFileTextBold className="h-5 w-5" />}
          iconClassName="bg-orange-50 text-orange-500"
        />
        <HealthCard
          label="Paid This Month"
          value={formatRand(stats?.paidThisMonth ?? 0)}
          primaryLine="Collected"
          primaryClassName="text-teal-600"
          secondaryLine="Payments received this month"
          icon={<PiCheckCircleBold className="h-5 w-5" />}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <HealthCard
          label="Overdue"
          value={formatRand(stats?.overdueAmount ?? 0)}
          primaryLine={
            (stats?.overdueCount ?? 0) > 0
              ? `${stats?.overdueCount} invoice${stats?.overdueCount !== 1 ? 's' : ''} overdue`
              : 'No overdue invoices'
          }
          primaryClassName={(stats?.overdueCount ?? 0) > 0 ? 'text-red-600' : undefined}
          secondaryLine="Past due date"
          icon={<PiWarningCircleBold className="h-5 w-5" />}
          iconClassName="bg-red-50 text-red-600"
        />
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All Invoices</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState
              icon={<PiFileTextBold />}
              title={searchQuery ? 'No invoices match your search' : 'No invoices found'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="pl-6 text-xs font-medium uppercase tracking-wide text-slate-400">Invoice</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Amount</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-100">
                    <TableCell className="pl-6">
                      <div className="text-sm font-medium text-slate-900">{invoice.invoice_number}</div>
                      <div className="text-sm text-slate-500">{formatDueDate(invoice.invoice_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{invoice.customer_name}</div>
                      <div className="text-sm text-slate-500">{invoice.customer_email}</div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-sm font-semibold tabular-nums ${
                          invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {formatRand(invoice.total_amount)}
                      </div>
                      {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount && (
                        <div className="text-xs text-slate-500 tabular-nums">
                          Paid: {formatRand(invoice.amount_paid)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          INVOICE_STATUS_LABEL[invoice.status] ??
                          invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
                        }
                        variant={INVOICE_STATUS_VARIANT[invoice.status] ?? 'neutral'}
                      />
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap text-sm ${
                        invoice.status === 'overdue' ? 'font-medium text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {formatDueDate(invoice.due_date)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/billing/invoices/${invoice.id}`}
                          aria-label={`View invoice ${invoice.invoice_number}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <PiEyeBold className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          title="Send Reminder"
                          disabled
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PiEnvelopeBold className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="More actions"
                          disabled
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PiDotsThreeBold className="h-4 w-4" />
                        </button>
                      </div>
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
