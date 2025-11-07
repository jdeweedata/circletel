'use client';

/**
 * Payment Test Page
 *
 * Test NetCash payment integration and webhook processing.
 * Use this page to verify the complete payment flow.
 *
 * /test/payment
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';

export default function PaymentTestPage() {
  const [amount, setAmount] = useState('99.00');
  const [reference, setReference] = useState(`TEST-${Date.now()}`);
  const [email, setEmail] = useState('test@circletel.co.za');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    paymentUrl?: string;
    transactionId?: string;
  } | null>(null);

  const [webhookStatus, setWebhookStatus] = useState<{
    checked: boolean;
    found: boolean;
    status?: string;
    data?: any;
  } | null>(null);

  /**
   * Initiate test payment
   */
  const handlePayment = async () => {
    setLoading(true);
    setResult(null);
    setWebhookStatus(null);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'ZAR',
          reference: reference,
          customer_email: email,
          metadata: {
            test: true,
            test_timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'Payment initiated successfully!',
          paymentUrl: data.payment_url,
          transactionId: data.transaction_id
        });

        // Open payment URL in new tab
        if (data.payment_url) {
          window.open(data.payment_url, '_blank');
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to initiate payment'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check webhook logs for this transaction
   */
  const checkWebhookLogs = async () => {
    if (!result?.transactionId) {
      setWebhookStatus({
        checked: true,
        found: false
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/payments/webhooks?transaction_id=${result.transactionId}`);
      const data = await response.json();

      if (data.webhooks && data.webhooks.length > 0) {
        setWebhookStatus({
          checked: true,
          found: true,
          status: data.webhooks[0].status,
          data: data.webhooks[0]
        });
      } else {
        setWebhookStatus({
          checked: true,
          found: false
        });
      }
    } catch (error) {
      setWebhookStatus({
        checked: true,
        found: false
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">NetCash Payment Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the payment integration and webhook processing
          </p>
        </div>

        {/* Test Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Initiate Test Payment</CardTitle>
            <CardDescription>
              Create a test payment transaction with NetCash Pay Now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="amount">Amount (ZAR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="99.00"
                />
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="TEST-12345"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique reference for this transaction
                </p>
              </div>

              <div>
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@circletel.co.za"
                />
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Initiate Payment'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Result */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <p className="font-medium">{result.message}</p>
              {result.transactionId && (
                <p className="text-sm mt-1">
                  Transaction ID: <code className="bg-muted px-1 py-0.5 rounded">{result.transactionId}</code>
                </p>
              )}
              {result.paymentUrl && (
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                >
                  Open Payment Page <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Webhook Check */}
        {result?.transactionId && (
          <Card>
            <CardHeader>
              <CardTitle>Check Webhook Status</CardTitle>
              <CardDescription>
                After completing payment, check if webhook was received
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkWebhookLogs}
                variant="outline"
                className="w-full"
              >
                Check Webhook Logs
              </Button>

              {webhookStatus && (
                <Alert variant={webhookStatus.found ? 'default' : 'destructive'}>
                  {webhookStatus.found ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {webhookStatus.found ? (
                      <div>
                        <p className="font-medium">Webhook received!</p>
                        <p className="text-sm mt-1">
                          Status: <code className="bg-muted px-1 py-0.5 rounded">{webhookStatus.status}</code>
                        </p>
                        {webhookStatus.data && (
                          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(webhookStatus.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <p>No webhook received yet. Complete the payment and try again.</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">How to test the payment webhook:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click "Initiate Payment" to create a test transaction</li>
                <li>Complete the payment on the NetCash payment page (opens in new tab)</li>
                <li>Return to this page and click "Check Webhook Logs"</li>
                <li>Verify the webhook was received and processed successfully</li>
              </ol>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">NetCash Test Mode:</p>
              <p className="text-muted-foreground">
                If test mode is enabled in NetCash, you can use test card numbers to simulate payments without real transactions.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">Admin Pages:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>
                  <a href="/admin/payments/transactions" className="text-blue-600 hover:underline">
                    View all transactions
                  </a>
                </li>
                <li>
                  <a href="/admin/payments/webhooks" className="text-blue-600 hover:underline">
                    View webhook logs
                  </a>
                </li>
                <li>
                  <a href="/admin/payments/monitoring" className="text-blue-600 hover:underline">
                    View provider health
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
