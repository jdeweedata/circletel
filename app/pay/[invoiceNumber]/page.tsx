'use client';

/**
 * Public Invoice Payment Page
 * /pay/[invoiceNumber]
 *
 * Allows customers to pay invoices directly without login.
 * Accessible via SMS payment reminder links.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  CheckCircle,
  Shield,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Building2,
  Loader2,
} from 'lucide-react';

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  subtotal: number;
  tax_amount: number;
  line_items: Array<{ description: string; amount: number; quantity?: number }>;
  customer_first_name: string;
  customer_email_masked: string | null;
  paid: boolean;
}

export default function PublicPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceNumber = params.invoiceNumber as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  // Check for URL parameters
  const paymentStatus = searchParams.get('payment');
  const errorParam = searchParams.get('error');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/pay/${invoiceNumber}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'Invoice not found');
          return;
        }

        setInvoice(data.invoice);
      } catch (err) {
        setError('Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceNumber) {
      fetchInvoice();
    }
  }, [invoiceNumber]);

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

  const handlePayNow = () => {
    setInitiatingPayment(true);
    // Redirect to payment initiation endpoint
    window.location.href = `/api/pay/${invoiceNumber}/initiate`;
  };

  // Payment success message
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your payment. A receipt has been sent to your email address.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Invoice: <span className="font-medium">{invoiceNumber}</span>
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">Return to CircleTel</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Login to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment cancelled message
  if (paymentStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment was cancelled. No charges have been made.
            </p>
            <Button onClick={() => window.location.href = `/pay/${invoiceNumber}`} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already paid message
  if (statusParam === 'already_paid' || invoice?.paid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">
              Invoice Already Paid
            </h1>
            <p className="text-muted-foreground mb-6">
              This invoice has already been paid. Thank you!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Invoice: <span className="font-medium">{invoiceNumber}</span>
            </p>
            <Button asChild className="w-full">
              <Link href="/">Return to CircleTel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (errorParam || error) {
    const errorMessages: Record<string, string> = {
      not_found: 'Invoice not found. Please check the invoice number.',
      gateway_error: 'Payment gateway is temporarily unavailable. Please try again later.',
      payment_failed: 'Failed to initiate payment. Please try again.',
      system_error: 'A system error occurred. Please try again later.',
    };

    const errorMessage = errorMessages[errorParam || ''] || error || 'An error occurred.';

    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
              Error
            </h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = `/pay/${invoiceNumber}`} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="tel:0860247253">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support: 0860 247 253
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/20 dark:to-background">
        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main payment page
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/20 dark:to-background pb-24 md:pb-0">
      {/* Header - Orange bar like NetCash */}
      <header className="bg-circleTel-orange">
        <div className="container mx-auto py-3 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/circletel-logo-new.png"
              alt="CircleTel"
              width={120}
              height={40}
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
            Secure Payment
          </Badge>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-lg">
        {/* Total Amount - Prominent like NetCash */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground mb-1">Total:</p>
          <p className="text-4xl font-bold text-foreground">
            {formatCurrency(invoice?.amount_due || 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            CircleTel Invoice {invoice?.invoice_number}
          </p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader className="text-center pb-2 pt-4">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Invoice {invoice?.invoice_number}</CardTitle>
            <CardDescription>
              Due: {invoice?.due_date ? formatDate(invoice.due_date) : 'N/A'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4 pb-4">
            {/* Invoice Summary */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
              {invoice?.line_items && invoice.line_items.length > 0 ? (
                <>
                  {invoice.line_items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                </>
              ) : null}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice?.subtotal || invoice?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span>{formatCurrency(invoice?.tax_amount || 0)}</span>
              </div>

              {(invoice?.amount_paid || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span>-{formatCurrency(invoice?.amount_paid || 0)}</span>
                </div>
              )}

              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Amount Due</span>
                <span className="text-circleTel-orange">{formatCurrency(invoice?.amount_due || 0)}</span>
              </div>
            </div>

            {/* Pay Now Button - Prominent CTA (hidden on mobile, shown in sticky footer) */}
            <div className="hidden md:block">
              <Button
                className="w-full h-12 text-base bg-circleTel-orange hover:bg-circleTel-orange/90"
                size="lg"
                onClick={handlePayNow}
                disabled={initiatingPayment}
              >
                {initiatingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting to Payment Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay {formatCurrency(invoice?.amount_due || 0)} Now
                  </>
                )}
              </Button>
            </div>
              
            {/* Payment Methods */}
            <div className="text-center text-xs text-muted-foreground">
              <p className="mb-1">Accepted payment methods:</p>
              <p>Credit Card • Debit Card • Instant EFT • Capitec Pay</p>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Secure Payment</p>
                <p>
                  Processed securely through NetCash, a PCI-DSS compliant gateway. We never store your card details.
                </p>
              </div>
            </div>

            <Separator />

            {/* Manual EFT Details */}
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Manual EFT Payment
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Prefer to pay via manual EFT? Use these details:
              </p>
              <div className="space-y-1.5 text-xs bg-muted/50 rounded p-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">Standard Bank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name</span>
                  <span className="font-medium">Circle Tel SA (PTY) LTD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium">202413993</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">Current</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch Code</span>
                  <span className="font-medium">051001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium text-circleTel-orange">{invoice?.invoice_number}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Please allow 1-2 business days for manual EFT payments to reflect.
              </p>
            </div>

            {/* Help */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Need help with your payment?</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                <a
                  href="mailto:contactus@circletel.co.za"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  contactus@circletel.co.za
                </a>
                <a
                  href="tel:0860247253"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  0860 247 253
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CircleTel (Pty) Ltd. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            {' • '}
            <Link href="/terms-of-service" className="hover:underline">
              Terms of Service
            </Link>
          </p>
        </footer>
      </main>

      {/* Sticky Mobile Footer - Pay Now Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t shadow-lg p-4 md:hidden z-50">
        <Button
          className="w-full h-12 text-base bg-circleTel-orange hover:bg-circleTel-orange/90"
          size="lg"
          onClick={handlePayNow}
          disabled={initiatingPayment}
        >
          {initiatingPayment ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay {formatCurrency(invoice?.amount_due || 0)} Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
