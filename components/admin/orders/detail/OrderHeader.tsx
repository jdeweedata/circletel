'use client';

import { PiArrowLeftBold, PiCaretRightBold, PiPrinterBold, PiDownloadSimpleBold } from 'react-icons/pi';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusActionButtons } from '@/components/admin/orders/StatusActionButtons';
import { SendEmailDialog } from '@/components/admin/support/SendEmailDialog';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  package_name: string;
  package_price: number;
  account_number?: string;
  created_at: string;
}

interface OrderHeaderProps {
  order: Order;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  installation_completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Installation Complete' },
  installation_scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Installation Scheduled' },
  installation_in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
  payment_method_registered: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Payment Registered' },
  payment_method_pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Payment Pending' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  suspended: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Suspended' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
}

export function OrderHeader({ order, onRefresh }: OrderHeaderProps) {
  const statusConfig = getStatusConfig(order.status);
  const createdDate = new Date(order.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link
            href="/admin/orders"
            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <PiArrowLeftBold className="w-4 h-4" />
            <span>Orders</span>
          </Link>
          <PiCaretRightBold className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">Active Orders</span>
          <PiCaretRightBold className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-900">{order.order_number}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Order Details</p>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-heading">
                {order.order_number}
              </h1>
              <Badge className={cn(statusConfig.bg, statusConfig.text, "border-0 font-semibold px-3 py-1")}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Placed on {createdDate} • {order.package_name}
              {order.account_number && (
                <span className="ml-2">
                  • Account: <span className="font-mono font-semibold text-primary">{order.account_number}</span>
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons - Two Row Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <StatusActionButtons
                currentStatus={order.status}
                orderId={order.id}
                orderNumber={order.order_number}
                packagePrice={order.package_price}
                firstName={order.first_name}
                lastName={order.last_name}
                onStatusUpdate={onRefresh}
              />
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-8 w-px bg-slate-200" />

            {/* Utility Actions */}
            <div className="flex items-center gap-2">
              <SendEmailDialog
                defaultTo={order.email}
                defaultSubject={`RE: Order ${order.order_number}`}
                defaultBody={`Hi ${order.first_name},\n\nThank you for choosing CircleTel.\n\n[Your message here]\n\nKind Regards,\nCircleTel Support`}
                customerId={order.customer_id}
                orderId={order.id}
              />

              <Button variant="outline" size="sm" className="gap-2">
                <PiPrinterBold className="w-4 h-4" />
                <span className="hidden lg:inline">Print</span>
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <PiDownloadSimpleBold className="w-4 h-4" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
