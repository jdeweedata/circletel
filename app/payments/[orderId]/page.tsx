'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Clock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetails {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  package_name: string;
  package_price: number;
  installation_fee: number;
  payment_status: string;
  status: string;
  customer_id: string;
}

export default function PaymentMethodSetupPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

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

        // Check if payment method already set up
        if (data.order.status === 'payment_method_pending' || data.order.status === 'payment_method_registered') {
          setSuccess(true);
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

  const handleSetupDebitOrder = async () => {
    if (!order) return;

    try {
      setProcessing(true);
      setError('');

      // Initiate eMandate (debit order) setup
      const response = await fetch('/api/payment/emandate/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          customer_id: order.customer_id,
          billing_day: 1, // 1st of each month
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        toast.success('Debit order setup initiated!', {
          description: 'Please check your email/SMS for the mandate signing link.',
        });
      } else {
        setError(result.error || 'Failed to set up debit order');
        toast.error('Setup failed', {
          description: result.error,
        });
      }
    } catch (err) {
      console.error('Debit order setup error:', err);
      setError('Failed to set up debit order. Please try again.');
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

  if (error && !order) {
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

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Payment Method</h1>
          <p className="text-gray-600 mt-2">
            Order: <span className="font-semibold">{order.order_number}</span>
          </p>
        </div>

        {/* Success State */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Almost there!</strong> We&apos;ve sent you an email and SMS with a secure link to sign your debit order mandate.
              Please check your inbox at <strong>{order.email}</strong> or SMS at <strong>{order.phone}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Important Notice - No Immediate Billing */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> You will <strong>NOT</strong> be billed today. Your first payment will only be processed after your service has been installed and activated, calculated pro-rata from your activation date.
          </AlertDescription>
        </Alert>

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

        {/* Monthly Amount Card */}
        <Card className="border-circleTel-orange bg-gradient-to-br from-orange-50 to-white mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-circleTel-orange rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Debit Order Amount</p>
                  <p className="text-3xl font-bold text-circleTel-orange">
                    R{order.package_price.toFixed(2)}
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

            {/* Pro-rata Billing Note */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <Clock className="w-4 h-4 inline mr-1" />
                <strong>Pro-rata billing:</strong> Your first invoice will be calculated based on your actual activation date, not the full month.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Button */}
        {!success && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleSetupDebitOrder}
                disabled={processing}
                className="w-full h-14 text-lg bg-circleTel-orange hover:bg-orange-600"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Set Up Debit Order
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure mandate via NetCash</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No payment taken today</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>First billing only after service activation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Cancel anytime with 30 days notice</span>
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

        {/* What Happens Next */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>You&apos;ll receive an email and SMS with a secure link to sign your debit order mandate</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Our team will contact you to schedule your installation</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Once installed, your service will be activated</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Your first pro-rata invoice will be generated based on activation date</span>
              </li>
            </ol>
          </CardContent>
        </Card>

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
            {' '}or call{' '}
            <a
              href="tel:0108803223"
              className="text-circleTel-orange hover:underline font-medium"
            >
              010 880 3223
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
