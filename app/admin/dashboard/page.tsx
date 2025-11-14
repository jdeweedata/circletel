'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  BarChart3
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import type { PaymentProviderType } from '@/lib/types/payment.types';

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

    fetchProviderHealth();
  }, []);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `R${stats.totalRevenue.toLocaleString()}`,
      description: 'Active monthly revenue',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/analytics'
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
    },
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
      title: 'Customer Orders',
      value: stats.totalOrders.toString(),
      description: `${stats.activeOrders} active, ${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/admin/orders'
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
      title: 'Coverage Leads',
      value: stats.totalLeads.toString(),
      description: `${stats.newLeadsThisMonth} new this month`,
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      href: '/admin/coverage'
    },
    {
      title: 'Active Products',
      value: stats.approvedProducts.toString(),
      description: `${stats.totalProducts} total products`,
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      href: '/admin/products'
    },
    {
      title: 'Quote Revenue',
      value: `R${stats.quoteRevenue.toLocaleString()}`,
      description: 'From accepted quotes',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/admin/quotes?status=accepted'
    }
  ];

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
      title: 'Analytics',
      description: 'Performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
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
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-circleTel-darkNeutral">
                      {stat.value}
                    </div>
                    {stat.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-circleTel-secondaryNeutral mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-gray-600">
                Payment Provider Health
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                NetCash gateway status
              </CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-orange-100">
              <DollarSign className="h-5 w-5 text-circleTel-orange" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {providerHealthLoading && !providerHealth && (
              <div className="flex items-center gap-2 text-sm text-circleTel-secondaryNeutral">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Checking payment gateway health5</span>
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
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-circleTel-darkNeutral">
                          NetCash
                        </div>
                        <Badge variant="outline" className={statusClasses}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="text-xs text-circleTel-secondaryNeutral">
                        Environment: {netcash.test_mode ? 'Test' : 'Production'}
                      </div>
                      <div className="text-xs text-circleTel-secondaryNeutral">
                        Providers healthy: {providerHealth.summary.healthy_providers}/
                        {providerHealth.summary.total_providers}
                      </div>
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

            <div className="pt-2 text-xs">
              <Link
                href="/admin/payments/monitoring"
                className="text-circleTel-orange hover:underline"
              >
                View detailed payment monitoring
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Card className="opacity-50 cursor-not-allowed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <CardTitle className="text-base text-gray-400">
                            {action.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {action.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              }
            >
              <Link href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-circleTel-orange" />
                        <div>
                          <CardTitle className="text-base">
                            {action.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {action.description}
                          </CardDescription>
                        </div>
                      </div>
                      {action.badge && (
                        <Badge variant="destructive" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </PermissionGate>
          ))}
        </div>
      </div>
    </div>
  );
}
