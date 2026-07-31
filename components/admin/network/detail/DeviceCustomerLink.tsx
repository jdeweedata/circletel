'use client';

import { useState } from 'react';
import {
  PiUserBold,
  PiLinkBold,
  PiLinkBreakBold,
  PiUserCircleBold,
  PiBuildingsBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiSpinnerBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
import { LinkCustomerDialog } from '@/components/admin/network/LinkCustomerDialog';

interface Device {
  sn: string;
  device_name?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_order_id: string | null;
  corporate_site_id: string | null;
}

interface DeviceCustomerLinkProps {
  device: Device;
  onUpdate: () => void;
}

/**
 * Customer Assignment panel on device detail.
 * Link API: POST/DELETE `/api/ruijie/devices/[sn]/link` — see route JSDoc.
 */
export function DeviceCustomerLink({ device, onUpdate }: DeviceCustomerLinkProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinked =
    device.customer_name !== null ||
    device.customer_order_id !== null ||
    device.corporate_site_id !== null;
  const linkType = device.customer_order_id
    ? 'consumer'
    : device.corporate_site_id
      ? 'corporate'
      : null;

  const handleUnlink = async () => {
    setUnlinking(true);
    setError(null);

    try {
      const response = await fetch(`/api/ruijie/devices/${encodeURIComponent(device.sn)}/link`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to unlink customer');
        return;
      }

      onUpdate();
    } catch (err) {
      console.error('Unlink failed:', err);
      setError('Failed to unlink customer. Please try again.');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <>
      <SectionCard icon={PiUserBold} title="Customer Assignment" compact>
        {isLinked ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  {linkType === 'corporate' ? (
                    <PiBuildingsBold className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <PiUserCircleBold className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 truncate">
                      {device.customer_name || 'Linked customer'}
                    </p>
                    <Badge
                      className={
                        linkType === 'corporate'
                          ? 'bg-blue-100 text-blue-700 border-0'
                          : 'bg-purple-100 text-purple-700 border-0'
                      }
                    >
                      {linkType === 'corporate' ? 'Corporate' : 'Consumer'}
                    </Badge>
                  </div>
                  {device.customer_email && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <PiEnvelopeBold className="w-3.5 h-3.5" />
                      {device.customer_email}
                    </p>
                  )}
                  {device.customer_phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <PiPhoneBold className="w-3.5 h-3.5" />
                      {device.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleUnlink}
              disabled={unlinking}
            >
              {unlinking ? (
                <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PiLinkBreakBold className="w-4 h-4 mr-2" />
              )}
              Unlink Customer
            </Button>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <PiUserBold className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                This device is not linked to any customer.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Link it to a consumer order or corporate site for easier identification.
              </p>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setDialogOpen(true)}
            >
              <PiLinkBold className="w-4 h-4 mr-2" />
              Link to Customer
            </Button>
          </div>
        )}
      </SectionCard>

      <LinkCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sn={device.sn}
        deviceName={device.device_name}
        onLinked={onUpdate}
      />
    </>
  );
}
