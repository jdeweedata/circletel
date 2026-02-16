/**
 * Invoice Payment Page
 * /dashboard/invoices/[id]/pay
 * 
 * Allows customer to pay an invoice via NetCash
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pay Invoice | CircleTel',
  description: 'Pay your invoice securely',
};

interface PayInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function PayInvoicePage({ params }: PayInvoicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/dashboard/invoices/' + id + '/pay');
  }

  // Get customer record
  const { data: customer } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email')
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

  // If already paid, redirect to invoice page
  if (invoice.status === 'paid') {
    redirect(`/dashboard/invoices/${id}`);
  }

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
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/dashboard/invoices/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice
        </Link>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Pay Invoice</CardTitle>
          <CardDescription>
            Complete your payment for {invoice.invoice_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
            <Separator />
            {lineItems.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (15%)</span>
              <span>{formatCurrency(invoice.tax_amount || invoice.vat_amount || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Due</span>
              <span className="text-primary">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-4">Select Payment Method</h3>
            <div className="space-y-3">
              <Button className="w-full h-auto py-4 justify-start" variant="outline" asChild>
                <Link href={`/api/payments/netcash/invoice/${id}`}>
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">Pay with Card or EFT</p>
                      <p className="text-sm text-muted-foreground">
                        Credit Card, Debit Card, Instant EFT, Capitec Pay
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Secure Payment</p>
              <p>Your payment is processed securely through NetCash, a PCI-DSS compliant payment gateway.</p>
            </div>
          </div>

          {/* EFT Details */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Manual EFT Payment</h4>
            <p className="text-sm text-muted-foreground mb-3">
              If you prefer to pay via manual EFT, please use the following details:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">First National Bank (FNB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium">CircleTel (Pty) Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-medium">62123456789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch Code</span>
                <span className="font-medium">250655</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium text-primary">{invoice.invoice_number}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Please allow 1-2 business days for manual EFT payments to reflect.
            </p>
          </div>

          {/* Help */}
          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:contactus@circletel.co.za" className="text-primary hover:underline">
              contactus@circletel.co.za
            </a>{' '}
            or call{' '}
            <a href="tel:+27870876305" className="text-primary hover:underline">
              082 487 3900
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
