'use client';

import { useState } from 'react';
import {
  PiUserBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiChatTextBold,
  PiPackageBold,
  PiFireBold,
  PiCheckCircleBold,
  PiArrowSquareOutBold,
  PiCalendarBold,
} from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OrderOverviewRedesignedProps {
  order: {
    id: string;
    order_number: string;
    customer_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    installation_address: string;
    suburb?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    account_number?: string;
    package_name: string;
    package_speed: string;
    package_price: number;
    installation_fee: number;
    router_included: boolean;
    router_rental_fee?: number;
    contract_term?: number;
    status: string;
    contact_preference: string;
    marketing_opt_in: boolean;
    whatsapp_opt_in: boolean;
    installation_scheduled_date?: string;
    created_at: string;
  };
  onNavigateToTab?: (tab: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'completed' || lowerStatus === 'active') return 'success';
  if (lowerStatus === 'pending' || lowerStatus === 'processing') return 'info';
  if (lowerStatus === 'cancelled') return 'error';
  return 'neutral';
}

const iconCircleStyles = 'w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600';
const contactRowStyles =
  'border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer';

export function OrderOverviewRedesigned({ order, onNavigateToTab }: OrderOverviewRedesignedProps) {
  const [noteValue, setNoteValue] = useState('');
  const isCancelled = order.status.toLowerCase() === 'cancelled';

  // Format address string
  const fullAddress = [order.city, order.province, order.postal_code].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mt-6">
      {/* Left Column */}
      <div className="space-y-5">
        {/* Card 1: Customer */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={iconCircleStyles}>
                <PiUserBold className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900" style={{ fontSize: '15px' }}>
                Customer
              </h3>
            </div>
            <button className="text-primary hover:text-primary/80 transition-colors">
              <PiArrowSquareOutBold className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Avatar + Name + Account Number */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F5853B] to-[#D2540F] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                {getInitials(order.first_name, order.last_name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-slate-900">
                  {order.first_name} {order.last_name}
                </p>
                {order.account_number && (
                  <p className="text-[12.5px] font-mono text-slate-500">{order.account_number}</p>
                )}
              </div>
              {!isCancelled && <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-0">
                Active
              </Badge>}
            </div>

            {/* Email Row */}
            <div className={contactRowStyles}>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <PiEnvelopeBold className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-sm font-bold text-slate-900 truncate">{order.email}</p>
              </div>
              <PiArrowSquareOutBold className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>

            {/* Phone Row */}
            <div className={contactRowStyles}>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <PiPhoneBold className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="text-sm font-bold text-slate-900">{order.phone}</p>
              </div>
              <PiArrowSquareOutBold className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>

            {/* Preferences Footer */}
            <div className="pt-2 text-xs text-slate-500">
              <p>
                Preferred contact: <span className="font-medium text-slate-700 capitalize">{order.contact_preference}</span>
              </p>
              <p>
                {order.marketing_opt_in ? (
                  <span>Marketing consent on file</span>
                ) : (
                  <span>No marketing consent on file</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Package & Billing */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <div className={iconCircleStyles}>
              <PiPackageBold className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900" style={{ fontSize: '15px' }}>
              Package & Billing
            </h3>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Package Banner */}
            <div className="border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/2 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-slate-900">{order.package_name}</p>
                <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-5 gap-0.5">
                  <PiFireBold className="w-3 h-3" />
                  HOT
                </Badge>
              </div>

              {/* 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Speed</p>
                  <p className="font-bold text-slate-900">{order.package_speed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Monthly (VAT incl)</p>
                  <p className="font-bold text-slate-900">{formatCurrency(order.package_price)}</p>
                </div>
              </div>
            </div>

            {/* Key-Value Rows */}
            <div className="space-y-0">
              {/* Router */}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Router</span>
                <span className="text-sm font-bold text-slate-900">
                  {order.router_included ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <PiCheckCircleBold className="w-4 h-4" />
                      Included
                    </span>
                  ) : order.router_rental_fee && order.router_rental_fee > 0 ? (
                    `Rental ${formatCurrency(order.router_rental_fee)}/mo`
                  ) : (
                    'Customer provides'
                  )}
                </span>
              </div>

              {/* Contract Term */}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Contract term</span>
                <span className="text-sm font-bold text-slate-900">
                  {order.contract_term ? `${order.contract_term} months` : 'Month-to-month'}
                </span>
              </div>

              {/* Installation Fee */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-slate-600">Installation fee</span>
                <span className={cn('text-sm font-bold', {
                  'text-emerald-600': order.installation_fee === 0,
                  'text-slate-900': order.installation_fee !== 0,
                })}>
                  {order.installation_fee === 0 ? 'FREE' : formatCurrency(order.installation_fee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-5">
        {/* Card 3: Installation Address */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <div className={iconCircleStyles}>
              <PiMapPinBold className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900" style={{ fontSize: '15px' }}>
              Installation Address
            </h3>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Mini Map Placeholder */}
            <div className="bg-slate-100 rounded-lg h-[150px] flex items-center justify-center relative overflow-hidden border border-slate-200">
              <div className="text-slate-400">
                <PiMapPinBold className="w-8 h-8 mx-auto" />
              </div>
            </div>

            {/* Address Text */}
            <div>
              <p className="font-bold text-slate-900 text-sm">{order.installation_address}</p>
              {order.suburb && <p className="text-xs text-slate-600 mt-1">{order.suburb}</p>}
              {fullAddress && <p className="text-xs text-slate-600 mt-0.5">{fullAddress}</p>}
            </div>

            {/* Installation Status Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={cn('text-sm font-medium', {
                'text-amber-600': !order.installation_scheduled_date,
                'text-slate-900': order.installation_scheduled_date,
              })}>
                {order.installation_scheduled_date
                  ? `Scheduled: ${formatDate(order.installation_scheduled_date)}`
                  : 'Not scheduled'}
              </span>
              <Button variant="outline" size="sm" className="text-xs">
                Schedule
              </Button>
            </div>
          </div>
        </div>

        {/* Card 4: Activity & Notes */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <div className={iconCircleStyles}>
              <PiChatTextBold className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900" style={{ fontSize: '15px' }}>
              Activity & Notes
            </h3>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col gap-4">
            {/* Activity List */}
            <div className="flex-1">
              <ul className="space-y-3">
                {/* Order Created Event */}
                <li className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {getInitials(order.first_name, order.last_name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      Order <span className="font-bold">#{order.order_number}</span> created
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Note Input */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!noteValue.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
