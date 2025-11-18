'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface Installation {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  scheduled_time_slot: string;
  installation_address: string;
  status: string;
  technician_name?: string;
}

export function TodaysInstallationsWidget() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysInstallations();
  }, []);

  const fetchTodaysInstallations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all orders
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersData = result.data || [];
      const today = new Date().toISOString().split('T')[0];

      // Filter for today's installations
      // Note: This is a simple filter. In production, you'd query installation_tasks table
      const todaysInstallations: Installation[] = ordersData
        .filter((order: any) =>
          order.status === 'installation_scheduled' ||
          order.status === 'installation_in_progress'
        )
        .map((order: any) => ({
          id: order.id,
          order_id: order.id,
          order_number: order.order_number,
          customer_name: `${order.first_name} ${order.last_name}`,
          scheduled_time_slot: order.installation_time_slot || 'morning',
          installation_address: order.installation_address,
          status: order.status,
          technician_name: undefined // Would come from installation_tasks join
        }))
        .slice(0, 5); // Limit to 5 for widget display

      setInstallations(todaysInstallations);
    } catch (err) {
      console.error('Error fetching installations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load installations');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotLabel = (slot: string) => {
    const slots: Record<string, string> = {
      morning: '08:00 - 12:00',
      afternoon: '12:00 - 16:00',
      evening: '16:00 - 19:00'
    };
    return slots[slot] || slot;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'installation_in_progress') {
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">In Progress</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Scheduled</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Installations
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
            Today's Installations
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
              Today's Installations
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {new Date().toLocaleDateString('en-ZA', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-purple-100">
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {installations.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">No installations today</p>
            <p className="text-xs text-gray-500 mt-1">All clear for the day</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {installations.map((installation) => (
                <Link key={installation.id} href={`/admin/orders/${installation.order_id}`}>
                  <div className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {installation.customer_name}
                          </p>
                          {getStatusBadge(installation.status)}
                        </div>
                        <p className="text-xs text-gray-600 font-mono">
                          {installation.order_number}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeSlotLabel(installation.scheduled_time_slot)}</span>
                      </div>

                      {installation.technician_name && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{installation.technician_name}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{installation.installation_address}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {installations.length >= 5 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/orders?status=installation_scheduled">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Scheduled Installations
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
