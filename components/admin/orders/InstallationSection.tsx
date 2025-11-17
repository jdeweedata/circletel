'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Tool,
  Package,
  Star,
  MessageSquare
} from 'lucide-react';

interface InstallationTask {
  id: string;
  scheduled_date: string;
  scheduled_time_slot?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  actual_duration_minutes?: number;

  // Technician info
  technician?: {
    name: string;
    phone?: string;
    email?: string;
  };

  // Equipment
  router_model?: string;
  router_serial?: string;
  router_mac_address?: string;
  equipment_installed?: any[];

  // Completion
  completion_photos?: string[];
  technician_notes?: string;
  customer_rating?: number;
  customer_feedback?: string;

  // Issues
  issues_encountered?: string;
  resolution_notes?: string;
}

interface InstallationSectionProps {
  orderId: string;
  className?: string;
}

export function InstallationSection({ orderId, className }: InstallationSectionProps) {
  const [task, setTask] = useState<InstallationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstallationTask();
  }, [orderId]);

  const fetchInstallationTask = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch installation task for this order
      const response = await fetch(`/api/admin/orders/${orderId}/installation`);

      if (response.status === 404) {
        // No installation task yet - this is okay
        setTask(null);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch installation details');
      }

      setTask(result.data);
    } catch (err) {
      console.error('Error fetching installation task:', err);
      setError(err instanceof Error ? err.message : 'Failed to load installation details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Installation Details
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Installation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Installation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No installation scheduled yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            Installation Details
          </CardTitle>
          {getStatusBadge(task.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(task.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {task.scheduled_time_slot && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Time Slot</p>
                  <p className="text-sm text-gray-900 capitalize">{task.scheduled_time_slot}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technician Information */}
        {task.technician && task.technician.name && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Assigned Technician</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">{String(task.technician.name)}</span>
                </div>
                {task.technician.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${task.technician.phone}`} className="text-sm text-blue-600 hover:underline">
                      {String(task.technician.phone)}
                    </a>
                  </div>
                )}
                {task.technician.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${task.technician.email}`} className="text-sm text-blue-600 hover:underline">
                      {String(task.technician.email)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Progress Information */}
        {(task.started_at || task.completed_at) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.started_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Started At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.started_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {task.completed_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {task.actual_duration_minutes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-sm text-gray-900">{formatDuration(task.actual_duration_minutes)}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Equipment Information */}
        {(task.router_model || task.router_serial) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Equipment Installed
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.router_model && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Router Model</p>
                    <p className="text-sm text-gray-900">{task.router_model}</p>
                  </div>
                )}
                {task.router_serial && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Serial Number</p>
                    <p className="text-sm font-mono text-gray-900">{task.router_serial}</p>
                  </div>
                )}
                {task.router_mac_address && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">MAC Address</p>
                    <p className="text-sm font-mono text-gray-900">{task.router_mac_address}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Technician Notes */}
        {task.technician_notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Technician Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                {task.technician_notes}
              </p>
            </div>
          </>
        )}

        {/* Customer Feedback */}
        {(task.customer_rating || task.customer_feedback) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Customer Feedback
              </h4>
              {task.customer_rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < task.customer_rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({task.customer_rating}/5)</span>
                </div>
              )}
              {task.customer_feedback && (
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                  {task.customer_feedback}
                </p>
              )}
            </div>
          </>
        )}

        {/* Issues (if any) */}
        {task.issues_encountered && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Issues Encountered
              </h4>
              <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-md border border-red-200">
                {task.issues_encountered}
              </p>
              {task.resolution_notes && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">Resolution</p>
                  <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200 mt-1">
                    {task.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
