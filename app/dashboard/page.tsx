'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  ArrowRight,
  Home,
  Wifi,
  TrendingUp,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/customer-journey/OrderStatusBadge';
import type { ConsumerOrder } from '@/lib/types/customer-journey';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const { state: orderState, actions: orderActions } = useOrderContext();
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeServices: 0,
    pendingOrders: 0,
    kycDocuments: 0,
    lastPayment: null as string | null,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user's orders
      const response = await fetch('/api/orders/consumer');
      if (response.ok) {
        const data = await response.json();
        const userOrders = data.orders || [];
        setOrders(userOrders);

        // Calculate stats
        const active = userOrders.filter((o: ConsumerOrder) => o.status === 'active').length;
        const pending = userOrders.filter((o: ConsumerOrder) =>
          ['pending', 'payment_pending', 'kyc_pending'].includes(o.status)
        ).length;

        setStats({
          activeServices: active,
          pendingOrders: pending,
          kycDocuments: 0, // TODO: Fetch from KYC documents table
          lastPayment: null, // TODO: Fetch from payments table
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-circleTel-secondaryNeutral">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  // Determine if there is a local in-progress order to resume
  const hasLocalOrder = !!orderState && (
    (orderState.completedSteps?.length ?? 0) > 0 ||
    Object.keys(orderState.orderData?.account || {}).length > 0 ||
    Object.keys(orderState.orderData?.contact || {}).length > 0 ||
    Object.keys(orderState.orderData?.installation || {}).length > 0 ||
    Object.keys(orderState.orderData?.coverage || {}).length > 0
  );

  const nextOrderRoute = (() => {
    const data = orderState?.orderData || {} as any;
    // Choose next step based on missing sections
    if (!data.account || Object.keys(data.account).length === 0) return '/order/account';
    if (!data.contact || Object.keys(data.contact).length === 0) return '/order/contact';
    if (!data.installation || Object.keys(data.installation).length === 0) return '/order/installation';
    // If all present but not finalized, proceed to payment/verification
    return '/order/payment';
  })();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-xl shadow-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.firstName || 'Customer'}!
            </h1>
            <p className="text-lg text-white/90">
              Manage your CircleTel services and orders
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/coverage">
              <Button
                variant="secondary"
                className="bg-white text-circleTel-orange hover:bg-white/90"
              >
                <Home className="h-4 w-4 mr-2" />
                Check Coverage
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-circleTel-secondaryNeutral mb-1">Active Services</p>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">{stats.activeServices}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-circleTel-secondaryNeutral mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">{stats.pendingOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-circleTel-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-circleTel-secondaryNeutral mb-1">KYC Documents</p>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">{stats.kycDocuments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-circleTel-secondaryNeutral mb-1">Account Status</p>
                <p className="text-lg font-bold text-green-600">Active</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/kyc" className="group">
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-circleTel-orange hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-circleTel-orange" />
                  </div>
                  <div>
                    <p className="font-semibold text-circleTel-darkNeutral">Upload KYC</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">Submit documents</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/orders" className="group">
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-circleTel-orange hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-circleTel-darkNeutral">View Orders</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">Track your orders</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/billing" className="group">
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-circleTel-orange hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-circleTel-darkNeutral">View Invoices</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">Manage billing</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest orders and their status</CardDescription>
            </div>
            {orders.length > 3 && (
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-circleTel-orange">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-circleTel-secondaryNeutral mb-2">
                No orders yet
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Start by checking coverage at your address
              </p>
              <Link href="/coverage">
                <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  Check Coverage
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-circleTel-darkNeutral">
                        {order.package_name}
                      </p>
                      <OrderStatusBadge status={order.status} type="order" size="sm" />
                    </div>
                    <p className="text-sm text-circleTel-secondaryNeutral">
                      Order #{order.order_number}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Actions */}
      {stats.pendingOrders > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Action Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders
                .filter((o) => ['kyc_pending', 'payment_pending'].includes(o.status))
                .slice(0, 2)
                .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        {order.status === 'kyc_pending' ? (
                          <Upload className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-circleTel-darkNeutral">
                          {order.status === 'kyc_pending'
                            ? 'KYC Documents Required'
                            : 'Payment Pending'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Order #{order.order_number}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={
                        order.status === 'kyc_pending'
                          ? '/dashboard/kyc'
                          : `/orders/${order.id}`
                      }
                    >
                      <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                        {order.status === 'kyc_pending' ? 'Upload Now' : 'View Order'}
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-700">
                Our support team is available 24/7 to assist you
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => (window.location.href = 'tel:0860247253')}
              >
                Call Support
              </Button>
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => (window.location.href = 'mailto:support@circletel.co.za')}
              >
                Email Us
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
