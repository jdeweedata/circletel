'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Building2, Phone, Mail, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PendingOrder {
  id: string;
  order_number: string;
  package_name: string;
  package_price: number;
  installation_address: string;
  created_at: string;
  status: string;
}

interface PaymentMethodInfo {
  id: string;
  type: string;
  isPrimary: boolean;
  displayName: string;
  mandateActive: boolean;
}

export default function PaymentMethodPage() {
  const router = useRouter();
  const { user, session } = useCustomerAuth();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<PaymentMethodInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    async function fetchPaymentData() {
      if (fetchInProgress.current) {
        return;
      }

      const timeoutId = setTimeout(() => {
        if (!session?.access_token && loading) {
          setLoading(false);
        }
      }, 3000);

      if (!session?.access_token) {
        return () => clearTimeout(timeoutId);
      }

      clearTimeout(timeoutId);
      fetchInProgress.current = true;

      try {
        const ordersController = new AbortController();
        const ordersTimeout = setTimeout(() => ordersController.abort(), 10000);

        const ordersResponse = await fetch('/api/orders/pending', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          signal: ordersController.signal
        });
        clearTimeout(ordersTimeout);

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setPendingOrders(ordersData.orders || []);
        } else if (!loadError) {
          setLoadError('Some order information could not be loaded.');
        }

        const paymentController = new AbortController();
        const paymentTimeout = setTimeout(() => paymentController.abort(), 10000);

        const paymentResponse = await fetch('/api/payment/method/check', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          signal: paymentController.signal
        });
        clearTimeout(paymentTimeout);

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          setHasPaymentMethod(paymentData.hasPaymentMethod || false);
          if (paymentData.paymentMethod) {
            setPaymentMethodInfo(paymentData.paymentMethod);
          }
        } else if (!loadError) {
          setLoadError('Could not confirm payment method status.');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (!loadError) setLoadError('Request timed out. Please try again.');
        } else if (!loadError) {
          setLoadError('Could not load payment information.');
        }
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }

    fetchPaymentData();
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  const hasPendingOrders = pendingOrders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gray-100 rounded-lg">
            <CreditCard className="w-8 h-8 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Method</h1>
            <p className="text-gray-600">
              Manage your payment method and complete pending orders.
            </p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p>{loadError}</p>
          </div>
        )}

        {/* Pending Order Alert */}
        {hasPendingOrders && !hasPaymentMethod && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">Complete Your Order</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    You have {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'} waiting for payment method validation. Add a payment method to complete your order.
                  </p>
                  <Button
                    className="mt-3 bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                    onClick={() => document.getElementById('payment-methods')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Complete Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choose Payment Method Section */}
        <div id="payment-methods" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Choose Your Payment Method</h2>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secured by NetCash
            </Badge>
          </div>

          {hasPaymentMethod ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Payment Method Active</p>
                    <p className="text-sm text-green-700">Your payment method is verified and ready for automatic billing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Credit/Debit Card Option */}
              <Link href="/dashboard/payment-method/card" className="block">
                <Card className="h-full border-0 bg-gradient-to-br from-circleTel-orange to-orange-500 text-white hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">Credit or Debit Card</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Image
                        src="/images/payment-logos/visa-logo.svg"
                        alt="VISA"
                        width={50}
                        height={16}
                        className="h-4 w-auto brightness-0 invert"
                      />
                      <Image
                        src="/images/payment-logos/mastercard-logo.svg"
                        alt="Mastercard"
                        width={40}
                        height={24}
                        className="h-6 w-auto"
                      />
                    </div>
                    <p className="text-sm text-white/90 mb-4">
                      Quick R1.00 verification. Your card will be securely saved for automatic monthly payments.
                    </p>
                    <Button
                      variant="secondary"
                      className="bg-white text-circleTel-orange hover:bg-gray-100 font-semibold"
                    >
                      Select Credit Card
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Debit Order Option */}
              <Link href="/dashboard/payment-method/debit-order" className="block">
                <Card className="h-full border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">Debit Order</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-10 h-10 text-white/80" />
                    </div>
                    <p className="text-sm text-white/90 mb-2">
                      Direct from your bank account. Automatic monthly deductions. Ideal for consistent billing.
                    </p>
                    <p className="text-xs text-white/70 mb-4">
                      All major SA banks supported.
                    </p>
                    <Button
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                    >
                      Select Debit Order
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </div>

        {/* Manage Existing Payment Methods */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Manage Existing Payment Methods</h3>
            {hasPaymentMethod && paymentMethodInfo ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {paymentMethodInfo.type === 'card' ? (
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-900">{paymentMethodInfo.displayName}</span>
                      {paymentMethodInfo.isPrimary && (
                        <span className="ml-2 text-xs text-gray-500">(Primary)</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                </div>
              </div>
            ) : hasPaymentMethod ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Payment method on file</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No payment methods saved.</p>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-700">
                Need help with payment or have questions?
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="tel:0870876305"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>087 087 6305</span>
                </a>
                <a
                  href="mailto:contactus@circletel.co.za"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>contactus@circletel.co.za</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
