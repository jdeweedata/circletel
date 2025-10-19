'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'error'>('checking');
  const [orderId, setOrderId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Parse return parameters from Netcash
    const transactionAccepted = searchParams.get('TransactionAccepted');
    const complete = searchParams.get('Complete');
    const reference = searchParams.get('Reference');
    const reason = searchParams.get('Reason');
    const extra1 = searchParams.get('Extra1'); // Order ID
    const extra2 = searchParams.get('Extra2'); // Order Number

    if (extra1) setOrderId(extra1);
    if (extra2) setOrderNumber(extra2);

    // Check payment status
    if (transactionAccepted === 'true' && complete === 'true') {
      setStatus('success');
      setMessage(reason || 'Payment completed successfully');

      // Redirect to order tracking after 3 seconds
      if (extra1) {
        setTimeout(() => {
          router.push(`/orders/${extra1}?payment=success`);
        }, 3000);
      }
    } else if (complete === 'false' || transactionAccepted === 'false') {
      setStatus('failed');
      setMessage(reason || 'Payment was not completed');
    } else {
      setStatus('error');
      setMessage('Unable to determine payment status');
    }
  }, [searchParams, router]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-circleTel-orange mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
              <p className="text-gray-600">Please wait while we confirm your payment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-2">{message}</p>
              {orderNumber && (
                <p className="text-sm text-gray-500 mb-6">Order: {orderNumber}</p>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Next Steps:</strong>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>✓ Payment confirmation email sent</li>
                    <li>✓ Order status updated</li>
                    <li>✓ Our team will contact you shortly</li>
                  </ul>
                </p>
              </div>

              {orderId ? (
                <>
                  <Button onClick={() => router.push(`/orders/${orderId}`)} className="w-full mb-2">
                    View Order Status
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Redirecting automatically in 3 seconds...
                  </p>
                </>
              ) : (
                <Button onClick={() => router.push('/')} className="w-full">
                  Return to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>What can you do?</strong>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• Try payment again with a different card</li>
                    <li>• Check your card has sufficient funds</li>
                    <li>• Contact your bank if issue persists</li>
                    <li>• Contact our support team for assistance</li>
                  </ul>
                </p>
              </div>

              <div className="space-y-2">
                {orderId && (
                  <Button
                    onClick={() => router.push(`/payments/${orderId}`)}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                  Return to Home
                </Button>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Need help?{' '}
                <a
                  href="mailto:support@circletel.co.za"
                  className="text-circleTel-orange hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Status Unknown</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <p className="text-sm text-gray-600 mb-6">
              We're unable to determine the payment status. Please check your email for
              confirmation or contact support.
            </p>

            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>

            <p className="mt-4 text-sm text-gray-600">
              Need help?{' '}
              <a
                href="mailto:support@circletel.co.za"
                className="text-circleTel-orange hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
