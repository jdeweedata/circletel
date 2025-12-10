'use client';

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, CreditCard, Package, AlertCircle, Clock, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { ServiceManageDropdown } from "@/components/dashboard/ServiceManageDropdown";
import { ModernStatCard } from "@/components/dashboard/ModernStatCard";
import { EmailVerificationModal } from "@/components/dashboard/EmailVerificationModal";

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
    totalOrders: number;
    pendingOrders: number;
    overdueInvoices: number;
    accountBalance: number;
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
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
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
        <Package className="h-12 w-12 text-gray-400" />
        <p className="text-lg text-gray-600">No data available</p>
        <Link href="/order/coverage">
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
      <DashboardContent data={data} user={user} customer={customer} pendingOrders={pendingOrders} />
    </>
  );
}

function DashboardContent({ data, user, customer, pendingOrders }: { data: DashboardData; user: any; customer: any; pendingOrders: number }) {
  // Helper to check if a name is a placeholder/default value
  const isPlaceholder = (name: string | undefined) => {
    if (!name) return true;
    const cleaned = name.trim().toLowerCase();
    return cleaned === 'customer' || cleaned === 'user' || cleaned === '';
  };

  // Try multiple sources for the name with fallbacks, skipping placeholder values
  const firstName = (!isPlaceholder(data.customer.firstName) && data.customer.firstName) ||
                   (!isPlaceholder(customer?.first_name) && customer?.first_name) ||
                   user?.user_metadata?.first_name ||
                   user?.user_metadata?.full_name?.split(' ')[0] ||
                   '';

  const lastName = (!isPlaceholder(data.customer.lastName) && data.customer.lastName) ||
                  (!isPlaceholder(customer?.last_name) && customer?.last_name) ||
                  user?.user_metadata?.last_name ||
                  user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                  '';

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || data.customer.email.split('@')[0];
  const primaryService = data.services[0];
  const hasActiveService = data.stats.activeServices > 0;
  
  return (
    <div className="space-y-8">
      {/* Clean Modern Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {firstName || displayName}
            </h1>
            {data.customer.accountNumber && (
              <p className="text-sm text-gray-500 mt-1">
                Account: <span className="font-medium text-gray-700">{data.customer.accountNumber}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-circleTel-orange rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-circleTel-orange rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Complete Your Order
              </h3>
              <p className="text-gray-700 mb-4">
                You have <strong>{pendingOrders}</strong> pending {pendingOrders === 1 ? 'order' : 'orders'} waiting for payment method validation.
                Add a payment method to complete your order and start enjoying high-speed connectivity.
              </p>
              <Link href="/dashboard/payment-method">
                <Button className="bg-circleTel-orange hover:bg-orange-600 font-semibold shadow-md">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard
          title="Active Services"
          value={data.stats.activeServices}
          trend={{
            value: data.stats.activeServices > 0 ? 100 : 0,
            isPositive: true,
            label: "vs last month"
          }}
          subtitle={data.stats.activeServices > 0 ? "All services active" : "No active services"}
          description="Connected and billing"
          icon={<Wifi className="h-5 w-5" />}
          href="/dashboard/services"
        />

        <ModernStatCard
          title="Total Orders"
          value={data.stats.totalOrders}
          trend={{
            value: data.stats.pendingOrders > 0 ? -20 : 0,
            isPositive: false,
            label: "vs last month"
          }}
          subtitle={data.stats.pendingOrders > 0 ? `${data.stats.pendingOrders} pending` : "All orders completed"}
          description={data.stats.pendingOrders > 0 ? "Some orders need attention" : "Order history"}
          icon={<Package className="h-5 w-5" />}
          href="/dashboard/orders"
        />

        <ModernStatCard
          title="Account Balance"
          value={`R${data.stats.accountBalance.toFixed(2)}`}
          trend={{
            value: data.stats.accountBalance === 0 ? 0 : data.stats.accountBalance > 0 ? -10 : 10,
            isPositive: data.stats.accountBalance <= 0,
            label: "vs last month"
          }}
          subtitle={data.stats.accountBalance === 0 ? "No balance due" : data.stats.accountBalance > 0 ? "Payment due" : "Credit available"}
          description={data.stats.accountBalance > 0 ? "Please make payment" : "Account in good standing"}
          icon={<CreditCard className="h-5 w-5" />}
          href="/dashboard/billing"
        />

        <ModernStatCard
          title="Service Status"
          value={data.stats.overdueInvoices > 0 ? "Overdue" : "Current"}
          trend={{
            value: data.stats.overdueInvoices > 0 ? -15 : 5,
            isPositive: data.stats.overdueInvoices === 0,
            label: "this period"
          }}
          subtitle={data.stats.overdueInvoices > 0 ? `${data.stats.overdueInvoices} overdue invoices` : "All payments current"}
          description={data.stats.overdueInvoices > 0 ? "Payment required" : "Good payment history"}
          icon={<Clock className="h-5 w-5" />}
          href="/dashboard/billing"
        />
      </div>

      {/* Quick Action Cards */}
      <QuickActionCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Service */}
        <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Your Service</h2>
              <Link href="/dashboard/services" className="text-sm font-semibold text-circleTel-orange hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {hasActiveService && primaryService ? (
              <div className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-6">
                {/* Status Badge with Indicator and Manage Dropdown */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-green-700">
                      {primaryService.status === 'active' ? 'Connected & Billing' : primaryService.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-medium px-2.5 py-0.5 text-xs">
                      Active
                    </Badge>
                    <ServiceManageDropdown
                      serviceId={primaryService.id}
                      packageName={primaryService.package_name}
                    />
                  </div>
                </div>

                {/* Service Name */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{primaryService.package_name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{primaryService.service_type}</p>
                </div>

                {/* Speed Display with Icons */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-blue-600 rotate-180" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Download</p>
                      <p className="font-bold text-lg text-gray-900">{primaryService.speed_down} <span className="text-sm font-normal text-gray-600">Mbps</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Upload</p>
                      <p className="font-bold text-lg text-gray-900">{primaryService.speed_up} <span className="text-sm font-normal text-gray-600">Mbps</span></p>
                    </div>
                  </div>
                </div>

                {/* Monthly Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Monthly Fee</span>
                  <span className="font-bold text-2xl text-gray-900 tabular-nums">R{primaryService.monthly_price}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active services</p>
                <Link href="/order/coverage">
                  <Button className="mt-4 bg-circleTel-orange hover:bg-orange-600">Check Coverage & Order</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Billing Summary</h2>
              <Link href="/dashboard/billing" className="text-sm font-semibold text-circleTel-orange hover:underline">
                View invoices
              </Link>
            </div>
          </div>
          <div className="p-6">
            {data.billing ? (
              <div className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-circleTel-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{data.billing.payment_method || 'No payment method'}</p>
                    <p className={`text-xs font-medium ${data.billing.payment_status === 'current' ? 'text-green-600' : 'text-red-600'}`}>
                      {data.billing.payment_status === 'current' ? 'Payment up to date' : 'Payment overdue'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Balance Due</p>
                    <p className="font-bold text-xl text-gray-900 mt-1 tabular-nums">R{data.billing.account_balance.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {data.billing.next_billing_date ? new Date(data.billing.next_billing_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Invoices</p>
                    <p className="font-bold text-xl text-gray-900 mt-1 tabular-nums">{data.invoices.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.stats.overdueInvoices > 0 ? `${data.stats.overdueInvoices} overdue` : 'All paid'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No billing information</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Recent Orders</CardTitle>
              <Link href="/dashboard/orders" className="text-sm font-semibold text-circleTel-orange hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.orders.length > 0 ? (
              <div className="space-y-3">
                {data.orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-base">{order.order_number}</p>
                        <p className="text-base text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-lg tabular-nums">R{order.total_amount.toFixed(2)}</p>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-sm font-semibold mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
