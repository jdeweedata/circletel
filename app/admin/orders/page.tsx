'use client';

import { useState, useEffect } from 'react';
import { PiCheckSquareBold, PiTrashBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusUpdateModal } from '@/components/admin/orders/StatusUpdateModal';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import {
  OrdersListHeader,
  OrdersListStatCards,
  OrdersFilters,
  OrdersTable,
  QuickActionsPanel,
} from '@/components/admin/orders/list';
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

const TAB_CONFIG = [
  { id: 'all-orders', label: 'All Orders' },
  { id: 'quick-actions', label: 'Quick Actions' },
] as const;

export default function AdminOrdersPage() {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    active: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('all-orders');
  const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'pending' | 'active' | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    open: boolean;
    order: Order | null;
  }>({ open: false, order: null });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, sortField, sortDirection]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersData = (result.data || []) as Order[];
      setOrders(ordersData);
      setLastRefreshed(new Date());

      const total = ordersData.length;
      const pending = ordersData.filter((o) => o.status === 'pending').length;
      const active = ordersData.filter((o) => o.status === 'active').length;
      const cancelled = ordersData.filter((o) => o.status === 'cancelled').length;
      const totalRevenue = ordersData
        .filter((o) => o.status === 'active')
        .reduce((sum, o) => sum + (parseFloat(o.package_price as unknown as string) || 0), 0);

      setStats({ total, pending, active, cancelled, totalRevenue });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.first_name.toLowerCase().includes(query) ||
          order.last_name.toLowerCase().includes(query) ||
          order.email.toLowerCase().includes(query) ||
          order.phone.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.payment_status === paymentStatusFilter);
    }

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
          aValue = parseFloat(a.package_price as unknown as string) || 0;
          bValue = parseFloat(b.package_price as unknown as string) || 0;
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
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map((o) => o.id)));
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
    console.log('Delete orders:', Array.from(selectedOrders));
    setSelectedOrders(new Set());
  };

  const handleExport = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Email', 'Package', 'Price', 'Status', 'Payment', 'Date'].join(','),
      ...filteredOrders.map((order) =>
        [
          order.order_number,
          `"${order.first_name} ${order.last_name}"`,
          order.email,
          `"${order.package_name}"`,
          order.package_price,
          order.status,
          order.payment_status,
          new Date(order.created_at).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleStatCardClick = (filterType: 'all' | 'pending' | 'active') => {
    setActiveStatFilter(filterType);
    if (filterType === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter(filterType);
    }
    setSearchQuery('');
    setPaymentStatusFilter('all');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setActiveStatFilter(null);
  };

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'all' || paymentStatusFilter !== 'all';

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse mb-2" />
            <div className="h-9 bg-slate-200 rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrdersListHeader
        lastRefreshed={lastRefreshed}
        onRefresh={fetchOrders}
        onExport={handleExport}
        isLoading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        <OrdersListStatCards
          stats={stats}
          activeFilter={activeStatFilter}
          onFilterChange={handleStatCardClick}
        />

        <UnderlineTabs tabs={TAB_CONFIG} activeTab={activeTab} onTabChange={setActiveTab} />

        <TabPanel id="all-orders" activeTab={activeTab} className="space-y-4">
          <OrdersFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            paymentStatusFilter={paymentStatusFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {selectedOrders.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PiCheckSquareBold className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrders(new Set())}>
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <PiTrashBold className="h-4 w-4" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <OrdersTable
            orders={filteredOrders}
            paginatedOrders={paginatedOrders}
            selectedOrders={selectedOrders}
            sortField={sortField}
            sortDirection={sortDirection}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            onSort={handleSort}
            onSelectAll={toggleSelectAll}
            onSelectOrder={toggleSelectOrder}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            onOpenStatusModal={(order) => setStatusUpdateModal({ open: true, order })}
          />
        </TabPanel>

        <TabPanel id="quick-actions" activeTab={activeTab}>
          <QuickActionsPanel
            orders={orders}
            onOpenStatusModal={(order) => setStatusUpdateModal({ open: true, order })}
          />
        </TabPanel>
      </div>

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
