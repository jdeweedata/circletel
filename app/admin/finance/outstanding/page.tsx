'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleVerifyPayments = async () => {
    if (selectedInvoices.size === 0) return;

    setVerifying(true);
    setVerificationResults([]);

    try {
      const response = await fetch('/api/admin/finance/outstanding-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceIds: Array.from(selectedInvoices),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResults(data.results);
        // Refresh the list after verification
        await fetchOutstandingInvoices();
        setSelectedInvoices(new Set());
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

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

  const getStatusBadge = (invoice: OutstandingInvoice) => {
    if (invoice.days_overdue > 30) {
      return <Badge variant="destructive">Severely Overdue</Badge>;
    }
    if (invoice.days_overdue > 0) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{invoice.days_overdue} days overdue</Badge>;
    }
    if (invoice.status === 'partial') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partial</Badge>;
    }
    return <Badge variant="secondary">Unpaid</Badge>;
  };

  const getMandateBadge = (hasMandate: boolean) => {
    if (hasMandate) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CreditCard className="h-3 w-3 mr-1" />
          Mandate Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-400">
        <XCircle className="h-3 w-3 mr-1" />
        No Mandate
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(inv => {
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outstanding Invoices</h1>
          <p className="text-gray-600">Monitor and verify payment status for unpaid invoices</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOutstandingInvoices}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleVerifyPayments}
            disabled={selectedInvoices.size === 0 || verifying}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Verify Selected ({selectedInvoices.size})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.total_outstanding)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total_invoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                Overdue Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.total_overdue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.overdue_invoices} overdue invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="h-4 w-4 mr-1 text-green-500" />
                With Active Mandate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.invoices_with_mandate}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-collection enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-orange-500" />
                Without Mandate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.invoices_without_mandate}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Manual follow-up required
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Results */}
      {verificationResults.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verification Results</CardTitle>
          </CardHeader>
          <CardContent>
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
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Paid</span>
                      </>
                    ) : result.paymentStatus === 'not_found' ? (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">Pending</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">{result.error || 'Failed'}</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoices found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No outstanding invoices found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
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
                        onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
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
                      <div className="font-semibold">{formatCurrency(invoice.amount_due)}</div>
                      {invoice.amount_paid > 0 && (
                        <div className="text-xs text-green-600">
                          Paid: {formatCurrency(invoice.amount_paid)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(invoice.due_date)}</div>
                      {invoice.days_overdue > 0 && (
                        <div className="text-xs text-red-500">
                          {invoice.days_overdue} days ago
                        </div>
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
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
