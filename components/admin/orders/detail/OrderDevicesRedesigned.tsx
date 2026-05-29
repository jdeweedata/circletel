'use client';

import { useState } from 'react';
import {
  PiPackageBold,
  PiSimCardBold,
  PiBroadcastBold,
  PiTruckBold,
  PiCreditCardBold,
  PiCalendarBold,
  PiCheckBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderDevicesRedesignedProps {
  order: {
    id: string;
    order_number: string;
    sim_serial?: string | null;
    router_serial?: string | null;
    router_model?: string | null;
    router_included: boolean;
    package_name: string;
    payment_method_active?: boolean;
    payment_method_mandate_status?: string;
    installation_scheduled_date?: string;
    status: string;
  };
  onUpdate?: () => void;
}

export function OrderDevicesRedesigned({
  order,
  onUpdate,
}: OrderDevicesRedesignedProps) {
  // SIM card state
  const [simSerial, setSimSerial] = useState(order.sim_serial || '');
  const [simInput, setSimInput] = useState('');
  const [simEditing, setSimEditing] = useState(!order.sim_serial);

  // Router state
  const [routerSerial, setRouterSerial] = useState(order.router_serial || '');
  const [routerInput, setRouterInput] = useState('');
  const [routerEditing, setRouterEditing] = useState(!order.router_serial);

  // Loading state
  const [savingDevice, setSavingDevice] = useState<'sim' | 'router' | null>(null);

  // Derived state
  const totalDevices = order.router_included ? 2 : 1;
  const assignedCount = (simSerial ? 1 : 0) + (order.router_included && routerSerial ? 1 : 0);

  // Check dispatch readiness
  const paymentVerified = order.payment_method_active === true;
  const devicesAssigned = assignedCount === totalDevices;
  const installationScheduled = !!order.installation_scheduled_date;
  const readyToDispatch = paymentVerified && devicesAssigned && installationScheduled;

  const handleAssignDevice = async (
    type: 'sim' | 'router',
    serial: string
  ) => {
    if (!serial.trim()) {
      toast.error(`Please enter a ${type === 'sim' ? 'SIM' : 'router'} serial number`);
      return;
    }

    setSavingDevice(type);
    try {
      const payload: Record<string, string | null> = {};
      if (type === 'sim') payload.simSerial = serial;
      if (type === 'router') payload.routerSerial = serial;

      const res = await fetch(`/api/admin/orders/${order.id}/devices`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Update local state
      if (type === 'sim') {
        setSimSerial(serial);
        setSimEditing(false);
        setSimInput('');
      } else {
        setRouterSerial(serial);
        setRouterEditing(false);
        setRouterInput('');
      }

      toast.success(
        `${type === 'sim' ? 'SIM' : 'Router'} assigned successfully`
      );
      onUpdate?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to assign device'
      );
    } finally {
      setSavingDevice(null);
    }
  };

  const handleEditDevice = (type: 'sim' | 'router') => {
    if (type === 'sim') {
      setSimInput(simSerial);
      setSimEditing(true);
    } else {
      setRouterInput(routerSerial);
      setRouterEditing(true);
    }
  };

  // Render a device row
  const renderDeviceRow = (
    type: 'sim' | 'router',
    icon: React.ReactNode,
    iconBg: string,
    title: string,
    subtitle: string,
    stockText: string,
    isAssigned: boolean,
    serial: string,
    isEditing: boolean,
    inputValue: string,
    onInputChange: (value: string) => void
  ) => (
    <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 mb-3">
      {/* Icon */}
      <div
        className={cn(
          'w-10.5 h-10.5 rounded-lg flex items-center justify-center flex-shrink-0',
          iconBg
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>

        {/* Assigned state: show serial + edit button */}
        {isAssigned && !isEditing && (
          <div className="mt-3 flex items-center gap-2">
            <div className="inline-block bg-slate-100 rounded-lg px-3 py-2 font-mono text-xs text-slate-700">
              {serial}
            </div>
            <button
              onClick={() => handleEditDevice(type)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Edit
            </button>
          </div>
        )}

        {/* Unassigned state */}
        {!isAssigned && !isEditing && stockText && (
          <div className="mt-2">
            <p className="text-xs text-slate-600 mb-0">{stockText}</p>
          </div>
        )}

        {/* Edit mode: show input + assign button */}
        {isEditing && (
          <div className="mt-3 flex items-center gap-2">
            <Input
              placeholder={`Scan or enter ${type === 'sim' ? 'ICCID' : 'serial'}`}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              className="text-xs h-8 px-3"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => handleAssignDevice(type, inputValue)}
              disabled={savingDevice === type}
              className="h-8 px-3 gap-1.5"
            >
              {savingDevice === type ? 'Saving...' : 'Assign'}
            </Button>
          </div>
        )}
      </div>

      {/* Right side: status chip */}
      <div className="flex-shrink-0 text-right">
        {isAssigned ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
            Assigned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
            Unassigned
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mt-6">
      {/* Left Column: Device Assignment */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <PiPackageBold className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">Device Assignment</h3>
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1">
                {assignedCount} of {totalDevices} assigned
              </span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="px-5 pt-3 pb-4">
          <p className="text-xs text-slate-600">
            Assign hardware serials from stock before this order can be dispatched.
          </p>
        </div>

        {/* Device Rows */}
        <div className="px-5 pb-5">
          {/* SIM Card Row */}
          {renderDeviceRow(
            'sim',
            <PiSimCardBold className="h-5 w-5 text-purple-600" />,
            'bg-purple-100',
            'SIM Card',
            `Data SIM · ${order.package_name}`,
            '',
            simSerial !== '',
            simSerial,
            simEditing,
            simInput,
            setSimInput
          )}

          {/* Router Row */}
          {order.router_included && renderDeviceRow(
            'router',
            <PiBroadcastBold className="h-5 w-5 text-blue-600" />,
            'bg-blue-100',
            'Router',
            order.router_model || 'Model not specified',
            '',
            routerSerial !== '',
            routerSerial,
            routerEditing,
            routerInput,
            setRouterInput
          )}
        </div>
      </div>

      {/* Right Column: Dispatch Readiness */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <PiTruckBold className="h-5 w-5 text-slate-600" />
          </div>
          <h3 className="font-bold text-slate-900">Dispatch Readiness</h3>
        </div>

        {/* Checklist */}
        <div className="px-5 py-4">
          {/* Item 1: Payment Method */}
          <div className="flex items-start gap-4 py-3.5 border-b border-slate-100">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                paymentVerified
                  ? 'bg-emerald-100'
                  : 'bg-amber-100'
              )}
            >
              <PiCreditCardBold
                className={cn(
                  'h-4 w-4',
                  paymentVerified ? 'text-emerald-600' : 'text-amber-600'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Payment method verified
              </p>
              <p
                className={cn(
                  'text-xs mt-1',
                  paymentVerified
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                )}
              >
                {paymentVerified
                  ? 'Debit mandate on file · billed after activation'
                  : 'Payment method not yet verified'}
              </p>
            </div>
            <div className="flex-shrink-0">
              {paymentVerified ? (
                <PiCheckBold className="h-5 w-5 text-emerald-600" />
              ) : (
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                  Verify
                </Button>
              )}
            </div>
          </div>

          {/* Item 2: Devices Assigned */}
          <div className="flex items-start gap-4 py-3.5 border-b border-slate-100">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                devicesAssigned
                  ? 'bg-emerald-100'
                  : 'bg-slate-100'
              )}
            >
              <PiPackageBold
                className={cn(
                  'h-4 w-4',
                  devicesAssigned ? 'text-emerald-600' : 'text-slate-600'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Devices assigned
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {assignedCount} of {totalDevices} assigned
              </p>
            </div>
            <div className="flex-shrink-0">
              {devicesAssigned ? (
                <PiCheckBold className="h-5 w-5 text-emerald-600" />
              ) : null}
            </div>
          </div>

          {/* Item 3: Installation Scheduled */}
          <div className="flex items-start gap-4 py-3.5">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                installationScheduled
                  ? 'bg-emerald-100'
                  : 'bg-slate-100'
              )}
            >
              <PiCalendarBold
                className={cn(
                  'h-4 w-4',
                  installationScheduled ? 'text-emerald-600' : 'text-slate-600'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Installation scheduled
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {installationScheduled
                  ? new Date(order.installation_scheduled_date!).toLocaleDateString('en-ZA')
                  : 'Not booked'}
              </p>
            </div>
            <div className="flex-shrink-0">
              {installationScheduled ? (
                <PiCheckBold className="h-5 w-5 text-emerald-600" />
              ) : (
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                  Schedule
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                'text-xs font-bold flex items-center gap-1.5',
                readyToDispatch ? 'text-emerald-700' : 'text-amber-700'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  readyToDispatch ? 'bg-emerald-600' : 'bg-amber-600'
                )}
              />
              {readyToDispatch
                ? 'Ready to dispatch'
                : 'Not ready to dispatch'}
            </span>
          </div>
          <Button
            className="w-full gap-1.5"
            disabled={!readyToDispatch}
            onClick={() => toast.info('Order marked as ready for dispatch')}
          >
            <PiCheckBold className="h-4 w-4" />
            Mark ready for dispatch
          </Button>
        </div>
      </div>
    </div>
  );
}
