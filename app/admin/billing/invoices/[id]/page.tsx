'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader2,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Zap,
  ExternalLink
} from 'lucide-react';

interface Payment {
  id: string;
  transaction_id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  provider: string;
  zoho_payment_id: string | null;
  zoho_sync_status: string;
  zoho_last_synced_at: string | null;
  zoho_last_sync_error: string | null;
  initiated_at: string;
  completed_at: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  vat_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    business_name: string | null;
  } | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceData {
  invoice: Invoice;
  payments: Payment[];
  lineItems: LineItem[];
  summary: {
    totalPaid: number;
    paymentCount: number;
    remainingBalance: number;
  };
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
    }
  }, [params.id]);

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/billing/invoices/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch invoice');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'sent':
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'void':
        return <Badge className="bg-gray-100 text-gray-800">Void</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      case 'skipped':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return 'Unknown';
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Invoice not found'}
            </h2>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, payments, lineItems, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-600 text-sm">
              Created {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(invoice.total_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${summary.remainingBalance > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <DollarSign className={`h-5 w-5 ${summary.remainingBalance > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance Due</p>
                <p className={`text-xl font-bold ${summary.remainingBalance > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {formatCurrency(summary.remainingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payments Made</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.paymentCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Invoice Details */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.customer.first_name} {invoice.customer.last_name}
                    </p>
                    {invoice.customer.business_name && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {invoice.customer.business_name}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{invoice.customer.email}</p>
                    {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
                  </div>
                  <Link href={`/admin/customers/${invoice.customer.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Customer
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No customer linked</p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal || invoice.total_amount * 0.87)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT (15%)</span>
                  <span>{formatCurrency(invoice.vat_amount || invoice.total_amount * 0.13)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="font-bold">{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.paid_at && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Paid On</span>
                    <span className="text-green-600 font-medium">
                      {formatDate(invoice.paid_at)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                All payments made against this invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payments recorded yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Payments will appear here once received
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPaymentMethod(payment.payment_method)} via {payment.provider}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {payment.completed_at ? formatDateTime(payment.completed_at) : '-'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ref: {payment.transaction_id?.substring(0, 12)}...
                          </p>
                        </div>
                      </div>

                      {/* ZOHO Sync Status */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">ZOHO Sync</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSyncStatusBadge(payment.zoho_sync_status)}
                          {payment.zoho_payment_id && (
                            <span className="text-xs text-gray-500">
                              ID: {payment.zoho_payment_id}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Show sync error if failed */}
                      {payment.zoho_sync_status === 'failed' && payment.zoho_last_sync_error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                          <strong>Error:</strong> {payment.zoho_last_sync_error}
                        </div>
                      )}

                      {/* Last synced time */}
                      {payment.zoho_last_synced_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Last synced: {formatDateTime(payment.zoho_last_synced_at)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
