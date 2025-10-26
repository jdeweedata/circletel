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
import { supabase } from '@/lib/supabase/client';

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

      // Fetch stats from API route (uses service role credentials)
      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to fetch stats');
      }

      setStats({
        totalProducts: result.data.totalProducts,
        pendingApprovals: result.data.pendingApprovals,
        approvedProducts: result.data.approvedProducts,
        revenueImpact: result.data.revenueImpact,
        lastUpdated: new Date(result.data.lastUpdated)
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
          .limit(10) as {
            data: Array<{
              id: string;
              action: string;
              changed_fields: string[] | null;
              changed_by_name: string | null;
              changed_at: string;
              change_reason: string | null;
              product_id: string;
            }> | null;
            error: any
          };

        if (auditError) throw auditError;

        // Transform audit logs into activity items
        const activities: AuditActivity[] = await Promise.all(
          (auditLogs || []).map(async (log: any) => {
            // Fetch product name for context
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', log.product_id)
              .single() as { data: { name: string } | null; error: any };

            const productName = product?.name || 'Unknown Product';

            // Determine activity type and message
            let type = 'feature_update';
            let message = '';

            if (log.action === 'INSERT') {
              type = 'product_created';
              message = `New product "${productName}" created`;
            } else if (log.action === 'UPDATE' && log.changed_fields?.includes('monthly_price')) {
              type = 'price_update';
              message = `Pricing updated for ${productName}`;
            } else if (log.action === 'UPDATE' && log.changed_fields?.includes('status')) {
              type = 'status_change';
              message = `Status changed for ${productName}`;
            } else if (log.action === 'UPDATE') {
              type = 'feature_update';
              const fields = log.changed_fields?.filter((f: string) => f !== 'updated_at').join(', ') || 'properties';
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
        return <Plus className="h-6 w-6 text-green-600" />;
      case 'price_update':
        return <DollarSign className="h-6 w-6 text-blue-600" />;
      case 'status_change':
        return <Activity className="h-6 w-6 text-orange-600" />;
      case 'feature_update':
        return <Package className="h-6 w-6 text-purple-600" />;
      case 'product_archived':
        return <Clock className="h-6 w-6 text-red-600" />;
      case 'approval_request':
        return <Clock className="h-6 w-6 text-orange-600" />;
      case 'product_approved':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Activity className="h-6 w-6 text-gray-600" />;
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
    <div className="space-y-8">
      {/* Welcome Section - Consumer Dashboard Style */}
      <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
              Welcome back, {user?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-base lg:text-lg text-gray-600 mt-2">
              Here&apos;s what&apos;s happening with your product catalogue today.
              {stats.lastUpdated && (
                <span className="text-sm text-gray-500 ml-2">
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

      {/* Stats Grid - Consumer Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 ${stat.urgent ? 'border-orange-300' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-4xl lg:text-5xl font-extrabold mt-2 tabular-nums" style={{ color: stat.color.replace('text-', '#').replace('orange-600', '#ea580c').replace('blue-600', '#2563eb').replace('green-600', '#16a34a').replace('purple-600', '#9333ea') }}>
                    {stat.value}
                    {stat.urgent && (
                      <Badge variant="destructive" className="ml-2 text-sm align-middle">
                        {stats.pendingApprovals}
                      </Badge>
                    )}
                  </p>
                </div>
                <stat.icon className={`h-12 w-12 ${stat.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions - Consumer Dashboard Style */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Common tasks to manage your product catalogue</p>
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
                  <action.icon className={`h-7 w-7 ${action.color.includes('orange') ? 'text-circleTel-orange' : action.color.includes('green') ? 'text-green-600' : action.color.includes('blue') ? 'text-blue-600' : 'text-purple-600'}`} />
                </div>

                {/* Title */}
                <div className="text-center">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-circleTel-orange transition-colors">
                    {action.title}
                  </h3>
                  {action.badge && (
                    <Badge variant="secondary" className="mt-1 text-xs">
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

      {/* Recent Activity - Consumer Dashboard Style */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            <Link href="/admin/products?tab=history" className="text-sm font-semibold text-circleTel-orange hover:underline">
              See all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4 border rounded-lg animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base">{activity.message}</p>
                      <p className="text-base text-gray-600">
                        by {activity.user} • {activity.timestamp}
                      </p>
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