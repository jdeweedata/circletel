'use client';

import {
  PiCaretRightBold,
  PiPauseBold,
  PiXCircleBold,
  PiEnvelopeBold,
  PiPrinterBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

export function OrderHeader({ order }: OrderHeaderProps) {
  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/orders" className="hover:text-primary">Orders</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/orders" className="hover:text-primary">Active Orders</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{order.order_number}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {order.order_number}
            </h2>
            <Badge className={cn(statusConfig.bg, statusConfig.text, 'border-0')}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grouped icon buttons */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Suspend Order"
                aria-label="Suspend Order"
                onClick={() => {
                  // TODO: Implement suspend functionality
                  console.log('Suspend order:', order.id);
                }}
              >
                <PiPauseBold className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                title="Cancel Order"
                aria-label="Cancel Order"
                onClick={() => {
                  // TODO: Implement cancel functionality
                  console.log('Cancel order:', order.id);
                }}
              >
                <PiXCircleBold className="w-5 h-5" />
              </button>
              <SendEmailDialog
                defaultTo={order.email}
                defaultSubject={`RE: Order ${order.order_number}`}
                defaultBody={`Hi ${order.first_name},\n\nThank you for choosing CircleTel.\n\n[Your message here]\n\nKind Regards,\nCircleTel Support`}
                customerId={order.customer_id}
                orderId={order.id}
                trigger={
                  <button
                    type="button"
                    className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                    title="Send Email"
                    aria-label="Send Email"
                  >
                    <PiEnvelopeBold className="w-5 h-5" />
                  </button>
                }
              />
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                title="Print Details"
                aria-label="Print Details"
                onClick={() => window.print()}
              >
                <PiPrinterBold className="w-5 h-5" />
              </button>
            </div>

            {/* Export button */}
            <Button
              type="button"
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export order:', order.id);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <PiDownloadSimpleBold className="w-5 h-5" />
              Export Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
