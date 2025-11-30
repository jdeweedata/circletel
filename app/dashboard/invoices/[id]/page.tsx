/**
 * Invoice Detail Page
 * /dashboard/invoices/[id]
 * 
 * Displays invoice details and allows customer to view/download invoice
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Invoice Details | CircleTel',
  description: 'View your invoice details',
};

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/dashboard/invoices/' + id);
  }

  // Get customer record
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!customer) {
    redirect('/login');
  }

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('customer_invoices')
    .select('*')
    .eq('id', id)
    .eq('customer_id', customer.id)
    .single();

  if (invoiceError || !invoice) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-500">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const lineItems = invoice.line_items || [];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/billing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{invoice.invoice_number}</CardTitle>
                <CardDescription>
                  Invoice Date: {formatDate(invoice.invoice_date)}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-medium">{formatCurrency(invoice.subtotal || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VAT (15%)</p>
              <p className="font-medium">{formatCurrency(invoice.tax_amount || invoice.vat_amount || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-lg text-primary">{formatCurrency(invoice.total_amount)}</p>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-4">Invoice Items</h3>
            <div className="space-y-3">
              {lineItems.length > 0 ? (
                lineItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} x {formatCurrency(item.unit_price || item.amount)}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">{formatCurrency(item.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No line items</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {invoice.status !== 'paid' && (
              <Button asChild className="flex-1">
                <Link href={`/dashboard/invoices/${id}/pay`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Link>
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* Payment Info */}
          {invoice.status !== 'paid' && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Payment Information</h4>
              <p className="text-sm text-muted-foreground">
                Payment is due by {formatDate(invoice.due_date)}. You can pay online using credit card, 
                instant EFT, or set up a debit order. For EFT payments, please use your invoice number 
                ({invoice.invoice_number}) as the reference.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
