'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Search,
  Eye,
  RefreshCw,
  Wrench,
  CheckCircle,
  XCircle,
  Package,
  AlertCircle,
  MapPin,
  User,
  Phone,
  CalendarCheck,
  Loader2,
  Filter,
  Download,
  List,
  Grid,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { format } from 'date-fns';
import { InstallationCalendar } from '@/components/admin/orders/InstallationCalendar';

interface Installation {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  installation_address: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  status: string;
  technician_name: string | null;
  technician_phone: string | null;
  package_name: string;
  package_speed: string;
  router_model: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface InstallationStats {
  pending: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  failed: number;
  total: number;
}

export default function AdminInstallationsPage() {
  const { user } = useAdminAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [filteredInstallations, setFilteredInstallations] = useState<Installation[]>([]);
  const [stats, setStats] = useState<InstallationStats>({
    pending: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    fetchInstallations();
  }, []);

  useEffect(() => {
    filterInstallations();
  }, [installations, searchQuery, statusFilter, dateFilter]);

  const fetchInstallations = async () => {
    try {
      setLoading(true);

      // Fetch orders with installation status
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch installations');
      }

      const ordersData = result.data || [];

      // Filter orders that need installation or have installation scheduled/completed
      const installationStatuses = [
        'kyc_approved',
        'payment_method_registered',
        'installation_scheduled',
        'installation_in_progress',
        'installation_completed',
        'active'
      ];

      const installationsData = ordersData
        .filter((order: any) => installationStatuses.includes(order.status))
        .map((order: any) => ({
          id: order.id,
          order_id: order.id,
          order_number: order.order_number,
          customer_name: `${order.first_name} ${order.last_name}`,
          customer_phone: order.phone,
          customer_email: order.email,
          installation_address: order.installation_address,
          scheduled_date: order.installation_scheduled_date,
          scheduled_time_slot: order.installation_time_slot,
          status: order.status,
          technician_name: null, // Would come from installation_tasks join
          technician_phone: null,
          package_name: order.package_name,
          package_speed: order.package_speed,
          router_model: null,
          started_at: null,
          completed_at: order.installation_completed_date,
          created_at: order.created_at,
        }));

      setInstallations(installationsData);
      setLastRefreshed(new Date());

      // Calculate stats
      const pending = installationsData.filter((i: Installation) =>
        ['kyc_approved', 'payment_method_registered'].includes(i.status)
      ).length;
      const scheduled = installationsData.filter((i: Installation) =>
        i.status === 'installation_scheduled'
      ).length;
      const in_progress = installationsData.filter((i: Installation) =>
        i.status === 'installation_in_progress'
      ).length;
      const completed = installationsData.filter((i: Installation) =>
        ['installation_completed', 'active'].includes(i.status)
      ).length;
      const failed = 0; // Would track failed installations

      setStats({
        pending,
        scheduled,
        in_progress,
        completed,
        failed,
        total: installationsData.length,
      });
    } catch (error) {
      console.error('Error fetching installations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInstallations = () => {
    let filtered = [...installations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inst) =>
          inst.order_number.toLowerCase().includes(query) ||
          inst.customer_name.toLowerCase().includes(query) ||
          inst.customer_phone.includes(query) ||
          inst.installation_address.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter((i) =>
          ['kyc_approved', 'payment_method_registered'].includes(i.status)
        );
      } else if (statusFilter === 'scheduled') {
        filtered = filtered.filter((i) => i.status === 'installation_scheduled');
      } else if (statusFilter === 'in_progress') {
        filtered = filtered.filter((i) => i.status === 'installation_in_progress');
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((i) =>
          ['installation_completed', 'active'].includes(i.status)
        );
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        filtered = filtered.filter((i) => {
          if (!i.scheduled_date) return false;
          const schedDate = new Date(i.scheduled_date);
          schedDate.setHours(0, 0, 0, 0);
          return schedDate.getTime() === today.getTime();
        });
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filtered = filtered.filter((i) => {
          if (!i.scheduled_date) return false;
          const schedDate = new Date(i.scheduled_date);
          return schedDate >= today && schedDate <= weekFromNow;
        });
      } else if (dateFilter === 'overdue') {
        filtered = filtered.filter((i) => {
          if (!i.scheduled_date) return false;
          const schedDate = new Date(i.scheduled_date);
          return schedDate < today && !['installation_completed', 'active'].includes(i.status);
        });
      }
    }

    setFilteredInstallations(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      kyc_approved: {
        label: 'Pending Schedule',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      payment_method_registered: {
        label: 'Ready to Schedule',
        className: 'bg-blue-100 text-blue-800',
        icon: Calendar
      },
      installation_scheduled: {
        label: 'Scheduled',
        className: 'bg-purple-100 text-purple-800',
        icon: CalendarCheck
      },
      installation_in_progress: {
        label: 'In Progress',
        className: 'bg-orange-100 text-orange-800',
        icon: Wrench
      },
      installation_completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      active: {
        label: 'Active',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
      icon: AlertCircle
    };
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTimeSlot = (slot: string | null) => {
    if (!slot) return '';
    return ` • ${slot}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Installation Management</h1>
          <p className="text-gray-600 mt-1">
            Schedule and track fibre installations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="rounded-l-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInstallations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('scheduled')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">{stats.scheduled}</p>
              </div>
              <CalendarCheck className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.in_progress}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Only show in list view */}
      {view === 'list' && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order, customer, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Schedule</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Next 7 Days</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Installations
            <Badge variant="secondary">{filteredInstallations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
            </div>
          ) : filteredInstallations.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No installations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Installations will appear here once orders reach the installation stage'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInstallations.map((installation) => (
                    <tr key={installation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{installation.order_number}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(installation.created_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <User className="h-4 w-4 text-gray-400" />
                            {installation.customer_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Phone className="h-3 w-3" />
                            {installation.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{installation.installation_address}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{installation.package_name}</p>
                          <p className="text-xs text-gray-500">{installation.package_speed}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {formatDate(installation.scheduled_date)}
                            {formatTimeSlot(installation.scheduled_time_slot)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(installation.status)}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/admin/orders/${installation.order_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <InstallationCalendar
          installations={filteredInstallations.filter(i => i.scheduled_date !== null)}
        />
      )}

      {/* Last Refreshed */}
      <div className="text-center text-sm text-gray-500">
        Last refreshed: {format(lastRefreshed, 'HH:mm:ss')}
      </div>
    </div>
  );
}
