'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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

  const statCards = [
    {
      title: 'Total Revenue',
      value: `R${stats.totalRevenue.toLocaleString()}`,
      description: 'Active monthly revenue',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      description: 'Quotes + Products awaiting review',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      urgent: stats.pendingApprovals > 0
    },
    {
      title: 'Business Quotes',
      value: stats.totalQuotes,
      description: `${stats.pendingQuotes} pending, ${stats.acceptedQuotes} accepted`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Customer Orders',
      value: stats.totalOrders,
      description: `${stats.activeOrders} active, ${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      description: `${stats.newCustomersThisMonth} new this month`,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Coverage Leads',
      value: stats.totalLeads,
      description: `${stats.newLeadsThisMonth} new this month`,
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Active Products',
      value: stats.approvedProducts,
      description: `${stats.totalProducts} total products`,
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Quote Revenue',
      value: `R${stats.quoteRevenue.toLocaleString()}`,
      description: 'From accepted quotes',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  const quickActions = [
    {
      title: 'Review Quotes',
      description: 'Process pending quotes',
      icon: FileText,
      href: '/admin/quotes?status=pending_approval',
      color: 'bg-blue-600 hover:bg-blue-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      badge: stats.pendingQuotes > 0 ? stats.pendingQuotes : undefined
    },
    {
      title: 'Manage Orders',
      description: 'View customer orders',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-green-600 hover:bg-green-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined
    },
    {
      title: 'Add Product',
      description: 'Create new offering',
      icon: Plus,
      href: '/admin/products/new',
      color: 'bg-circleTel-orange hover:bg-circleTel-orange/90',
      permission: PERMISSIONS.PRODUCTS.CREATE
    },
    {
      title: 'View Customers',
      description: 'Customer accounts',
      icon: Users,
      href: '/admin/customers',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Coverage Leads',
      description: 'View coverage requests',
      icon: Target,
      href: '/admin/coverage',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Analytics',
      description: 'Performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-600 hover:bg-purple-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Notifications',
      description: 'Email templates',
      icon: Bell,
      href: '/admin/notifications',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Product Approvals',
      description: 'Review pending products',
      icon: CheckCircle,
      href: '/admin/workflow',
      color: 'bg-teal-600 hover:bg-teal-700',
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
              Welcome back, {user?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-base lg:text-lg text-gray-600 mt-2">
              Here&apos;s your admin dashboard overview
              {stats.lastUpdated && (
                <span className="text-sm text-gray-500 ml-2">
                  • Last updated {new Date(stats.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </p>
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to load data: {error}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - 8 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 ${
              stat.urgent ? 'border-orange-300 ring-2 ring-orange-200' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p
                      className="text-3xl lg:text-4xl font-extrabold tabular-nums"
                      style={{
                        color: stat.color.replace('text-', '#')
                          .replace('purple-600', '#9333ea')
                          .replace('orange-600', '#ea580c')
                          .replace('blue-600', '#2563eb')
                          .replace('green-600', '#16a34a')
                          .replace('indigo-600', '#4f46e5')
                          .replace('cyan-600', '#0891b2')
                          .replace('teal-600', '#0d9488')
                          .replace('emerald-600', '#059669')
                      }}
                    >
                      {stat.value}
                    </p>
                    {stat.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        ACTION NEEDED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                </div>
                <stat.icon className={`h-12 w-12 ${stat.color} opacity-20 flex-shrink-0`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Common administrative tasks</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <PermissionGate
              key={index}
              permissions={[action.permission]}
              fallback={
                <div className="relative">
                  <div className="group relative flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center bg-gray-100">
                      <action.icon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-sm text-gray-600">{action.title}</h3>
                    </div>
                  </div>
                </div>
              }
            >
              <Link
                href={action.href}
                className="group relative flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-circleTel-orange hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                {/* Icon Container */}
                <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${action.color.replace('bg-', 'bg-').replace(' hover:bg-', '/10 group-hover:bg-')}`}>
                  <action.icon className={`h-7 w-7 ${
                    action.color.includes('orange') ? 'text-circleTel-orange' :
                    action.color.includes('green') ? 'text-green-600' :
                    action.color.includes('blue') ? 'text-blue-600' :
                    action.color.includes('purple') ? 'text-purple-600' :
                    action.color.includes('indigo') ? 'text-indigo-600' :
                    action.color.includes('cyan') ? 'text-cyan-600' :
                    action.color.includes('yellow') ? 'text-yellow-600' :
                    'text-teal-600'
                  }`} />
                </div>

                {/* Title */}
                <div className="text-center">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-circleTel-orange transition-colors">
                    {action.title}
                  </h3>
                  {action.badge && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>

                {/* Hover Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-circleTel-orange rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </PermissionGate>
          ))}
        </div>
      </div>
    </div>
  );
}
