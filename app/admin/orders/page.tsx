'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Search,
  Eye,
  RefreshCw,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckSquare,
  CreditCard,
  CalendarCheck,
  Tool,
  Zap,
  MoreVertical,
  Edit,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusUpdateModal } from '@/components/admin/orders/StatusUpdateModal';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Order {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  package_name: string;
  package_price: number;
  total_paid: number;
  status: string;
  payment_status: string;
  installation_address: string;
  created_at: string;
  activation_date: string | null;
}

interface OrderStats {
  total: number;
  pending: number;
  active: number;
  cancelled: number;
  totalRevenue: number;
}

type SortField = 'order_number' | 'customer' | 'package_price' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AdminOrdersPageEnhanced() {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    active: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    open: boolean;
    order: Order | null;
  }>({ open: false, order: null });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, quickFilter, sortField, sortDirection]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Use API endpoint to bypass RLS
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersData = (result.data || []) as Order[];
      setOrders(ordersData);
      setLastRefreshed(new Date());

      // Calculate stats
      const total = ordersData.length;
      const pending = ordersData.filter(o => o.status === 'pending').length;
      const active = ordersData.filter(o => o.status === 'active').length;
      const cancelled = ordersData.filter(o => o.status === 'cancelled').length;
      const totalRevenue = ordersData
        .filter(o => o.status === 'active')
        .reduce((sum, o) => sum + (parseFloat(o.package_price as any) || 0), 0);

      setStats({ total, pending, active, cancelled, totalRevenue });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.order_number.toLowerCase().includes(query) ||
          order.first_name.toLowerCase().includes(query) ||
          order.last_name.toLowerCase().includes(query) ||
          order.email.toLowerCase().includes(query) ||
          order.phone.includes(query)
      );
    }

    // Quick filter (takes precedence)
    if (quickFilter) {
      switch (quickFilter) {
        case 'needs_payment':
          filtered = filtered.filter(order =>
            order.status === 'pending' || order.status === 'payment_method_pending'
          );
          break;
        case 'ready_to_schedule':
          filtered = filtered.filter(order => order.status === 'payment_method_registered');
          break;
        case 'installation_today':
          // This would need installation_scheduled_date in the Order interface
          // For now, filter by installation_scheduled status
          filtered = filtered.filter(order => order.status === 'installation_scheduled');
          break;
        case 'in_progress':
          filtered = filtered.filter(order => order.status === 'installation_in_progress');
          break;
      }
    } else {
      // Status filter (only if no quick filter)
      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      // Payment status filter
      if (paymentStatusFilter !== 'all') {
        filtered = filtered.filter(order => order.payment_status === paymentStatusFilter);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'customer':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'order_number':
          aValue = a.order_number;
          bValue = b.order_number;
          break;
        case 'package_price':
          aValue = parseFloat(a.package_price as any) || 0;
          bValue = parseFloat(b.package_price as any) || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 inline text-circleTel-orange" />
      : <ArrowDown className="h-3 w-3 ml-1 inline text-circleTel-orange" />;
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkDelete = () => {
    // Implement bulk delete logic
    console.log('Delete orders:', Array.from(selectedOrders));
    setSelectedOrders(new Set());
  };

  const handleExport = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Email', 'Package', 'Price', 'Status', 'Payment', 'Date'].join(','),
      ...filteredOrders.map(order => [
        order.order_number,
        `${order.first_name} ${order.last_name}`,
        order.email,
        order.package_name,
        order.package_price,
        order.status,
        order.payment_status,
        new Date(order.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      payment_method_pending: { label: 'Payment Pending', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: CreditCard },
      payment_method_registered: { label: 'Payment Ready', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      installation_scheduled: { label: 'Installation Scheduled', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: CalendarCheck },
      installation_in_progress: { label: 'Installing', className: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Tool },
      installation_completed: { label: 'Installation Done', className: 'bg-teal-100 text-teal-800 border-teal-200', icon: CheckCircle },
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200', icon: Zap },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Package }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' },
      partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border-red-200' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    const config = paymentConfig[status] || paymentConfig.pending;

    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const handleStatCardClick = (filterType: 'all' | 'pending' | 'active') => {
    if (filterType === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter(filterType);
    }
    setSearchQuery('');
    setPaymentStatusFilter('all');
    setQuickFilter(null);
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(quickFilter === filter ? null : filter);
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setSearchQuery('');
  };

  const getQuickFilterCounts = () => {
    return {
      needsPayment: orders.filter(o =>
        o.status === 'pending' || o.status === 'payment_method_pending'
      ).length,
      readyToSchedule: orders.filter(o => o.status === 'payment_method_registered').length,
      installationToday: orders.filter(o => o.status === 'installation_scheduled').length,
      inProgress: orders.filter(o => o.status === 'installation_in_progress').length,
    };
  };

  const quickFilterCounts = getQuickFilterCounts();

  const handleQuickAction = (order: Order, action: string) => {
    // Open status update modal with appropriate defaults
    setStatusUpdateModal({ open: true, order });
  };

  const statsCards = [
    {
      title: 'Total Orders',
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => handleStatCardClick('all')
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => handleStatCardClick('pending')
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => handleStatCardClick('active')
    },
    {
      title: 'Total Revenue',
      value: `R${stats.totalRevenue.toLocaleString()}`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => setStatusFilter('active')
    }
  ];

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Loading orders...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 mr-2">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 duration-200"
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Action Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Quick Filters - Orders Requiring Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={quickFilter === 'needs_payment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('needs_payment')}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Needs Payment Method
              {quickFilterCounts.needsPayment > 0 && (
                <Badge className="ml-1 bg-orange-100 text-orange-800 border-orange-200">
                  {quickFilterCounts.needsPayment}
                </Badge>
              )}
            </Button>

            <Button
              variant={quickFilter === 'ready_to_schedule' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('ready_to_schedule')}
              className="flex items-center gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              Ready to Schedule
              {quickFilterCounts.readyToSchedule > 0 && (
                <Badge className="ml-1 bg-blue-100 text-blue-800 border-blue-200">
                  {quickFilterCounts.readyToSchedule}
                </Badge>
              )}
            </Button>

            <Button
              variant={quickFilter === 'installation_today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('installation_today')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Installation Scheduled
              {quickFilterCounts.installationToday > 0 && (
                <Badge className="ml-1 bg-purple-100 text-purple-800 border-purple-200">
                  {quickFilterCounts.installationToday}
                </Badge>
              )}
            </Button>

            <Button
              variant={quickFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('in_progress')}
              className="flex items-center gap-2"
            >
              <Tool className="h-4 w-4" />
              In Progress
              {quickFilterCounts.inProgress > 0 && (
                <Badge className="ml-1 bg-green-100 text-green-800 border-green-200">
                  {quickFilterCounts.inProgress}
                </Badge>
              )}
            </Button>

            {quickFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickFilter(null)}
                className="text-gray-600"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number, name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="payment_method_pending">Payment Method Pending</SelectItem>
                <SelectItem value="payment_method_registered">Payment Method Registered</SelectItem>
                <SelectItem value="installation_scheduled">Installation Scheduled</SelectItem>
                <SelectItem value="installation_in_progress">Installation In Progress</SelectItem>
                <SelectItem value="installation_completed">Installation Completed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            {(searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all' || quickFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPaymentStatusFilter('all');
                  setQuickFilter(null);
                }}
                className="text-sm text-circleTel-orange hover:text-circleTel-orange/90"
              >
                Clear All Filters
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No orders found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all' || quickFilter
                  ? 'Try adjusting your filters or search terms'
                  : 'No orders have been placed yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('order_number')}
                      >
                        Order {getSortIcon('order_number')}
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('customer')}
                      >
                        Customer {getSortIcon('customer')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Package
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('package_price')}
                      >
                        Amount {getSortIcon('package_price')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('created_at')}
                      >
                        Date {getSortIcon('created_at')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900 text-base">{order.order_number}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {order.first_name} {order.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{order.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{order.package_name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">
                            R{parseFloat(order.package_price as any).toFixed(2)}/mo
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-4 py-4">
                          {getPaymentBadge(order.payment_status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </Link>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleQuickAction(order, 'view')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickAction(order, 'status')}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {order.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => handleQuickAction(order, 'payment')}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Request Payment Method
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'payment_method_registered' && (
                                  <DropdownMenuItem onClick={() => handleQuickAction(order, 'schedule')}>
                                    <CalendarCheck className="h-4 w-4 mr-2" />
                                    Schedule Installation
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'installation_completed' && (
                                  <DropdownMenuItem onClick={() => handleQuickAction(order, 'activate')}>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Activate Service
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      {statusUpdateModal.order && (
        <StatusUpdateModal
          open={statusUpdateModal.open}
          onClose={() => setStatusUpdateModal({ open: false, order: null })}
          order={statusUpdateModal.order}
          onSuccess={() => {
            fetchOrders();
            setStatusUpdateModal({ open: false, order: null });
          }}
        />
      )}
    </div>
  );
}
