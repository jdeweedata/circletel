'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CalendarCheck,
  Tool,
  Zap,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react';

interface OrderRequiringAttention {
  status: string;
  count: number;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  href: string;
}

export function OrdersRequiringAttentionWidget() {
  const [orders, setOrders] = useState<OrderRequiringAttention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderStats();
  }, []);

  const fetchOrderStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersData = result.data || [];

      // Calculate action-required counts
      const actionItems: OrderRequiringAttention[] = [
        {
          status: 'needs_payment',
          count: ordersData.filter((o: any) =>
            o.status === 'pending' || o.status === 'payment_method_pending'
          ).length,
          label: 'Needs Payment Method',
          icon: CreditCard,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          href: '/admin/orders?filter=needs_payment'
        },
        {
          status: 'ready_to_schedule',
          count: ordersData.filter((o: any) => o.status === 'payment_method_registered').length,
          label: 'Ready to Schedule',
          icon: CalendarCheck,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          href: '/admin/orders?filter=ready_to_schedule'
        },
        {
          status: 'installation_in_progress',
          count: ordersData.filter((o: any) => o.status === 'installation_in_progress').length,
          label: 'Installation In Progress',
          icon: Tool,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          href: '/admin/orders?filter=in_progress'
        },
        {
          status: 'ready_to_activate',
          count: ordersData.filter((o: any) => o.status === 'installation_completed').length,
          label: 'Ready to Activate',
          icon: Zap,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          href: '/admin/orders?status=installation_completed'
        }
      ];

      setOrders(actionItems);
    } catch (err) {
      console.error('Error fetching order stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order stats');
    } finally {
      setLoading(false);
    }
  };

  const totalRequiringAction = orders.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Orders Requiring Attention
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
            Orders Requiring Attention
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
              Orders Requiring Attention
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Action items across workflow stages
            </CardDescription>
          </div>
          {totalRequiringAction > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {totalRequiringAction}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalRequiringAction === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-sm text-gray-600 font-medium">All caught up!</p>
            <p className="text-xs text-gray-500 mt-1">No orders requiring immediate action</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.filter(item => item.count > 0).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.status} href={item.href}>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor} hover:shadow-md transition-all cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white`}>
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-600">{item.count} order{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="w-full">
              View All Orders
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
