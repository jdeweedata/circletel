'use client';

import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, CreditCard, Package, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

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
  const { user, session } = useCustomerAuth();
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

  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const displayName = [data.customer.firstName, data.customer.lastName].filter(Boolean).join(' ') || data.customer.email;
  const primaryService = data.services[0];
  const hasActiveService = data.stats.activeServices > 0;
  
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {displayName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-3xl font-bold text-circleTel-orange mt-2">{data.stats.activeServices}</p>
              </div>
              <Wifi className="h-10 w-10 text-circleTel-orange opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold mt-2">{data.stats.totalOrders}</p>
              </div>
              <Package className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Account Balance</p>
                <p className="text-3xl font-bold mt-2">R{data.stats.accountBalance.toFixed(2)}</p>
              </div>
              <CreditCard className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-3xl font-bold mt-2">{data.stats.pendingOrders}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Service */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Service</CardTitle>
              <Link href="/dashboard/services" className="text-sm text-circleTel-orange hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {hasActiveService && primaryService ? (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-circleTel-orange/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{primaryService.package_name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{primaryService.service_type}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {primaryService.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-600">Speed</p>
                      <p className="font-medium">{primaryService.speed_down}/{primaryService.speed_up} Mbps</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Monthly</p>
                      <p className="font-medium">R{primaryService.monthly_price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Type</p>
                      <p className="font-medium capitalize">{primaryService.service_type}</p>
                    </div>
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
              <CardTitle>Billing Summary</CardTitle>
              <Link href="/dashboard/billing" className="text-sm text-circleTel-orange hover:underline">
                View invoices
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.billing ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-circleTel-orange" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{data.billing.payment_method || 'No payment method'}</p>
                      <p className={`text-sm ${data.billing.payment_status === 'current' ? 'text-green-600' : 'text-red-600'}`}>
                        {data.billing.payment_status === 'current' ? 'Payment up to date' : 'Payment overdue'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Balance Due</p>
                      <p className="font-medium text-lg">R{data.billing.account_balance.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {data.billing.next_billing_date ? new Date(data.billing.next_billing_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Invoices</p>
                      <p className="font-medium text-lg">{data.invoices.length}</p>
                      <p className="text-xs text-gray-500 mt-1">
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
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/dashboard/orders" className="text-sm text-circleTel-orange hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.orders.length > 0 ? (
              <div className="space-y-3">
                {data.orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R{order.total_amount.toFixed(2)}</p>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
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
