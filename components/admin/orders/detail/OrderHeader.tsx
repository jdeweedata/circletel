'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PiCaretRightBold,
  PiPhoneBold,
  PiEnvelopeBold,
  PiCalendarBold,
  PiDotsThreeVerticalBold,
  PiPauseBold,
  PiPrinterBold,
  PiXCircleBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/shared';
import { SendEmailDialog } from '@/components/admin/support/SendEmailDialog';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  package_name: string;
  package_price: number;
  account_number?: string;
  created_at: string;
}

interface OrderHeaderProps {
  order: Order;
  onNavigateToTab?: (tab: string) => void;
}

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  active: { className: 'bg-emerald-50 text-emerald-700', label: 'Active' },
  completed: { className: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
  installation_completed: { className: 'bg-emerald-50 text-emerald-700', label: 'Installation Complete' },
  installation_scheduled: { className: 'bg-blue-50 text-blue-700', label: 'Installation Scheduled' },
  installation_in_progress: { className: 'bg-blue-50 text-blue-700', label: 'In Progress' },
  payment_method_registered: { className: 'bg-cyan-50 text-cyan-700', label: 'Payment Registered' },
  payment_method_pending: { className: 'bg-amber-50 text-amber-700', label: 'Payment Pending' },
  pending: { className: 'bg-amber-50 text-amber-700', label: 'Pending' },
  cancelled: { className: 'bg-red-50 text-red-700', label: 'Cancelled' },
  failed: { className: 'bg-red-50 text-red-700', label: 'Failed' },
  suspended: { className: 'bg-slate-100 text-slate-600', label: 'Suspended' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    className: 'bg-slate-100 text-slate-600',
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
}

export function OrderHeader({ order, onNavigateToTab }: OrderHeaderProps) {
  const statusConfig = getStatusConfig(order.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">
              {order.order_number}
            </h2>
            <StatusBadge status={statusConfig.label} className={statusConfig.className} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Call button */}
            <button
              type="button"
              onClick={() => window.open(`tel:${order.phone}`, '_self')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-[10px] hover:bg-slate-50 transition-colors"
            >
              <PiPhoneBold className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </button>

            {/* Email button */}
            <SendEmailDialog
              defaultTo={order.email}
              defaultSubject={`RE: Order ${order.order_number}`}
              defaultBody={`Hi ${order.first_name},\n\nThank you for choosing CircleTel.\n\n[Your message here]\n\nKind Regards,\nCircleTel Support`}
              customerId={order.customer_id}
              orderId={order.id}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-[10px] hover:bg-slate-50 transition-colors"
                >
                  <PiEnvelopeBold className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </button>
              }
            />

            {/* Schedule Installation — primary CTA */}
            <button
              type="button"
              onClick={() => onNavigateToTab?.('installation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-[10px] transition-colors shadow-lg shadow-primary/20"
            >
              <PiCalendarBold className="w-4 h-4" />
              Schedule Installation
            </button>

            {/* Overflow menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="inline-flex items-center justify-center w-10 h-10 text-slate-600 bg-white border border-slate-200 rounded-[10px] hover:bg-slate-50 transition-colors"
                aria-label="More actions"
              >
                <PiDotsThreeVerticalBold className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10 py-1.5 min-w-[182px] z-30">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); console.log('Hold order:', order.id); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg mx-1.5 transition-colors"
                    style={{ width: 'calc(100% - 12px)' }}
                  >
                    <PiPauseBold className="w-4 h-4" />
                    Place on hold
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); window.print(); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg mx-1.5 transition-colors"
                    style={{ width: 'calc(100% - 12px)' }}
                  >
                    <PiPrinterBold className="w-4 h-4" />
                    Print order
                  </button>
                  <div className="h-px bg-slate-200 my-1.5 mx-3" />
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); console.log('Cancel order:', order.id); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg mx-1.5 transition-colors"
                    style={{ width: 'calc(100% - 12px)' }}
                  >
                    <PiXCircleBold className="w-4 h-4" />
                    Cancel order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
