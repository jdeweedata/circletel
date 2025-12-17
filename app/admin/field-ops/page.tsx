'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/auth/admin-api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Navigation,
  Phone,
  Eye,
  Wrench,
  TrendingUp,
  Radio,
  User,
  MapPinned,
  Zap,
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  Search,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  SharedPageHeader,
} from '@/components/shared/dashboard';
import { toast } from 'sonner';
import {
  AdminFieldOpsData,
  TechnicianWithStats,
  FieldJobWithTechnician,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_TYPE_LABELS,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/lib/types/technician-tracking';

// Enhanced Stat Card Component
interface EnhancedStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  href?: string;
}

function EnhancedStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  href,
}: EnhancedStatCardProps) {
  const router = useRouter();

  const variantStyles = {
    default: 'bg-white border-gray-200 hover:border-gray-300',
    primary: 'bg-gradient-to-br from-circleTel-orange/5 to-orange-50 border-circleTel-orange/20 hover:border-circleTel-orange/40',
    success: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 hover:border-emerald-300',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/50 hover:border-amber-300',
    info: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 hover:border-blue-300',
  };

  const iconStyles = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-circleTel-orange/10 text-circleTel-orange',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <div
      onClick={() => href && router.push(href)}
      className={`
        relative overflow-hidden rounded-xl border p-5
        transition-all duration-300 ease-out
        hover:shadow-lg hover:-translate-y-0.5
        ${variantStyles[variant]}
        ${href ? 'cursor-pointer' : ''}
      `}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              {value}
            </span>
            {trend && trendValue && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>

      {href && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="h-3 w-3 text-gray-400" />
        </div>
      )}
    </div>
  );
}

// Technician Avatar Component
function TechnicianAvatar({ name, status }: { name: string; status: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const statusColors = {
    available: 'ring-emerald-400 bg-emerald-500',
    on_job: 'ring-circleTel-orange bg-circleTel-orange',
    break: 'ring-amber-400 bg-amber-500',
    offline: 'ring-gray-400 bg-gray-400',
  };

  return (
    <div className="relative">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-semibold shadow-md">
        {initials}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${statusColors[status as keyof typeof statusColors] || statusColors.offline}`} />
    </div>
  );
}

// Schedulable Order Interface
interface SchedulableOrder {
  id: string;
  order_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  installation_address: string;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  coordinates: { lat: number; lng: number } | null;
  package_name: string;
  package_speed: string;
  package_price: number;
  preferred_installation_date: string | null;
  installation_scheduled_date: string | null;
  special_instructions: string | null;
  created_at: string;
  has_installation_task: boolean;
  full_address: string;
  customer_name: string;
}

interface SchedulableOrdersData {
  ready_to_schedule: SchedulableOrder[];
  pending_payment: SchedulableOrder[];
  already_scheduled: SchedulableOrder[];
  total_schedulable: number;
}

// New Job Modal Component
function NewJobModal({
  open,
  onOpenChange,
  technicians,
  onJobCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians: TechnicianWithStats[];
  onJobCreated: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [ordersData, setOrdersData] = useState<SchedulableOrdersData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SchedulableOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('');
  const [selectedTechnician, setSelectedTechnicianId] = useState('');

  useEffect(() => {
    if (open) {
      fetchSchedulableOrders();
    } else {
      // Reset state when closing
      setSelectedOrder(null);
      setSearchQuery('');
      setScheduledDate('');
      setScheduledTimeSlot('');
      setSelectedTechnicianId('');
    }
  }, [open]);

  const fetchSchedulableOrders = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/field-ops/schedulable-orders');
      if (response.ok) {
        const result = await response.json();
        setOrdersData(result.data);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!selectedOrder || !scheduledDate) {
      toast.error('Please select an order and scheduled date');
      return;
    }

    setCreating(true);
    try {
      const response = await adminFetch('/api/admin/field-ops/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          job_type: 'fibre_installation',
          title: `Installation - ${selectedOrder.package_name}`,
          description: `Install ${selectedOrder.package_name} for ${selectedOrder.customer_name}`,
          address: selectedOrder.full_address,
          latitude: selectedOrder.coordinates?.lat,
          longitude: selectedOrder.coordinates?.lng,
          customer_name: selectedOrder.customer_name,
          customer_phone: selectedOrder.phone,
          customer_email: selectedOrder.email,
          scheduled_date: scheduledDate,
          scheduled_time_start: scheduledTimeSlot || null,
          assigned_technician_id: selectedTechnician || null,
          priority: 'normal',
        }),
      });

      if (response.ok) {
        toast.success('Installation job created successfully');
        onJobCreated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create job');
      }
    } catch (err) {
      toast.error('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const filteredOrders = ordersData?.ready_to_schedule.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.full_address.toLowerCase().includes(query) ||
      order.package_name.toLowerCase().includes(query)
    );
  }) || [];

  const availableTechnicians = technicians.filter(t => t.status === 'available');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-circleTel-orange/10 rounded-lg">
              <Plus className="h-5 w-5 text-circleTel-orange" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create Installation Job</DialogTitle>
              <DialogDescription>
                Select an order to schedule for installation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!selectedOrder ? (
            // Order Selection View
            <>
              {/* Search */}
              <div className="p-4 border-b bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number, customer, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-circleTel-orange" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Package className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium">No orders ready for scheduling</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'Try a different search term' : 'All orders have been scheduled'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-semibold text-gray-900">
                                {order.order_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  order.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="font-medium text-gray-900">{order.customer_name}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{order.full_address}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {order.package_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.phone}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-circleTel-orange transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Payment Orders */}
              {ordersData && ordersData.pending_payment.length > 0 && (
                <div className="border-t bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {ordersData.pending_payment.length} order(s) pending payment setup
                    </span>
                  </div>
                  <p className="text-xs text-amber-600">
                    These orders cannot be scheduled until payment method is confirmed.
                  </p>
                </div>
              )}
            </>
          ) : (
            // Scheduling Form View
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Selected Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">{selectedOrder.order_number}</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        Selected
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedOrder.full_address}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{selectedOrder.package_name}</span>
                      <span>{selectedOrder.package_speed}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedOrder(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scheduling Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Installation Date *
                    </Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_slot" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      Time Slot
                    </Label>
                    <Select value={scheduledTimeSlot} onValueChange={setScheduledTimeSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00-10:00">08:00 - 10:00</SelectItem>
                        <SelectItem value="10:00-12:00">10:00 - 12:00</SelectItem>
                        <SelectItem value="12:00-14:00">12:00 - 14:00</SelectItem>
                        <SelectItem value="14:00-16:00">14:00 - 16:00</SelectItem>
                        <SelectItem value="16:00-18:00">16:00 - 18:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Assign Technician
                  </Label>
                  {availableTechnicians.length > 0 ? (
                    <Select value={selectedTechnician} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTechnicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              {tech.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      No technicians currently available
                    </div>
                  )}
                </div>

                {selectedOrder.special_instructions && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-900 mb-1">Special Instructions</p>
                    <p className="text-sm text-blue-700">{selectedOrder.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedOrder && (
          <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Back to Orders
            </Button>
            <Button
              onClick={handleCreateJob}
              disabled={!scheduledDate || creating}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Installation Job
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function FieldOpsPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminFieldOpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [authError, setAuthError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Use adminFetch to automatically include Authorization header
      const response = await adminFetch('/api/admin/field-ops');

      if (response.status === 401) {
        stopPolling();
        setAuthError(true);
        router.push('/admin/login');
        return;
      }

      if (response.status === 403) {
        stopPolling();
        setAuthError(true);
        toast.error('Admin access required');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (!authError) {
        toast.error('Failed to load field operations data');
      }
    } finally {
      setLoading(false);
    }
  }, [stopPolling, router, authError]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    intervalRef.current = setInterval(fetchData, 30000);
    return () => stopPolling();
  }, [fetchData, stopPolling]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (!data) return null;

  const { technicians, todays_jobs, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SharedPageHeader
        title="Field Operations"
        subtitle="Manage technicians and field jobs"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              onClick={() => setNewJobModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        }
      />

      {/* New Job Modal */}
      <NewJobModal
        open={newJobModalOpen}
        onOpenChange={setNewJobModalOpen}
        technicians={technicians}
        onJobCreated={fetchData}
      />

      {/* Stats Cards - Enhanced with gradients and better layout */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <EnhancedStatCard
          title="Technicians"
          value={stats.total_technicians}
          icon={<Users className="h-5 w-5" />}
          variant="info"
          href="/admin/field-ops/technicians"
          subtitle="Total team"
        />
        <EnhancedStatCard
          title="Available"
          value={stats.available_technicians}
          icon={<Radio className="h-5 w-5" />}
          variant="success"
          subtitle="Ready to dispatch"
        />
        <EnhancedStatCard
          title="On Job"
          value={stats.on_job_technicians}
          icon={<Wrench className="h-5 w-5" />}
          variant="primary"
          subtitle="In the field"
        />
        <EnhancedStatCard
          title="Pending"
          value={stats.pending_jobs}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          href="/admin/field-ops/jobs"
          subtitle="Awaiting assignment"
        />
        <EnhancedStatCard
          title="In Progress"
          value={stats.in_progress_jobs}
          icon={<Zap className="h-5 w-5" />}
          variant="info"
          href="/admin/field-ops/jobs"
          subtitle="Active jobs"
        />
        <EnhancedStatCard
          title="Done Today"
          value={stats.completed_today}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          subtitle="Completed"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="bg-gray-100/80 p-1 rounded-lg">
          <TabsTrigger value="map" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4">
            <MapPinned className="h-4 w-4 mr-2" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="technicians" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4">
            <Users className="h-4 w-4 mr-2" />
            Technicians
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4">
            <Briefcase className="h-4 w-4 mr-2" />
            Today's Jobs
          </TabsTrigger>
        </TabsList>

        {/* Map View Tab */}
        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-0 shadow-lg bg-white">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-circleTel-orange/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-circleTel-orange" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Live Map</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Real-time technician tracking</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] relative overflow-hidden">
                    {/* Stylized map background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
                      {/* Grid pattern */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `
                          linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                          linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                      }} />
                      {/* Decorative circles representing locations */}
                      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-circleTel-orange/30 rounded-full animate-ping" />
                      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-circleTel-orange rounded-full" />
                      <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-blue-400/40 rounded-full" />
                      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-emerald-400/40 rounded-full" />
                      <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-amber-400/40 rounded-full" />
                    </div>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 text-center max-w-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-circleTel-orange/20 to-orange-100 flex items-center justify-center">
                          <MapPinned className="h-8 w-8 text-circleTel-orange" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Map Integration Coming Soon</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Track your technicians in real-time with live GPS updates and route optimization.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technician List */}
            <div>
              <Card className="overflow-hidden border-0 shadow-lg bg-white h-full">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Technicians</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">{technicians.length} team members</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                    {technicians.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <User className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No technicians found</p>
                      </div>
                    ) : (
                      technicians.map((tech) => (
                        <div
                          key={tech.id}
                          className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                            selectedTechnician === tech.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setSelectedTechnician(tech.id)}
                        >
                          <div className="flex items-start gap-3">
                            <TechnicianAvatar name={tech.full_name} status={tech.status} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-900 truncate">{tech.full_name}</span>
                                <Badge
                                  className={`text-[10px] px-2 py-0.5 font-medium shrink-0 ${
                                    tech.status === 'available'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : tech.status === 'on_job'
                                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}
                                  variant="outline"
                                >
                                  {TECHNICIAN_STATUS_LABELS[tech.status]}
                                </Badge>
                              </div>
                              <div className="text-sm mt-1">
                                {tech.current_job_title ? (
                                  <span className="text-circleTel-orange font-medium">{tech.current_job_title}</span>
                                ) : (
                                  <span className="text-gray-400">No active job</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                                <MapPin className="h-3 w-3" />
                                {tech.location_updated_at ? (
                                  <span>Last seen {new Date(tech.location_updated_at).toLocaleTimeString()}</span>
                                ) : (
                                  <span>Location unavailable</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card className="overflow-hidden border-0 shadow-lg bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">All Technicians</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">{technicians.length} team members</p>
                  </div>
                </div>
                <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange/90 shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technician
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Technician</TableHead>
                    <TableHead className="font-semibold">Employee ID</TableHead>
                    <TableHead className="font-semibold">Team</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Current Job</TableHead>
                    <TableHead className="font-semibold text-center">Done</TableHead>
                    <TableHead className="font-semibold text-center">Pending</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.map((tech) => (
                    <TableRow key={tech.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TechnicianAvatar name={tech.full_name} status={tech.status} />
                          <span className="font-semibold text-gray-900">{tech.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">{tech.employee_id || '-'}</TableCell>
                      <TableCell>
                        {tech.team ? (
                          <Badge variant="outline" className="bg-gray-50">{tech.team}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            tech.status === 'available'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : tech.status === 'on_job'
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                          variant="outline"
                        >
                          {TECHNICIAN_STATUS_LABELS[tech.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tech.current_job_number ? (
                          <span className="text-circleTel-orange font-semibold">{tech.current_job_number}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                          {tech.jobs_completed_today}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                          tech.pending_jobs > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tech.pending_jobs}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {tech.location_updated_at
                            ? new Date(tech.location_updated_at).toLocaleTimeString()
                            : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" asChild>
                            <a href={`tel:${tech.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card className="overflow-hidden border-0 shadow-lg bg-white">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Today's Jobs</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">{todays_jobs.length} jobs scheduled</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] bg-white border-gray-200">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="bg-circleTel-orange hover:bg-circleTel-orange/90 shadow-md hover:shadow-lg transition-all"
                    onClick={() => setNewJobModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Job #</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Address</TableHead>
                    <TableHead className="font-semibold">Scheduled</TableHead>
                    <TableHead className="font-semibold">Technician</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todays_jobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-gray-700">{job.job_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          {JOB_TYPE_LABELS[job.job_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate text-gray-900">
                        {job.title}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {job.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.scheduled_time_start ? (
                          <span className="font-medium text-gray-700">{job.scheduled_time_start}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.technician_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-semibold">
                              {job.technician_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="text-gray-900">{job.technician_name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            job.priority === 'urgent'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : job.priority === 'high'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : job.priority === 'normal'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {PRIORITY_LABELS[job.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            job.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : job.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : job.status === 'assigned'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                          variant="outline"
                        >
                          {JOB_STATUS_LABELS[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {job.latitude && job.longitude && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps?q=${job.latitude},${job.longitude}`,
                                  '_blank'
                                );
                              }}
                            >
                              <Navigation className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {todays_jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center text-gray-500">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Briefcase className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="font-medium text-gray-600">No jobs scheduled</p>
                          <p className="text-sm text-gray-400 mt-1">Create a new job to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
