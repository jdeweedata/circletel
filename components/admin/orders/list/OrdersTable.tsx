'use client';

import Link from 'next/link';
import {
  PiArrowDownBold,
  PiArrowUpBold,
  PiArrowsDownUpBold,
  PiCalendarCheckBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCreditCardBold,
  PiDotsThreeVerticalBold,
  PiEyeBold,
  PiLightningBold,
  PiPackageBold,
  PiPencilSimpleBold,
  PiWarningCircleBold,
  PiWrenchBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatusBadge, getStatusVariant } from '@/components/admin/shared/StatusBadge';
import { PiTableBold } from 'react-icons/pi';

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

type SortField = 'order_number' | 'customer' | 'package_price' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface OrdersTableProps {
  orders: Order[];
  paginatedOrders: Order[];
  selectedOrders: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onSort: (field: SortField) => void;
  onSelectAll: () => void;
  onSelectOrder: (orderId: string) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  onOpenStatusModal: (order: Order) => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', icon: PiClockBold },
  payment_method_pending: { label: 'Payment Pending', icon: PiCreditCardBold },
  payment_method_registered: { label: 'Payment Ready', icon: PiCheckCircleBold },
  installation_scheduled: { label: 'Scheduled', icon: PiCalendarCheckBold },
  installation_in_progress: { label: 'Installing', icon: PiWrenchBold },
  installation_completed: { label: 'Install Done', icon: PiCheckCircleBold },
  active: { label: 'Active', icon: PiLightningBold },
  cancelled: { label: 'Cancelled', icon: PiXCircleBold },
  completed: { label: 'Completed', icon: PiPackageBold },
};

export function OrdersTable({
  orders,
  paginatedOrders,
  selectedOrders,
  sortField,
  sortDirection,
  currentPage,
  itemsPerPage,
  totalPages,
  startIndex,
  endIndex,
  onSort,
  onSelectAll,
  onSelectOrder,
  onPageChange,
  onItemsPerPageChange,
  onOpenStatusModal,
}: OrdersTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <PiArrowsDownUpBold className="h-3 w-3 ml-1 inline opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <PiArrowUpBold className="h-3 w-3 ml-1 inline text-circleTel-orange" />
    ) : (
      <PiArrowDownBold className="h-3 w-3 ml-1 inline text-circleTel-orange" />
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <StatusBadge
        status={config.label}
        variant={getStatusVariant(status)}
        icon={<Icon className="h-3 w-3" />}
      />
    );
  };

  const getPaymentBadge = (status: string) => {
    return (
      <StatusBadge
        status={status.charAt(0).toUpperCase() + status.slice(1)}
        variant={getStatusVariant(status)}
      />
    );
  };

  if (orders.length === 0) {
    return (
      <SectionCard title="Orders" icon={PiTableBold}>
        <div className="text-center py-12">
          <PiWarningCircleBold className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-900">No orders found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your filters or search terms
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Orders"
      icon={PiTableBold}
      action={
        <span className="text-xs text-slate-500">
          Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length}
        </span>
      }
    >
      <div className="-mx-6 -mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={
                      selectedOrders.size === paginatedOrders.length &&
                      paginatedOrders.length > 0
                    }
                    onCheckedChange={onSelectAll}
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort('order_number')}
                >
                  Order {getSortIcon('order_number')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort('customer')}
                >
                  Customer {getSortIcon('customer')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Package
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort('package_price')}
                >
                  Amount {getSortIcon('package_price')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Payment
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => onSort('created_at')}
                >
                  Date {getSortIcon('created_at')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => onSelectOrder(order.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-900">{order.order_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">
                      {order.first_name} {order.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{order.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-700">{order.package_name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-900">
                      R{parseFloat(order.package_price as unknown as string).toFixed(2)}/mo
                    </span>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-4">{getPaymentBadge(order.payment_status)}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <PiEyeBold className="h-3 w-3" />
                          View
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <PiDotsThreeVerticalBold className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <PiEyeBold className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenStatusModal(order)}>
                            <PiPencilSimpleBold className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onOpenStatusModal(order)}>
                              <PiCreditCardBold className="h-4 w-4 mr-2" />
                              Request Payment Method
                            </DropdownMenuItem>
                          )}
                          {order.status === 'payment_method_registered' && (
                            <DropdownMenuItem onClick={() => onOpenStatusModal(order)}>
                              <PiCalendarCheckBold className="h-4 w-4 mr-2" />
                              Schedule Installation
                            </DropdownMenuItem>
                          )}
                          {order.status === 'installation_completed' && (
                            <DropdownMenuItem onClick={() => onOpenStatusModal(order)}>
                              <PiLightningBold className="h-4 w-4 mr-2" />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
              >
                <SelectTrigger className="w-16 h-8 text-xs">
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
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <PiCaretLeftBold className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
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
                        onClick={() => onPageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <PiCaretRightBold className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
