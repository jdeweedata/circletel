'use client';

import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, CreditCard, Package, AlertCircle, Clock, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { ServiceManageDropdown } from "@/components/dashboard/ServiceManageDropdown";

interface DashboardData {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    customerSince: string;
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
  const { user, session, customer } = useCustomerAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.access_token) {
        console.log('No session token available');
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

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
        } else {
          setError(result.error || 'Failed to load dashboard');
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [session]);

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
        <Link href="/">
          <Button>Browse Packages</Button>
        </Link>
      </div>
    );
  }

  return <DashboardContent data={data} user={user} customer={customer} />;
}

function DashboardContent({ data, user, customer }: { data: DashboardData; user: any; customer: any }) {
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
      {/* Page Title with Customer ID */}
      <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">My Dashboard</h1>
        <p className="text-base lg:text-lg text-gray-600 mt-2">
          Welcome back, <span className="font-bold text-circleTel-orange">{firstName || displayName}</span>!
          {data.customer.id && (
            <span className="text-sm text-gray-500 ml-2">(#{data.customer.id.substring(0, 12)})</span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Services</p>
                <p className="text-4xl lg:text-5xl font-extrabold text-circleTel-orange mt-2 tabular-nums">{data.stats.activeServices}</p>
              </div>
              <Wifi className="h-12 w-12 text-circleTel-orange opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Orders</p>
                <p className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2 tabular-nums">{data.stats.totalOrders}</p>
              </div>
              <Package className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Account Balance</p>
                <p className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2 tabular-nums">R{data.stats.accountBalance.toFixed(2)}</p>
              </div>
              <CreditCard className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Orders</p>
                <p className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2 tabular-nums">{data.stats.pendingOrders}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <QuickActionCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Service */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Your Service</CardTitle>
              <Link href="/dashboard/services" className="text-sm font-semibold text-circleTel-orange hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {hasActiveService && primaryService ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-circleTel-orange/30 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                  {/* Status Badge with Indicator and Manage Dropdown */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse ring-4 ring-green-200" />
                      <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                        {primaryService.status === 'active' ? 'Connected & Billing' : primaryService.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-100 font-bold px-3 py-1">
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
                    <h3 className="font-extrabold text-2xl text-gray-900 mb-1">{primaryService.package_name}</h3>
                    <p className="text-base text-gray-700 font-semibold capitalize">{primaryService.service_type}</p>
                  </div>

                  {/* Speed Display with Icons */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-orange-200">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowUpDown className="h-5 w-5 text-blue-600 rotate-180" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Download</p>
                        <p className="font-extrabold text-xl text-gray-900">{primaryService.speed_down} <span className="text-sm font-normal">Mbps</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-orange-200">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowUpDown className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Upload</p>
                        <p className="font-extrabold text-xl text-gray-900">{primaryService.speed_up} <span className="text-sm font-normal">Mbps</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Price */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-orange-200">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Monthly Fee</span>
                    <span className="font-extrabold text-2xl text-circleTel-orange tabular-nums">R{primaryService.monthly_price}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active services</p>
                <Link href="/">
                  <Button className="mt-4 bg-circleTel-orange hover:bg-orange-600">Browse Packages</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Billing Summary</CardTitle>
              <Link href="/dashboard/billing" className="text-sm font-semibold text-circleTel-orange hover:underline">
                View invoices
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.billing ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-circleTel-orange" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base">{data.billing.payment_method || 'No payment method'}</p>
                      <p className={`text-base font-semibold ${data.billing.payment_status === 'current' ? 'text-green-600' : 'text-red-600'}`}>
                        {data.billing.payment_status === 'current' ? 'Payment up to date' : 'Payment overdue'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Balance Due</p>
                      <p className="font-extrabold text-2xl text-gray-900 mt-1 tabular-nums">R{data.billing.account_balance.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Due: {data.billing.next_billing_date ? new Date(data.billing.next_billing_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Invoices</p>
                      <p className="font-extrabold text-2xl text-gray-900 mt-1 tabular-nums">{data.invoices.length}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.stats.overdueInvoices > 0 ? `${data.stats.overdueInvoices} overdue` : 'All paid'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No billing information</p>
              </div>
            )}
          </CardContent>
        </Card>

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
