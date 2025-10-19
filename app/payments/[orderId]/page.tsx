'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetails {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  package_name: string;
  package_price: number;
  installation_fee: number;
  payment_status: string;
  status: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/consumer?id=${orderId}`);
      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);

        // Check if already paid
        if (data.order.payment_status === 'paid') {
          toast.info('Order already paid', {
            description: 'Redirecting to order tracking...',
          });
          setTimeout(() => {
            router.push(`/orders/${orderId}`);
          }, 2000);
        }
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;

    try {
      setProcessing(true);
      setError('');

      // Initiate payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect to Netcash payment gateway
        window.location.href = result.paymentUrl;
      } else {
        setError(result.error || 'Failed to initiate payment');
        toast.error('Payment initiation failed', {
          description: result.error,
        });
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError('Failed to initiate payment. Please try again.');
      toast.error('Network error', {
        description: 'Please check your connection and try again',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
              <Button onClick={() => router.push('/')}>Return to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = order.package_price + (order.installation_fee || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">
            Order: <span className="font-semibold">{order.order_number}</span>
          </p>
        </div>

        {/* Already Paid Alert */}
        {order.payment_status === 'paid' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Payment Complete!</strong> This order has already been paid. You will be
              redirected to order tracking shortly.
            </AlertDescription>
          </Alert>
        )}

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">
                {order.first_name} {order.last_name}
              </p>
              <p className="text-sm text-gray-600">{order.email}</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Package Details</p>
              <p className="font-semibold text-lg">{order.package_name}</p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Subscription</span>
                <span className="font-semibold">R{order.package_price.toFixed(2)}</span>
              </div>
              {order.installation_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Installation Fee</span>
                  <span className="font-semibold">R{order.installation_fee.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Amount Card */}
        <Card className="border-circleTel-orange bg-gradient-to-br from-orange-50 to-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-circleTel-orange rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount Due</p>
                  <p className="text-3xl font-bold text-circleTel-orange">
                    R{totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {order.installation_fee === 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  <strong>Free Installation!</strong> No installation fee required.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Button */}
        {order.payment_status !== 'paid' && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure payment via Netcash</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Card and EFT payments accepted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant confirmation via email</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@circletel.co.za"
              className="text-circleTel-orange hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
