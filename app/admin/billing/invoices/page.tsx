'use client';
import { PiArrowsClockwiseBold, PiDotsThreeBold, PiDownloadSimpleBold, PiEnvelopeBold, PiEyeBold, PiFileTextBold, PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  PageHeader,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Invoice-specific status semantics, rendered through the canonical StatusBadge.
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

  const getStatusBadge = (status: string) => (
    <StatusBadge
      status={INVOICE_STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
      variant={INVOICE_STATUS_VARIANT[status] ?? 'neutral'}
    />
  );

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.customer_name.toLowerCase().includes(query) ||
      invoice.customer_email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading invoices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Unable to load invoices" message={error} onRetry={fetchInvoices} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage billing and invoices"
        actions={
          <>
            <Button variant="outline" onClick={fetchInvoices}>
              <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-circleTel-orange hover:bg-circleTel-orange-dark" disabled>
              <PiPlusBold className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalOutstanding || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.paidThisMonth || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.overdueAmount || 0)}
            </div>
            {(stats?.overdueCount || 0) > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {stats?.overdueCount} invoice{stats?.overdueCount !== 1 ? 's' : ''} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Export */}
          <div className="mb-4 flex justify-between items-center">
            <div className="relative max-w-md">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent w-full"
              />
            </div>
            <Button variant="outline" disabled>
              <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Table */}
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<PiFileTextBold />}
              title={searchQuery ? 'No invoices match your search' : 'No invoices found'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(invoice.invoice_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                        {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount && (
                          <div className="text-sm text-gray-500">
                            Paid: {formatCurrency(invoice.amount_paid)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/billing/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon" title="View Invoice">
                              <PiEyeBold className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="Send Reminder" disabled>
                            <PiEnvelopeBold className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <PiDotsThreeBold className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
