'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Clock,
  CreditCard,
  CheckCircle,
  CalendarCheck,
  Tool,
  Zap,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface StatusCount {
  status: string;
  label: string;
  count: number;
  percentage: number;
  icon: any;
  color: string;
  bgColor: string;
}

export function OrderStatusDistributionWidget() {
  const [distribution, setDistribution] = useState<StatusCount[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDistribution();
  }, []);

  const fetchOrderDistribution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersData = result.data || [];
      const total = ordersData.length;

      // Count orders by status
      const statusCounts = new Map<string, number>();
      ordersData.forEach((order: any) => {
        const count = statusCounts.get(order.status) || 0;
        statusCounts.set(order.status, count + 1);
      });

      // Define status metadata
      const statusMetadata: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
        pending: {
          label: 'Pending',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        },
        payment_method_pending: {
          label: 'Payment Pending',
          icon: CreditCard,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        },
        payment_method_registered: {
          label: 'Payment Ready',
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        installation_scheduled: {
          label: 'Scheduled',
          icon: CalendarCheck,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        installation_in_progress: {
          label: 'Installing',
          icon: Tool,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100'
        },
        installation_completed: {
          label: 'Completed',
          icon: CheckCircle,
          color: 'text-teal-600',
          bgColor: 'bg-teal-100'
        },
        active: {
          label: 'Active',
          icon: Zap,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        cancelled: {
          label: 'Cancelled',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      };

      // Build distribution array
      const dist: StatusCount[] = Array.from(statusCounts.entries())
        .map(([status, count]) => {
          const meta = statusMetadata[status] || {
            label: status,
            icon: Clock,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
          };

          return {
            status,
            label: meta.label,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            icon: meta.icon,
            color: meta.color,
            bgColor: meta.bgColor
          };
        })
        .sort((a, b) => b.count - a.count);

      setDistribution(dist);
      setTotalOrders(total);
    } catch (err) {
      console.error('Error fetching order distribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to load distribution');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Order Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Order Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">
              Order Status Distribution
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {totalOrders} total orders across workflow stages
            </CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-blue-100">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {distribution.length === 0 ? (
          <div className="text-center py-6">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">No orders yet</p>
            <p className="text-xs text-gray-500 mt-1">Distribution will appear as orders are created</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distribution.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.status}
                  href={`/admin/orders?status=${item.status}`}
                  className="block"
                >
                  <div className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${item.bgColor}`}>
                          <Icon className={`h-3 w-3 ${item.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-circleTel-orange transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                        <span className="text-xs text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${item.bgColor} rounded-full transition-all group-hover:opacity-80`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link href="/admin/orders">
            <span className="text-xs text-circleTel-orange hover:underline cursor-pointer">
              View detailed order analytics →
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
