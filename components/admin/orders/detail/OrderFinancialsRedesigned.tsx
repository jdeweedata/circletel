'use client';

import {
  PiCurrencyCircleDollarBold,
  PiCreditCardBold,
  PiCheckCircleBold,
  PiWarningCircleBold,
} from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OrderInvoices } from '@/components/admin/orders/OrderInvoices';

interface OrderFinancialsRedesignedProps {
  order: {
    id: string;
    customer_id: string;
    order_number: string;
    package_name: string;
    package_price: number;
    installation_fee: number;
    total_paid: number;
    payment_method?: string;
    payment_status: string;
    payment_reference?: string;
    payment_date?: string;
    payment_method_active?: boolean;
    payment_method_mandate_status?: string;
    router_rental_fee?: number;
    account_number?: string;
    activation_date?: string;
    status: string;
  };
  onRequestPaymentMethod?: () => void;
}

/**
 * Format currency to ZAR format
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date to readable format
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return 'Invalid date';
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get status badge based on payment status
 */
const getPaymentStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: 'Pending', variant: 'outline' },
    'not-started': { label: 'Billing not started', variant: 'outline' },
    active: { label: 'Active', variant: 'default' },
    failed: { label: 'Failed', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  };

  const config = statusMap[status.toLowerCase()] || statusMap['pending'];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

/**
 * Get mandate status badge
 */
const getMandateStatusBadge = (status?: string) => {
  if (!status) return <Badge variant="outline">Not signed</Badge>;

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    signed: { label: 'Signed', variant: 'default' },
    pending: { label: 'Pending', variant: 'outline' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  };

  const config = statusMap[status.toLowerCase()] || statusMap['pending'];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function OrderFinancialsRedesigned({
  order,
  onRequestPaymentMethod,
}: OrderFinancialsRedesignedProps) {
  const isOutstanding = order.package_price + (order.router_rental_fee || 0) - order.total_paid > 0;
  const outstandingAmount = Math.max(
    0,
    order.package_price + (order.router_rental_fee || 0) - order.total_paid
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
      {/* LEFT COLUMN */}
      <div className="space-y-5">
        {/* Card 1: Billing Summary */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PiCurrencyCircleDollarBold className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Billing Summary</h3>
            </div>
            {getPaymentStatusBadge(order.payment_status)}
          </div>

          {/* 3-Figure Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Monthly */}
            <div className="border border-slate-200 rounded-xl p-3.5 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Monthly
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {formatCurrency(order.package_price)}
              </p>
            </div>

            {/* Paid to Date */}
            <div className="border border-slate-200 rounded-xl p-3.5 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Paid to date
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {formatCurrency(order.total_paid)}
              </p>
            </div>

            {/* Outstanding */}
            <div
              className={cn(
                'border rounded-xl p-3.5 text-center',
                isOutstanding
                  ? 'bg-primary/5 border-primary/20'
                  : 'border-slate-200'
              )}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Outstanding
              </p>
              <p
                className={cn(
                  'text-lg font-extrabold',
                  isOutstanding ? 'text-primary' : 'text-slate-900'
                )}
              >
                {formatCurrency(outstandingAmount)}
              </p>
            </div>
          </div>

          {/* Key-Value Rows */}
          <div className="border-t border-slate-200 pt-3">
            {/* Activation/Install Fee */}
            <div className="py-3 flex justify-between items-center border-b border-slate-100">
              <span className="text-sm text-slate-600">Activation / Install Fee</span>
              <span className="text-sm font-semibold text-emerald-600">
                {order.installation_fee === 0 ? 'FREE' : formatCurrency(order.installation_fee)}
              </span>
            </div>

            {/* First Debit */}
            <div className="py-3 flex justify-between items-center border-b border-slate-100">
              <span className="text-sm text-slate-600">First debit</span>
              <span className="text-sm font-medium text-slate-900">
                {order.activation_date
                  ? formatDate(order.activation_date)
                  : 'After service activation'}
              </span>
            </div>

            {/* Billing Reference */}
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-slate-600">Billing reference</span>
              <code className="text-xs bg-slate-100 rounded-md px-2 py-1 font-mono text-slate-700">
                {order.account_number || 'Not assigned'}
              </code>
            </div>
          </div>
        </div>

        {/* Card 2: Payment Method */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PiCreditCardBold className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Payment Method</h3>
            </div>
            <Badge
              variant={
                order.payment_method_active ? 'default' : 'outline'
              }
            >
              {order.payment_method_active ? 'Active & Verified' : 'Not active'}
            </Badge>
          </div>

          {/* Payment Method Display */}
          <div className="flex items-start gap-3 mb-5 pb-5 border-b border-slate-200">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PiCreditCardBold className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">
                {order.payment_method ? 'Debit Order · Monthly' : 'Payment method not configured'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.payment_reference ? `Ref: ${order.payment_reference}` : 'No bank details on file'}
              </p>
            </div>
          </div>

          {/* Key-Value Rows */}
          <div className="space-y-3 mb-5">
            {/* Mandate Signed */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Mandate signed</span>
              {getMandateStatusBadge(order.payment_method_mandate_status)}
            </div>

            {/* Debit Day */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Debit day</span>
              <span className="text-sm font-medium text-slate-900">1st of month</span>
            </div>

            {/* Frequency */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Frequency</span>
              <span className="text-sm font-medium text-slate-900">Monthly</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onRequestPaymentMethod}
            >
              Update mandate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              Retry debit
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div>
        <OrderInvoices
          orderId={order.id}
          customerId={order.customer_id}
          packageName={order.package_name}
          packagePrice={order.package_price}
          routerFee={order.router_rental_fee}
          accountNumber={order.account_number}
        />
      </div>
    </div>
  );
}

export default OrderFinancialsRedesigned;
