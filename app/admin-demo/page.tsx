'use client';

import { useState } from 'react';
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

// Mock user type - will be replaced with real auth
interface User {
  full_name?: string;
  role?: string;
}

// Mock stats data - will be replaced with real data
const mockStats = {
  totalProducts: 47,
  pendingApprovals: 3,
  approvedProducts: 44,
  revenueImpact: 2450000,
  lastUpdated: new Date()
};

// Mock hooks for now - will be replaced with real implementations
function useAdminAuth() {
  const user: User = {
    full_name: 'Admin User',
    role: 'product_manager'
  };

  return {
    user,
    canApprove: () => user?.role === 'super_admin' || user?.role === 'product_manager',
    canEdit: () => true
  };
}

function useAdminStatsRealtime() {
  return {
    stats: mockStats,
    isLoading: false,
    error: null,
    refresh: () => console.log('Refreshing stats...')
  };
}

export default function AdminDemoDashboard() {
  const { user, canApprove, canEdit } = useAdminAuth();
  const { stats, isLoading, error, refresh } = useAdminStatsRealtime();

  // Mock recent activity data
  const [recentActivity] = useState([
    {
      id: '1',
      type: 'approval_request',
      message: 'New product "BizFibre Connect Ultra" submitted for approval',
      timestamp: '2 hours ago',
      user: 'John Smith'
    },
    {
      id: '2',
      type: 'price_update',
      message: 'Pricing updated for SkyFibre SMB Professional',
      timestamp: '4 hours ago',
      user: 'Sarah Johnson'
    },
    {
      id: '3',
      type: 'product_approved',
      message: 'SkyFibre Residential Home Max approved and published',
      timestamp: '1 day ago',
      user: 'Mike Wilson'
    },
    {
      id: '4',
      type: 'feature_update',
      message: 'Router specifications updated for business packages',
      timestamp: '2 days ago',
      user: 'Emma Davis'
    }
  ]);

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
      href: '/admin-demo/products/new',
      color: 'bg-circleTel-orange hover:bg-circleTel-orange/90',
      disabled: !canEdit()
    },
    {
      title: 'Review Approvals',
      description: 'Process pending approvals',
      icon: CheckCircle,
      href: '/admin-demo/workflow',
      color: 'bg-green-600 hover:bg-green-700',
      disabled: !canApprove(),
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined
    },
    {
      title: 'View Analytics',
      description: 'Product performance metrics',
      icon: TrendingUp,
      href: '/admin-demo/analytics',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Manage Users',
      description: 'Admin user management',
      icon: Users,
      href: '/admin-demo/users',
      color: 'bg-purple-600 hover:bg-purple-700',
      disabled: user?.role !== 'super_admin'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval_request':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'price_update':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'product_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'feature_update':
        return <Package className="h-4 w-4 text-purple-500" />;
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
      {/* Demo Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">
              🎉 Demo Admin Dashboard with Collapsible Sidebar
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              This is a complete clone of your admin dashboard featuring the new collapsible sidebar component.
              Click the toggle button in the sidebar to collapse/expand it!
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your product catalogue today.
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
              <div key={index}>
                {action.disabled ? (
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
                ) : (
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
                )}
              </div>
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
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
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
        </CardContent>
      </Card>
    </div>
  );
}