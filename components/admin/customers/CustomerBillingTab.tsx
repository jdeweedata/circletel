'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  FileText,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { CustomerPaymentMethods } from './CustomerPaymentMethods';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface CustomerService {
  id: string;
  customer_id: string;
  package_id: string;
  status: string;
  monthly_price: number;
  billing_day: number;
  last_invoice_date: string | null;
  package: ServicePackage | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  service_id: string | null;
  paynow_url: string | null;
}

interface CustomerBillingTabProps {
  customerId: string;
}

export function CustomerBillingTab({ customerId }: CustomerBillingTabProps) {
  const [services, setServices] = useState<CustomerService[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/billing-services`);
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setServices(data.services || []);
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [customerId]);

  const handleBillingDayChange = async (serviceId: string, newDay: string) => {
    try {
      setActionLoading(`billing-${serviceId}`);

      const response = await fetch(
        `/api/admin/customers/${customerId}/billing-services/${serviceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billing_day: newDay }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update billing day');
      }

      setActionResult({ type: 'success', message: 'Billing day updated' });
      fetchBillingData();
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 3000);
    }
  };

  const handleGenerateInvoice = async (serviceId: string) => {
    try {
      setActionLoading(`generate-${serviceId}`);

      const response = await fetch(`/api/admin/customers/${customerId}/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      setActionResult({
        type: 'success',
        message: `Invoice ${data.invoice?.invoice_number} created! Email: ${data.emailSent ? '✓' : '✗'} SMS: ${data.smsSent ? '✓' : '✗'}`,
      });
      fetchBillingData();
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Generation failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 5000);
    }
  };

  const handleSendPayNow = async (invoiceId: string) => {
    try {
      setActionLoading(`paynow-${invoiceId}`);

      const response = await fetch(`/api/admin/customers/${customerId}/send-paynow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send Pay Now');
      }

      setActionResult({
        type: 'success',
        message: `Pay Now sent! Email: ${data.emailSent ? '✓' : '✗'} SMS: ${data.smsSent ? '✓' : '✗'}`,
      });
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Send failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 5000);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800">Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading billing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchBillingData} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionResult.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Services & Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-circleTel-orange" />
            Services & Billing Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No services found</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {service.package?.name || 'Unknown Package'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(service.monthly_price || service.package?.price || 0)}/month
                        {' • '}
                        <Badge
                          className={
                            service.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {service.status}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Billing Day:</span>
                      <Select
                        value={String(service.billing_day || 1)}
                        onValueChange={(value) => handleBillingDayChange(service.id, value)}
                        disabled={actionLoading === `billing-${service.id}`}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-sm text-gray-500">
                      Last Billed:{' '}
                      {service.last_invoice_date
                        ? formatDate(service.last_invoice_date)
                        : 'Never'}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateInvoice(service.id)}
                        disabled={
                          actionLoading === `generate-${service.id}` ||
                          service.status !== 'active'
                        }
                        className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                      >
                        {actionLoading === `generate-${service.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <FileText className="h-4 w-4 mr-1" />
                        )}
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Invoice History
          </CardTitle>
          <Link href={`/admin/billing/invoices?customer=${customerId}`}>
            <Button variant="ghost" size="sm">
              View All <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices found</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">
                        Due {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendPayNow(invoice.id)}
                        disabled={actionLoading === `paynow-${invoice.id}`}
                      >
                        {actionLoading === `paynow-${invoice.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <CustomerPaymentMethods customerId={customerId} />
    </div>
  );
}
