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
import React, { useState, useEffect } from 'react';
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
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

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
  payment_method: string | null;
  has_active_mandate: boolean;
  order_number: string | null;
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
  const [verifying, setVerifying] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOutstandingInvoices();
  }, [statusFilter]);

  const fetchOutstandingInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/finance/outstanding-invoices?status=${statusFilter}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.invoices);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleVerifyPayments = async () => {
    if (selectedInvoices.size === 0) return;

    setVerifying(true);
    setVerificationResults([]);

    try {
      const response = await fetch('/api/admin/finance/outstanding-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selectedInvoices) }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResults(data.results);
        await fetchOutstandingInvoices();
        setSelectedInvoices(new Set());
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
      inv.customer_email.toLowerCase().includes(search) ||
      inv.order_number?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminPage>
      <PageHeader
        title="Outstanding Invoices"
        subtitle="Monitor and verify payment status for unpaid invoices"
        actions={
          <>
            <Button variant="outline" onClick={fetchOutstandingInvoices} disabled={loading}>
              <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleVerifyPayments}
              disabled={selectedInvoices.size === 0 || verifying}
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
            >
              {verifying ? (
                <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PiCheckCircleBold className="h-4 w-4 mr-2" />
              )}
              Verify Selected ({selectedInvoices.size})
            </Button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Outstanding"
            value={formatCurrency(summary.total_outstanding)}
            icon={<PiFileTextBold className="h-5 w-5" />}
            subtitle={`${summary.total_invoices} invoices`}
          />
          <StatCard
            label="Overdue Amount"
            value={formatCurrency(summary.total_overdue)}
            icon={<PiWarningCircleBold className="h-5 w-5" />}
            subtitle={`${summary.overdue_invoices} overdue invoices`}
          />
          <StatCard
            label="With Active Mandate"
            value={summary.invoices_with_mandate}
            icon={<PiCreditCardBold className="h-5 w-5" />}
            subtitle="Auto-collection enabled"
          />
          <StatCard
            label="Without Mandate"
            value={summary.invoices_without_mandate}
            icon={<PiTrendDownBold className="h-5 w-5" />}
            subtitle="Manual follow-up required"
          />
        </div>
      )}

      {verificationResults.length > 0 && (
        <SectionCard title="Verification Results">
          <div className="space-y-2">
            {verificationResults.map((result) => (
              <div
                key={result.invoiceId}
                className={`flex items-center justify-between p-2 rounded ${
                  result.paymentStatus === 'paid'
                    ? 'bg-green-100'
                    : result.success
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                }`}
              >
                <span className="font-medium">{result.invoiceNumber}</span>
                <span className="flex items-center gap-2">
                  {result.paymentStatus === 'paid' ? (
                    <>
                      <PiCheckCircleBold className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Paid</span>
                    </>
                  ) : result.paymentStatus === 'not_found' ? (
                    <>
                      <PiClockBold className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">Pending</span>
                    </>
                  ) : (
                    <>
                      <PiXCircleBold className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">{result.error || 'Failed'}</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by invoice, customer, or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outstanding</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Outstanding Invoices"
        action={<span className="text-sm text-gray-500">{filteredInvoices.length} invoices found</span>}
      >
        {loading ? (
          <LoadingState message="Loading outstanding invoices..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState icon={<PiFileTextBold />} title="No outstanding invoices found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoices.has(invoice.id)}
                      onCheckedChange={(checked) =>
                        handleSelectInvoice(invoice.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.invoice_number}</div>
                    {invoice.order_number && (
                      <div className="text-xs text-gray-500">{invoice.order_number}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.customer_name}</div>
                    <div className="text-xs text-gray-500">{invoice.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold tabular-nums">
                      {formatCurrency(invoice.amount_due)}
                    </div>
                    {invoice.amount_paid > 0 && (
                      <div className="text-xs text-green-600 tabular-nums">
                        Paid: {formatCurrency(invoice.amount_paid)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(invoice.due_date)}</div>
                    {invoice.days_overdue > 0 && (
                      <div className="text-xs text-red-500">{invoice.days_overdue} days ago</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice)}</TableCell>
                  <TableCell>{getMandateBadge(invoice.has_active_mandate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoices(new Set([invoice.id]));
                        handleVerifyPayments();
                      }}
                      disabled={verifying}
                    >
                      <PiArrowsClockwiseBold className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </AdminPage>
  );
}
