'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentMethodSection } from '@/components/dashboard/PaymentMethodSection';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingOrder {
  id: string;
  order_number: string;
  package_name: string;
  package_price: number;
  installation_address: string;
  created_at: string;
  status: string;
}

export default function PaymentMethodPage() {
  const router = useRouter();
  const { user, session } = useCustomerAuth();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    async function fetchPaymentData() {
      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current) {
        console.log('[PaymentMethod] Fetch already in progress, skipping duplicate call');
        return;
      }

      // Add timeout protection - don't wait forever for session
      // If no session after mount, still show page with error state
      const timeoutId = setTimeout(() => {
        if (!session?.access_token && loading) {
          console.log('[PaymentMethod] Session timeout - displaying page anyway');
          setLoading(false);
        }
      }, 3000); // 3 second timeout for session availability

      if (!session?.access_token) {
        // Don't immediately bail - wait for timeout
        return () => clearTimeout(timeoutId);
      }

      clearTimeout(timeoutId);
      fetchInProgress.current = true;

      try {
        console.log('[PaymentMethod] Fetching payment data with session token');

        // Fetch pending orders with timeout protection
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
          console.log('[PaymentMethod] Pending orders loaded:', ordersData.orders?.length || 0);
        } else {
          console.error('[PaymentMethod] Orders fetch failed:', ordersResponse.status);
        }

        // Check if payment method exists with timeout protection
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
          console.log('[PaymentMethod] Payment method check:', paymentData.hasPaymentMethod);
        } else {
          console.error('[PaymentMethod] Payment check failed:', paymentResponse.status);
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('[PaymentMethod] Request timeout - API took too long to respond');
        } else {
          console.error('[PaymentMethod] Error fetching payment data:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-circleTel-orange/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-circleTel-orange" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Method</h1>
              <p className="text-gray-600 mt-1">
                Manage your payment method and complete pending orders
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <PaymentMethodSection
          pendingOrders={pendingOrders}
          hasPaymentMethod={hasPaymentMethod}
        />

        {/* Help Section - Enhanced with Icons and Hover States */}
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                💬 Need help with payment or have questions?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  asChild
                  className="hover:bg-circleTel-orange hover:text-white hover:border-circleTel-orange transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <a href="tel:0877772473" className="flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    <span className="font-semibold">087 777 2473</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="hover:bg-circleTel-orange hover:text-white hover:border-circleTel-orange transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <a href="mailto:support@circletel.co.za" className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <span>support@circletel.co.za</span>
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
