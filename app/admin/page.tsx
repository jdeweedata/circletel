'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Activity,
  Users,
  DollarSign,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminStats {
  totalProducts: number;
  pendingApprovals: number;
  approvedProducts: number;
  revenueImpact: number;
  lastUpdated: Date;
}

interface AuditActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

function useAdminStatsRealtime() {
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    pendingApprovals: 0,
    approvedProducts: 0,
    revenueImpact: 0,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('base_price_zar, is_active, status');

      if (productsError) throw productsError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active) || [];
      const approvedProducts = activeProducts.length;

      // Calculate monthly recurring revenue
      const revenueImpact = activeProducts.reduce((sum, p) => {
        const price = parseFloat(p.base_price_zar || '0');
        return sum + price;
      }, 0);

      setStats({
        totalProducts,
        pendingApprovals: 0, // No approval workflow implemented yet
        approvedProducts,
        revenueImpact: Math.round(revenueImpact),
        lastUpdated: new Date()
      });
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
  const [recentActivity, setRecentActivity] = useState<AuditActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch recent activity from audit logs
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setActivityLoading(true);

        const { data: auditLogs, error: auditError } = await supabase
          .from('product_audit_logs')
          .select(`
            id,
            action,
            changed_fields,
            changed_by_name,
            changed_at,
            change_reason,
            product_id
          `)
          .order('changed_at', { ascending: false })
          .limit(10);

        if (auditError) throw auditError;

        // Transform audit logs into activity items
        const activities: AuditActivity[] = await Promise.all(
          (auditLogs || []).map(async (log) => {
            // Fetch product name for context
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', log.product_id)
              .single();

            const productName = product?.name || 'Unknown Product';

            // Determine activity type and message
            let type = 'feature_update';
            let message = '';

            if (log.action === 'INSERT') {
              type = 'product_created';
              message = `New product "${productName}" created`;
            } else if (log.action === 'UPDATE' && log.changed_fields?.includes('base_price_zar')) {
              type = 'price_update';
              message = `Pricing updated for ${productName}`;
            } else if (log.action === 'UPDATE' && log.changed_fields?.includes('is_active')) {
              type = 'status_change';
              message = `Status changed for ${productName}`;
            } else if (log.action === 'UPDATE') {
              type = 'feature_update';
              const fields = log.changed_fields?.filter(f => f !== 'updated_at').join(', ') || 'properties';
              message = `Updated ${fields} for ${productName}`;
            } else if (log.action === 'DELETE') {
              type = 'product_archived';
              message = `Product "${productName}" archived`;
            }

            // Format timestamp
            const timestamp = formatRelativeTime(new Date(log.changed_at));

            return {
              id: log.id,
              type,
              message,
              timestamp,
              user: log.changed_by_name || 'System'
            };
          })
        );

        setRecentActivity(activities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        // Set empty array on error
        setRecentActivity([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Helper function to format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      description: 'Active product catalogue',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      description: 'Awaiting review',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      urgent: stats.pendingApprovals > 0
    },
    {
      title: 'Approved Products',
      value: stats.approvedProducts,
      description: 'Live on website',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue Impact',
      value: `R${stats.revenueImpact.toLocaleString()}`,
      description: 'Monthly recurring revenue',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Create a new product offering',
      icon: Plus,
      href: '/admin/products/new',
      color: 'bg-circleTel-orange hover:bg-circleTel-orange/90',
      permission: PERMISSIONS.PRODUCTS.CREATE
    },
    {
      title: 'Review Approvals',
      description: 'Process pending approvals',
      icon: CheckCircle,
      href: '/admin/workflow',
      color: 'bg-green-600 hover:bg-green-700',
      permission: PERMISSIONS.PRODUCTS.APPROVE,
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined
    },
    {
      title: 'View Analytics',
      description: 'Product performance metrics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-blue-600 hover:bg-blue-700',
      permission: PERMISSIONS.DASHBOARD.VIEW_ANALYTICS
    },
    {
      title: 'Manage Users',
      description: 'Admin user management',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-600 hover:bg-purple-700',
      permission: PERMISSIONS.USERS.MANAGE_ROLES
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'price_update':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'status_change':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'feature_update':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'product_archived':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'approval_request':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'product_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your product catalogue today.
            {stats.lastUpdated && (
              <span className="text-xs text-gray-500 ml-2">
                • Last updated {stats.lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
          {error && (
            <div className="flex items-center space-x-2 mt-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load real-time data: {error}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Badge variant="outline" className="text-sm">
            {user?.role?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className={stat.urgent ? 'border-orange-200 bg-orange-50/30' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
                {stat.urgent && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your product catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <PermissionGate
                key={index}
                permissions={[action.permission]}
                fallback={
                  <Button
                    disabled
                    className="h-auto p-4 flex flex-col items-start space-y-2 w-full"
                    variant="secondary"
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <action.icon className="h-5 w-5" />
                        {action.badge && (
                          <Badge variant="destructive" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                }
              >
                <Link href={action.href} className="w-full">
                  <Button
                    className={`h-auto p-4 flex flex-col items-start space-y-2 ${action.color} text-white w-full`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <action.icon className="h-5 w-5" />
                        {action.badge && (
                          <Badge variant="destructive" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                        <ArrowUpRight className="h-4 w-4 opacity-70" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </PermissionGate>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest changes and updates to the product catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Product changes will appear here
                  </p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          by {activity.user}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}