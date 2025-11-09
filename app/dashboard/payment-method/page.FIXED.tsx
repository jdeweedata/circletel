'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentMethodSection } from '@/components/dashboard/PaymentMethodSection';
import { Loader2, ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PendingOrder {
  id: string;
  order_number: string;
  package_name: string;
  package_price: number;
  installation_address: string;
  created_at: string;
  status: string;
}

/**
 * Utility: Fetch with timeout protection
 * Prevents indefinite hangs on network issues
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
};

export default function PaymentMethodPage() {
  const router = useRouter();
  const { user, session, customer, loading: authLoading } = useCustomerAuth();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  const fetchAttempted = useRef(false);

  // Safety timeout: Force loading to end after 15 seconds
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('[PaymentMethod] Loading timeout after 15 seconds - forcing end');
        setLoading(false);
        setError('Loading timeout. Please refresh the page.');
        toast.error('Loading took too long. Please refresh the page.');
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    async function fetchPaymentData() {
      const logPrefix = '[PaymentMethod]';

      // Prevent duplicate fetches
      if (fetchInProgress.current) {
        console.log(`${logPrefix} Fetch already in progress, skipping duplicate call`);
        setLoading(false); // FIX #1: Set loading to false even on early return
        return;
      }

      // Prevent multiple fetch attempts
      if (fetchAttempted.current) {
        console.log(`${logPrefix} Fetch already attempted, skipping`);
        return;
      }

      // Wait for auth initialization to complete
      if (authLoading) {
        console.log(`${logPrefix} Auth still loading, waiting...`);
        return; // Don't set loading false yet - auth is still initializing
      }

      // Check for session token
      if (!session?.access_token) {
        console.log(`${logPrefix} No session token available`);
        setLoading(false);
        setError('Please log in to view payment methods');
        return;
      }

      // FIX #4: Wait for customer record to be available
      // APIs check user.email which comes from customer record
      if (!customer) {
        console.log(`${logPrefix} Customer record not loaded yet, waiting...`);
        return; // Don't set loading false yet - customer data still loading
      }

      console.log(`${logPrefix} Starting data fetch...`);
      fetchInProgress.current = true;
      fetchAttempted.current = true;

      try {
        // FIX #3: Add timeout protection to fetch calls
        // Fetch pending orders with timeout
        console.log(`${logPrefix} Fetching pending orders...`);
        const ordersResponse = await fetchWithTimeout(
          '/api/orders/pending',
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          },
          10000 // 10 second timeout
        );

        // FIX #2: Comprehensive error handling
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log(`${logPrefix} Orders response:`, ordersData);

          if (ordersData.success) {
            setPendingOrders(ordersData.orders || []);
            console.log(`${logPrefix} ✅ Loaded ${ordersData.orders?.length || 0} pending orders`);
          } else {
            console.error(`${logPrefix} Orders API returned success: false`, ordersData);
            setPendingOrders([]);
            setError(ordersData.error || 'Failed to load orders');
          }
        } else {
          const errorData = await ordersResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`${logPrefix} Orders API error:`, {
            status: ordersResponse.status,
            statusText: ordersResponse.statusText,
            error: errorData,
          });
          setPendingOrders([]);

          if (ordersResponse.status === 401) {
            setError('Session expired. Please log in again.');
            toast.error('Session expired. Redirecting to login...');
            setTimeout(() => router.push('/auth/login?redirect=/dashboard/payment-method'), 2000);
          } else {
            setError(`Failed to load orders (${ordersResponse.status})`);
          }
        }

        // Check if payment method exists with timeout
        console.log(`${logPrefix} Checking payment method...`);
        const paymentResponse = await fetchWithTimeout(
          '/api/payment/method/check',
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          },
          10000 // 10 second timeout
        );

        // FIX #2: Comprehensive error handling
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log(`${logPrefix} Payment method response:`, paymentData);

          if (paymentData.success) {
            setHasPaymentMethod(paymentData.hasPaymentMethod || false);
            console.log(`${logPrefix} ✅ Payment method status:`, paymentData.hasPaymentMethod);
          } else {
            console.error(`${logPrefix} Payment check returned success: false`, paymentData);
            setHasPaymentMethod(false);
          }
        } else {
          const errorData = await paymentResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`${logPrefix} Payment method check error:`, {
            status: paymentResponse.status,
            statusText: paymentResponse.statusText,
            error: errorData,
          });
          setHasPaymentMethod(false);

          if (paymentResponse.status === 401) {
            console.warn(`${logPrefix} Auth error on payment check - session might be invalid`);
          }
        }

        console.log(`${logPrefix} ✅ Data fetch complete`);
      } catch (error) {
        console.error(`${logPrefix} ❌ Fetch error:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('timeout')) {
          setError('Request timed out. Please check your connection and try again.');
          toast.error('Request timed out. Please refresh the page.');
        } else if (errorMessage.includes('fetch')) {
          setError('Network error. Please check your connection.');
          toast.error('Network error. Please refresh the page.');
        } else {
          setError(`Error loading data: ${errorMessage}`);
        }

        // Set default states on error
        setPendingOrders([]);
        setHasPaymentMethod(false);
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
        console.log(`${logPrefix} Fetch complete (loading set to false)`);
      }
    }

    fetchPaymentData();
  }, [session?.access_token, customer, authLoading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Error Loading Payment Method</h3>
                  <p className="text-sm text-red-700 mb-4">{error}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-circleTel-orange hover:bg-orange-600"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="outline"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

        {/* Help Section */}
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
