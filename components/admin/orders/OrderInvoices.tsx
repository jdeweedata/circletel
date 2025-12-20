'use client';

/**
 * OrderInvoices Component
 *
 * Displays invoice list and generation controls in the admin order Financials tab.
 * Features:
 * - Generate Invoice button for creating new invoices
 * - List of existing invoices with status badges
 * - PDF download for each invoice
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
}

interface OrderInvoicesProps {
  orderId: string;
  customerId: string;
  packageName: string;
  packagePrice: number;
  routerFee?: number;
  accountNumber?: string;
  className?: string;
}

export function OrderInvoices({
  orderId,
  customerId,
  packageName,
  packagePrice,
  routerFee,
  accountNumber,
  className
}: OrderInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch invoices for this customer
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/billing/customer-invoices?customer_id=${customerId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch invoices');
      }

      setInvoices(result.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Generate invoice for current/next billing period
  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      // Calculate billing period (current month or next month)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await fetch('/api/admin/billing/generate-order-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          sync_account_number: true
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate invoice');
      }

      setSuccess(`Invoice ${result.invoice.invoice_number} generated successfully!`);
      fetchInvoices(); // Refresh list
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  // Download invoice PDF
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloading(invoice.id);

      const response = await fetch(`/api/admin/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `CircleTel_Invoice_${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      unpaid: { label: 'Unpaid', className: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={cn(
      'relative overflow-hidden border border-gray-200 bg-white',
      'shadow-sm transition-all duration-200 rounded-lg',
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-circleTel-orange" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
              <p className="text-sm text-gray-500">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchInvoices}
              disabled={loading}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateInvoice}
              disabled={generating}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {generating ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Generate Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Invoice List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No invoices generated yet</p>
            <p className="text-sm mt-1">
              Click "Generate Invoice" to create the first invoice for this order.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {invoice.invoice_number}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Invoice Date:</span>
                        <p className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <p className="font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Period:</span>
                        <p className="font-medium text-gray-900">
                          {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(invoice.total_amount as any))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                    disabled={downloading === invoice.id}
                    className="ml-4"
                  >
                    {downloading === invoice.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Summary */}
        {invoices.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Invoices:</span>
              <span className="font-medium">{invoices.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Invoiced:</span>
              <span className="font-semibold">
                {formatCurrency(
                  invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount as any), 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderInvoices;
