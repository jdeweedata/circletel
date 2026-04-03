'use client';
import { PiPackageBold, PiSpinnerBold, PiWarningCircleBold } from 'react-icons/pi';

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmailVerificationModal } from "@/components/dashboard/EmailVerificationModal";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { AccountStatsRow } from '@/components/dashboard/AccountStatsRow';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { ServiceCard } from '@/components/dashboard/ServiceCard';

interface DashboardData {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    customerSince: string;
    accountNumber: string;
  };
  services: Array<{
    id: string;
    package_name: string;
    service_type: string;
    status: string;
    monthly_price: number;
    installation_address: string;
    speed_down: number;
    speed_up: number;
  }>;
  billing: {
    account_balance: number;
    payment_method: string;
    payment_status: string;
    next_billing_date: string;
    days_overdue: number;
  } | null;
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    invoice_date: string;
    total_amount: number;
    amount_due: number;
    status: string;
  }>;
  stats: {
    activeServices: number;
    activeServicesTrend?: { value: number; isPositive: boolean; hasData: boolean };
    totalOrders: number;
    totalOrdersTrend?: { value: number; isPositive: boolean; hasData: boolean };
    pendingOrders: number;
    pendingOrdersTrend?: { value: number; isPositive: boolean; hasData: boolean };
    overdueInvoices: number;
    overdueInvoicesTrend?: { value: number; isPositive: boolean; hasData: boolean };
    accountBalance: number;
    accountBalanceTrend?: { value: number; isPositive: boolean; hasData: boolean };
  };
}

export default function DashboardPage() {
  const { user, session, customer, loading: authLoading } = useCustomerAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const fetchInProgress = useRef(false);

  // Email verification modal state
  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | undefined>(undefined);
  const [verifyEmail, setVerifyEmail] = useState<string | undefined>(undefined);

  // Check URL params for email verification modal trigger
  useEffect(() => {
    const showVerify = searchParams.get('showVerifyEmail');
    const order = searchParams.get('order');
    const email = searchParams.get('email');

    if (showVerify === 'true') {
      setShowVerifyEmailModal(true);
      if (order) setOrderNumber(order);
      if (email) setVerifyEmail(decodeURIComponent(email));

      // Clean up URL params after reading them
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showVerifyEmail');
      newUrl.searchParams.delete('order');
      newUrl.searchParams.delete('email');
      router.replace(newUrl.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  const handleCloseVerifyModal = () => {
    setShowVerifyEmailModal(false);
    setOrderNumber(undefined);
    setVerifyEmail(undefined);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current) {
        console.log('[Dashboard] Fetch already in progress, skipping duplicate call');
        return;
      }

      // Wait for auth initialization to complete
      if (authLoading) {
        console.log('[Dashboard] Auth still loading, waiting...');
        return;
      }

      if (!session?.access_token) {
        console.log('[Dashboard] No session token available');
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      // Wait for customer record to load (ensures session is synced to cookies)
      // If customer is still null after auth completes, try API fallback
      if (!customer) {
        if (!authLoading) {
          console.log('[Dashboard] Customer not found via provider, trying API fallback...');
          
          // Try to ensure customer exists via API
          try {
            const ensureResponse = await fetch('/api/customers/ensure', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              },
            });
            
            if (ensureResponse.ok) {
              const ensureResult = await ensureResponse.json();
              if (ensureResult.success && ensureResult.customer) {
                console.log('[Dashboard] Customer found via API fallback');
                // Continue with dashboard fetch using the session
              } else {
                console.error('[Dashboard] Customer profile not found after auth completed');
                setError('Customer profile not found. Please contact support at support@circletel.co.za');
                setLoading(false);
                return;
              }
            } else {
              console.error('[Dashboard] API fallback failed');
              setError('Customer profile not found. Please contact support at support@circletel.co.za');
              setLoading(false);
              return;
            }
          } catch (apiError) {
            console.error('[Dashboard] API fallback error:', apiError);
            setError('Customer profile not found. Please contact support at support@circletel.co.za');
            setLoading(false);
            return;
          }
        } else {
          console.log('[Dashboard] Customer not loaded yet, waiting for session sync...');
          return;
        }
      }

      fetchInProgress.current = true;

      try {
        console.log('Fetching dashboard data...');
        const response = await fetch('/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch dashboard data`);
        }

        const result = await response.json();
        console.log('Dashboard data received:', result);

        if (result.success) {
          setData(result.data);
          setError(null);
          // Use pending orders count from summary API instead of separate fetch
          setPendingOrders(result.data?.stats?.pendingOrders || 0);
        } else {
          setError(result.error || 'Failed to load dashboard');
        }

      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }

    fetchDashboardData();
  }, [authLoading, session?.access_token, customer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <PiWarningCircleBold className="h-12 w-12 text-red-500" />
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          {error.includes('log in') && (
            <Link href="/auth/login">
              <Button className="bg-circleTel-orange hover:bg-orange-600">Go to Login</Button>
            </Link>
          )}
          {!error.includes('log in') && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
              <Link href="/">
                <Button className="bg-circleTel-orange hover:bg-orange-600">Go Home</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiPackageBold className="h-12 w-12 text-gray-400" />
        <p className="text-lg text-gray-600">No data available</p>
        <Link href="/">
          <Button>Check Coverage & Order</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <EmailVerificationModal
        isOpen={showVerifyEmailModal}
        onClose={handleCloseVerifyModal}
        orderNumber={orderNumber}
        email={verifyEmail}
      />
      <DashboardContent data={data} user={user} customer={customer as Record<string, unknown> | null} pendingOrders={pendingOrders} accessToken={session?.access_token ?? ''} />
    </>
  );
}

function DashboardContent({ data, user, customer, pendingOrders, accessToken }: {
  data: DashboardData;
  user: unknown;
  customer: Record<string, unknown> | null;
  pendingOrders: number;
  accessToken: string;
}) {
  const isPlaceholder = (name: string | undefined) => {
    if (!name) return true;
    const cleaned = name.trim().toLowerCase();
    return cleaned === 'customer' || cleaned === 'user' || cleaned === '';
  };

  const userMeta = (user as { user_metadata?: Record<string, string> } | null)?.user_metadata;

  const firstName =
    (!isPlaceholder(data.customer.firstName) && data.customer.firstName) ||
    (!isPlaceholder(customer?.first_name as string) && (customer?.first_name as string)) ||
    userMeta?.first_name ||
    userMeta?.full_name?.split(' ')[0] ||
    '';

  const lastName =
    (!isPlaceholder(data.customer.lastName) && data.customer.lastName) ||
    (!isPlaceholder(customer?.last_name as string) && (customer?.last_name as string)) ||
    userMeta?.last_name ||
    userMeta?.full_name?.split(' ').slice(1).join(' ') ||
    '';

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || data.customer.email.split('@')[0];

  // pendingOrders is kept in signature for call-site compatibility
  void pendingOrders;

  return (
    <div className="space-y-6">
      {/* Onboarding banner */}
      {accessToken && <OnboardingBanner accessToken={accessToken} />}

      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Hi, {displayName} 👋
        </h1>
        {data.customer.accountNumber && (
          <p className="text-sm text-slate-500 mt-0.5">
            #{data.customer.accountNumber} · Welcome to your CircleTel account.
          </p>
        )}
      </div>

      {/* Stats row */}
      <AccountStatsRow
        activeServices={data.stats.activeServices}
        totalOrders={data.stats.totalOrders}
        openTickets={data.stats.overdueInvoices}
        accountBalance={data.billing?.account_balance ?? 0}
      />

      {/* Action cards */}
      <QuickActionGrid />

      {/* My Connectivity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-bold tracking-wider"
            style={{ color: '#94a3b8', letterSpacing: '0.05em' }}
          >
            MY CONNECTIVITY
          </p>
          <Link
            href="/packages"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#e2e8f0', color: '#F5831F' }}
          >
            + Add Product
          </Link>
        </div>

        {data.services.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700 mb-1">No active services</p>
            <p className="text-xs text-slate-500 mb-4">Get connected with high-speed fibre or wireless.</p>
            <Link
              href="/"
              className="inline-block text-xs font-bold px-4 py-2 rounded-lg text-white"
              style={{ background: '#F5831F' }}
            >
              Check Coverage
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.services.map((service) => (
              <ServiceCard key={service.id} service={service} billing={data.billing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
