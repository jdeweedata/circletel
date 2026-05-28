'use client';

import { useState } from 'react';
import {
  PiWrenchBold,
  PiCalendarBold,
  PiPlusBold,
  PiMapPinBold,
  PiUserBold,
  PiPhoneBold,
  PiArrowSquareOutBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/shared';

interface OrderInstallationRedesignedProps {
  order: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    installation_address: string;
    suburb?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    special_instructions?: string;
    installation_scheduled_date?: string;
    installation_time_slot?: string;
    installation_completed_date?: string;
    status: string;
  };
  onNavigateToTab?: (tab: string) => void;
}

type SchedulingState = 'empty' | 'form' | 'summary';

interface FormValues {
  date: string;
  timeWindow: string;
  technician: string;
  notes: string;
}

const TECHNICIAN_OPTIONS = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'thabo', label: 'Thabo Molefe' },
  { value: 'sipho', label: 'Sipho Dlamini' },
  { value: 'team_b', label: 'Field Team B' },
];

const TIME_WINDOWS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getTechnicianName(value: string): string {
  const option = TECHNICIAN_OPTIONS.find(o => o.value === value);
  return option ? option.label : 'Unknown';
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatAddress(order: OrderInstallationRedesignedProps['order']): string {
  const parts = [
    order.installation_address,
    order.suburb,
    order.city,
    order.province,
    order.postal_code,
  ].filter(Boolean);
  return parts.join(', ');
}

function getDirectionsUrl(order: OrderInstallationRedesignedProps['order']): string {
  const address = formatAddress(order);
  return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
}

export function OrderInstallationRedesigned({ order, onNavigateToTab }: OrderInstallationRedesignedProps) {
  const hasScheduledDate = !!order.installation_scheduled_date;
  const [state, setState] = useState<SchedulingState>(hasScheduledDate ? 'summary' : 'empty');

  const [formValues, setFormValues] = useState<FormValues>({
    date: order.installation_scheduled_date || '',
    timeWindow: order.installation_time_slot || TIME_WINDOWS[0],
    technician: 'unassigned',
    notes: order.special_instructions || '',
  });

  const handleScheduleClick = () => {
    setState('form');
  };

  const handleConfirmBooking = () => {
    setState('summary');
  };

  const handleCancel = () => {
    setState('empty');
  };

  const handleReschedule = () => {
    setState('form');
  };

  const handleFormChange = (field: keyof FormValues, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
      {/* Left Column: Installation Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center">
              <PiWrenchBold className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Installation</h3>
          </div>
          <StatusBadge
            status={state === 'summary' ? 'Scheduled' : 'Not scheduled'}
            variant={state === 'summary' ? 'success' : 'warning'}
          />
        </div>

        {/* State 1: Empty */}
        {state === 'empty' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-[54px] bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <PiCalendarBold className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm mb-6">No installation booked for this order yet.</p>
            <button
              onClick={handleScheduleClick}
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PiPlusBold className="h-4 w-4" />
              Schedule installation
            </button>
          </div>
        )}

        {/* State 2: Form */}
        {state === 'form' && (
          <div className="space-y-5">
            {/* Date & Time Window Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formValues.date}
                  onChange={e => handleFormChange('date', e.target.value)}
                  className={cn(
                    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none',
                    'focus:border-primary transition-colors',
                    'bg-white text-slate-900'
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Time Window
                </label>
                <select
                  value={formValues.timeWindow}
                  onChange={e => handleFormChange('timeWindow', e.target.value)}
                  className={cn(
                    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none',
                    'focus:border-primary transition-colors',
                    'bg-white text-slate-900'
                  )}
                >
                  {TIME_WINDOWS.map(window => (
                    <option key={window} value={window}>
                      {window}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Technician */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Technician
              </label>
              <select
                value={formValues.technician}
                onChange={e => handleFormChange('technician', e.target.value)}
                className={cn(
                  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none',
                  'focus:border-primary transition-colors',
                  'bg-white text-slate-900'
                )}
              >
                {TECHNICIAN_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                value={formValues.notes}
                onChange={e => handleFormChange('notes', e.target.value)}
                placeholder="Gate code, parking, on-site contact…"
                className={cn(
                  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none',
                  'focus:border-primary transition-colors',
                  'bg-white text-slate-900 resize-none',
                  'placeholder:text-slate-400'
                )}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setState('empty')}
                className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Confirm booking
              </button>
            </div>
          </div>
        )}

        {/* State 3: Summary */}
        {state === 'summary' && (
          <div className="space-y-6">
            {/* Date Card */}
            <div className="flex items-start gap-4">
              <div className="size-12 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                <PiCalendarBold className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg">
                  {formatDate(formValues.date)}
                </p>
                <p className="text-sm text-slate-600 mt-1">{formValues.timeWindow}</p>
              </div>
              <StatusBadge status="Scheduled" variant="success" />
            </div>

            {/* Technician Row */}
            <div className="flex items-center justify-between py-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                  {getTechnicianName(formValues.technician).charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Technician</p>
                  <p className="text-sm font-semibold text-slate-900">{getTechnicianName(formValues.technician)}</p>
                </div>
              </div>
              <button
                onClick={handleReschedule}
                className="text-sm text-primary hover:underline font-medium"
              >
                Reschedule
              </button>
            </div>

            {/* Work Order Row */}
            <div className="flex items-center gap-3 py-4 border-t border-slate-100">
              <div className="size-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-xs">
                WO
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Work order</p>
                <p className="text-sm font-semibold text-slate-900 font-mono">WO-{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Progress</p>
              <div className="flex gap-2">
                {['Scheduled', 'En route', 'On site', 'Complete'].map((label, idx) => (
                  <div key={label} className="flex-1 flex flex-col items-center">
                    <div
                      className={cn(
                        'h-[5px] w-full rounded-full mb-2',
                        idx <= 0 ? 'bg-primary' : 'bg-slate-200'
                      )}
                    />
                    <p className="text-xs text-slate-600 text-center leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Installation */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Cancel installation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Two Cards */}
      <div className="space-y-5">
        {/* Card 1: Installation Address */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center">
              <PiMapPinBold className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Installation Address</h3>
          </div>

          {/* Map Placeholder */}
          <div className="h-[150px] bg-slate-100 rounded-xl flex items-center justify-center mb-4">
            <PiMapPinBold className="h-7 w-7 text-slate-400" />
          </div>

          {/* Address Text */}
          <p className="font-medium text-slate-900 text-sm mb-1">{order.installation_address}</p>
          {order.suburb && (
            <p className="text-sm text-slate-600">{order.suburb}</p>
          )}
          <p className="text-sm text-slate-600">
            {[order.city, order.province, order.postal_code].filter(Boolean).join(', ')}
          </p>

          {/* Get Directions */}
          <a
            href={getDirectionsUrl(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mt-4 transition-colors"
          >
            Get directions
            <PiArrowSquareOutBold className="h-3.5 w-3.5" />
          </a>

          {/* Access Notes */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Site access notes
            </label>
            <input
              type="text"
              defaultValue={order.special_instructions || ''}
              placeholder="Gate code, parking, on-site contact…"
              className={cn(
                'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none',
                'focus:border-primary transition-colors',
                'bg-white text-slate-900 placeholder:text-slate-400'
              )}
            />
          </div>
        </div>

        {/* Card 2: Site Contact */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
            <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center">
              <PiUserBold className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Site Contact</h3>
          </div>

          {/* Contact Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <PiPhoneBold className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {order.first_name} {order.last_name}
                </p>
                <p className="text-xs text-slate-500">on-site</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.phone}`}
                className="text-sm font-medium text-slate-900 hover:text-slate-700"
              >
                {order.phone}
              </a>
              <PiArrowSquareOutBold className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
