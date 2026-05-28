'use client';

import { useState } from 'react';
import {
  PiSimCardBold, PiBroadcastBold, PiFloppyDiskBold,
  PiCheckCircleBold, PiSpinnerBold, PiPencilSimpleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DeviceAssignmentProps {
  orderId: string;
  orderNumber: string;
  initialSimSerial: string | null;
  initialRouterSerial: string | null;
  initialRouterModel: string | null;
  onUpdate?: () => void;
}

export function DeviceAssignment({
  orderId,
  orderNumber,
  initialSimSerial,
  initialRouterSerial,
  initialRouterModel,
  onUpdate,
}: DeviceAssignmentProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simSerial, setSimSerial] = useState(initialSimSerial || '');
  const [routerSerial, setRouterSerial] = useState(initialRouterSerial || '');
  const [routerModel, setRouterModel] = useState(initialRouterModel || '');
  const [saved, setSaved] = useState(false);

  // Detect package type from order
  const is5GorLTE = orderNumber.toLowerCase().includes('5g') || orderNumber.includes('lte') || true;

  const hasDevices = initialSimSerial || initialRouterSerial;
  const isPlaceholder = (v: string | null) => v?.startsWith('PENDING') || false;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/devices`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simSerial: simSerial || null,
          routerSerial: routerSerial || null,
          routerModel: routerModel || null,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setEditing(false);
      setSaved(true);
      toast.success('Device serials updated');
      onUpdate?.();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <PiBroadcastBold className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Device Assignment</h3>
            <p className="text-xs text-slate-500">
              {hasDevices && !isPlaceholder(initialSimSerial) && !isPlaceholder(initialRouterSerial)
                ? 'SIM and router assigned'
                : 'Assign serial numbers from stock'}
            </p>
          </div>
        </div>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1.5"
          >
            <PiPencilSimpleBold className="h-3.5 w-3.5" />
            {hasDevices ? 'Update' : 'Assign'}
          </Button>
        )}
      </div>

      {/* View Mode */}
      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* SIM Card */}
          {is5GorLTE && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <PiSimCardBold className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SIM Card</span>
                {initialSimSerial && !isPlaceholder(initialSimSerial) && (
                  <PiCheckCircleBold className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                )}
              </div>
              <p className={`font-mono text-sm ${isPlaceholder(initialSimSerial) ? 'text-amber-600' : 'text-slate-900'}`}>
                {initialSimSerial || '—'}
              </p>
              {isPlaceholder(initialSimSerial) && (
                <p className="text-xs text-amber-500 mt-1">Needs real serial from stock</p>
              )}
            </div>
          )}

          {/* Router */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <PiBroadcastBold className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Router</span>
              {initialRouterSerial && !isPlaceholder(initialRouterSerial) && (
                <PiCheckCircleBold className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
              )}
            </div>
            <p className={`font-mono text-sm ${isPlaceholder(initialRouterSerial) ? 'text-amber-600' : 'text-slate-900'}`}>
              {initialRouterSerial || '—'}
            </p>
            {initialRouterModel && (
              <p className="text-xs text-slate-400 mt-0.5">{initialRouterModel}</p>
            )}
            {isPlaceholder(initialRouterSerial) && (
              <p className="text-xs text-amber-500 mt-1">Needs real serial from stock</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {editing && (
        <div className="border-2 border-circleTel-orange/30 rounded-lg p-5 bg-orange-50/30 space-y-4">
          {is5GorLTE && (
            <div className="space-y-2">
              <Label htmlFor="sim-serial" className="flex items-center gap-1.5">
                <PiSimCardBold className="h-4 w-4 text-slate-600" />
                SIM Serial (ICCID)
              </Label>
              <Input
                id="sim-serial"
                value={simSerial}
                onChange={(e) => setSimSerial(e.target.value)}
                placeholder="e.g. 8927803001234567890"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-400">19-20 digit number printed on the SIM card</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="router-serial" className="flex items-center gap-1.5">
              <PiBroadcastBold className="h-4 w-4 text-slate-600" />
              Router Serial Number
            </Label>
            <Input
              id="router-serial"
              value={routerSerial}
              onChange={(e) => setRouterSerial(e.target.value)}
              placeholder="e.g. X100PRO862378060745004"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-model" className="flex items-center gap-1.5">
              <PiBroadcastBold className="h-4 w-4 text-slate-600" />
              Router Model
            </Label>
            <Input
              id="router-model"
              value={routerModel}
              onChange={(e) => setRouterModel(e.target.value)}
              placeholder="e.g. Huawei 5G CPE Pro"
              className="text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setSimSerial(initialSimSerial || '');
                setRouterSerial(initialRouterSerial || '');
                setRouterModel(initialRouterModel || '');
              }}
              disabled={saving}
            >
              <PiXCircleBold className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 bg-circleTel-orange hover:bg-orange-600"
            >
              {saving ? (
                <PiSpinnerBold className="h-4 w-4 animate-spin" />
              ) : (
                <PiFloppyDiskBold className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
