'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Card components kept for potential future use but currently using custom styled divs
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  FileText,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Target,
  Bell,
  Percent,
  BarChart,
  Activity,
  Zap,
  Layers,
  Shield
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import type { PaymentProviderType } from '@/lib/types/payment.types';
// All order widgets disabled - they all cause issues (infinite loading or React Error #130)
// import { OrdersRequiringAttentionWidget } from '@/components/admin/dashboard/OrdersRequiringAttentionWidget';
// import { TodaysInstallationsWidget } from '@/components/admin/dashboard/TodaysInstallationsWidget';
// import { OrderStatusDistributionWidget } from '@/components/admin/dashboard/OrderStatusDistributionWidget';

import { RevenueTrendChart } from '@/components/admin/dashboard/charts/RevenueTrendChart';
import { CustomerGrowthChart } from '@/components/admin/dashboard/charts/CustomerGrowthChart';
import { OrderStatusPieChart } from '@/components/admin/dashboard/charts/OrderStatusPieChart';

interface AdminStats {
  // Products
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  productRevenue: number;

  // Quotes
  totalQuotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  quoteRevenue: number;

  // Orders
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  orderRevenue: number;

  // Customers
  totalCustomers: number;
  newCustomersThisMonth: number;

  // Leads
  totalLeads: number;
  newLeadsThisMonth: number;

  // Overall
  totalRevenue: number;
  pendingApprovals: number;

  lastUpdated: string;
}

interface PaymentProviderHealthProvider {
  provider: PaymentProviderType;
  healthy: boolean;
  configured: boolean;
  available: boolean;
  test_mode?: boolean;
  priority?: number;
}

interface PaymentProviderHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  timestamp: string;
  response_time_ms: number;
  providers: PaymentProviderHealthProvider[];
  summary: {
    total_providers: number;
    healthy_providers: number;
    unhealthy_providers: number;
    configured_providers: number;
    unconfigured_providers: number;
  };
  error?: string;
  message?: string;
}

function useAdminStatsRealtime() {
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    productRevenue: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    quoteRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    orderRevenue: 0,
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    totalLeads: 0,
    newLeadsThisMonth: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats
  };
}

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const { can } = usePermissions();
  const { stats, isLoading, error, refresh } = useAdminStatsRealtime();
  const [providerHealth, setProviderHealth] = useState<PaymentProviderHealthResponse | null>(null);
  const [providerHealthError, setProviderHealthError] = useState<string | null>(null);
  const [providerHealthLoading, setProviderHealthLoading] = useState(false);
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const fetchProviderHealth = async () => {
      try {
        setProviderHealthLoading(true);
        setProviderHealthError(null);
        const response = await fetch('/api/payments/providers?health=true');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load payment provider health');
        }
        setProviderHealth(data);
      } catch (err) {
        setProviderHealthError(
          err instanceof Error ? err.message : 'Failed to load payment provider health'
        );
      } finally {
        setProviderHealthLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const response = await fetch('/api/admin/analytics');
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchProviderHealth();
    fetchAnalytics();
  }, []);

  // Calculated Stats
  const quoteAcceptanceRate = stats.totalQuotes > 0
    ? Math.round((stats.acceptedQuotes / stats.totalQuotes) * 100)
    : 0;

  const leadConversionRate = stats.totalLeads > 0
    ? Math.round((stats.totalOrders / stats.totalLeads) * 100)
    : 0;

  const arpu = stats.totalCustomers > 0
    ? Math.round(stats.totalRevenue / stats.totalCustomers)
    : 0;

  const statCards = {
    overview: [
      {
        title: 'Total Revenue',
        value: `R${stats.totalRevenue.toLocaleString()}`,
        description: 'Active monthly revenue',
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        href: '/admin/billing'
      },
      {
        title: 'Total Customers',
        value: stats.totalCustomers.toString(),
        description: `${stats.newCustomersThisMonth} new this month`,
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        href: '/admin/customers'
      },
      {
        title: 'Active Orders',
        value: stats.activeOrders.toString(),
        description: `${stats.pendingOrders} pending`,
        icon: ShoppingCart,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/admin/orders'
      },
      {
        title: 'Pending Approvals',
        value: stats.pendingApprovals.toString(),
        description: 'Quotes + Products awaiting review',
        icon: Clock,
        color: 'text-circleTel-orange',
        bgColor: 'bg-orange-100',
        urgent: stats.pendingApprovals > 0,
        href: '/admin/workflow'
      }
    ],
    sales: [
      {
        title: 'Business Quotes',
        value: stats.totalQuotes.toString(),
        description: `${stats.pendingQuotes} pending, ${stats.acceptedQuotes} accepted`,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        href: '/admin/quotes'
      },
      {
        title: 'Quote Revenue',
        value: `R${stats.quoteRevenue.toLocaleString()}`,
        description: 'From accepted quotes',
        icon: TrendingUp,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        href: '/admin/quotes?status=accepted'
      },
      {
        title: 'Coverage Leads',
        value: stats.totalLeads.toString(),
        description: `${stats.newLeadsThisMonth} new this month`,
        icon: Target,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        href: '/admin/coverage'
      },
      {
        title: 'Quote Acceptance',
        value: `${quoteAcceptanceRate}%`,
        description: 'Quotes converted to accepted',
        icon: Percent,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        href: '/admin/quotes'
      }
    ],
    operations: [
      {
        title: 'Customer Orders',
        value: stats.totalOrders.toString(),
        description: `${stats.activeOrders} active, ${stats.pendingOrders} pending`,
        icon: ShoppingCart,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/admin/orders'
      },
      {
        title: 'Active Products',
        value: stats.approvedProducts.toString(),
        description: `${stats.totalProducts} total products`,
        icon: Package,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        href: '/admin/products'
      },
      {
        title: 'Lead Conversion',
        value: `${leadConversionRate}%`,
        description: 'Leads converted to orders',
        icon: BarChart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        href: '/admin/coverage'
      },
      {
        title: 'ARPU',
        value: `R${arpu.toLocaleString()}`,
        description: 'Average Revenue Per User',
        icon: Activity,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        href: '/admin/billing'
      }
    ]
  };

  const quickActions = [
    {
      title: 'Review Quotes',
      description: 'Process pending quotes',
      icon: FileText,
      href: '/admin/quotes?status=pending_approval',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      badge: stats.pendingQuotes > 0 ? stats.pendingQuotes : undefined
    },
    {
      title: 'Manage Orders',
      description: 'View customer orders',
      icon: ShoppingCart,
      href: '/admin/orders',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined
    },
    {
      title: 'Add Product',
      description: 'Create new offering',
      icon: Plus,
      href: '/admin/products/new',
      permission: PERMISSIONS.PRODUCTS.CREATE
    },
    {
      title: 'View Customers',
      description: 'Customer accounts',
      icon: Users,
      href: '/admin/customers',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Coverage Leads',
      description: 'View coverage requests',
      icon: Target,
      href: '/admin/coverage',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Notifications',
      description: 'Email templates',
      icon: Bell,
      href: '/admin/notifications',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Product Approvals',
      description: 'Review pending products',
      icon: CheckCircle,
      href: '/admin/workflow',
      permission: PERMISSIONS.PRODUCTS.APPROVE,
      badge: stats.pendingProducts > 0 ? stats.pendingProducts : undefined
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg relative overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderStatCard = (stat: any) => {
    const Icon = stat.icon;
    return (
      <Link key={stat.title} href={stat.href}>
        <div className="rounded-lg relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-circleTel-orange/30">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-gray-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
              </div>
              {stat.urgent && (
                <Badge variant="destructive" className="text-xs">
                  URGENT
                </Badge>
              )}
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
            <p className="text-sm font-medium text-gray-700">{stat.description}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            Admin Dashboard
          </h1>
          <p className="text-circleTel-secondaryNeutral mt-2">
            Welcome back, {user?.full_name?.split(' ')[0]}! Here&apos;s your overview
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load data: {error}</span>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-200 rounded-lg shadow-sm h-auto grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Layers className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Sales & Marketing
          </TabsTrigger>
          <TabsTrigger value="operations" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Zap className="h-4 w-4 mr-2" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="system" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Shield className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.overview.map(renderStatCard)}
          </div>

          {/* Revenue Chart */}
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueTrendChart data={analyticsData.history} />
              {/* Quick Actions beside chart on large screens if needed, or below */}
            </div>
          )}
          
          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-circleTel-darkNeutral mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => (
                <PermissionGate
                  key={action.title}
                  permissions={[action.permission]}
                  fallback={
                    <div className="rounded-lg relative overflow-hidden border border-gray-200 bg-white shadow-sm opacity-50 cursor-not-allowed">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-gray-400">
                              <action.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-400">{action.title}</h3>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{action.description}</p>
                      </div>
                    </div>
                  }
                >
                  <Link href={action.href}>
                    <div className="rounded-lg relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-circleTel-orange/30">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-circleTel-orange">
                              <action.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600">{action.title}</h3>
                          </div>
                          {action.badge && (
                            <Badge variant="destructive" className="text-xs">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                </PermissionGate>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.sales.map(renderStatCard)}
          </div>
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomerGrowthChart data={analyticsData.history} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.operations.map(renderStatCard)}
          </div>
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <OrderStatusPieChart data={analyticsData.orderStatus} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 rounded-lg relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:border-circleTel-orange/30">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">Payment Provider Health</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">NetCash gateway status</p>
                
                {providerHealthLoading && !providerHealth && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking payment gateway health…</span>
                  </div>
                )}

                {!providerHealthLoading && providerHealth && (
                  <>
                    {(() => {
                      const netcash = providerHealth.providers.find((p) => p.provider === 'netcash');
                      if (!netcash) {
                        return (
                          <div className="text-sm text-gray-600">
                            NetCash provider configuration not found.
                          </div>
                        );
                      }

                      const statusLabel = !netcash.configured
                        ? 'Not Configured'
                        : netcash.healthy
                          ? 'Healthy'
                          : 'Unhealthy';

                      const statusClasses = !netcash.configured
                        ? 'bg-gray-100 text-gray-700'
                        : netcash.healthy
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700';

                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-2xl font-bold text-gray-900 tracking-tight">
                              NetCash
                            </p>
                            <Badge variant="outline" className={statusClasses}>
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            Environment: {netcash.test_mode ? 'Test' : 'Production'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Providers healthy: {providerHealth.summary.healthy_providers}/
                            {providerHealth.summary.total_providers}
                          </p>
                        </div>
                      );
                    })()}
                  </>
                )}

                {providerHealthError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{providerHealthError}</span>
                  </div>
                )}

                <div className="pt-4 text-xs">
                  <Link
                    href="/admin/payments/monitoring"
                    className="text-circleTel-orange hover:underline"
                  >
                    View detailed payment monitoring
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
