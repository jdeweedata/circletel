'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  OrderWithTracking,
  FulfillmentStatus,
  DeliveryStatus,
  SiteSurveyStatus,
} from '@/lib/types/order-tracking';
import { getFulfillmentStatusInfo } from '@/lib/types/order-tracking';

interface OrderTrackingUpdateDialogProps {
  order: OrderWithTracking;
  onUpdate: (orderId: string, updates: any) => Promise<void>;
}

type UpdateType = 'fulfillment' | 'delivery' | 'survey' | 'installation' | 'activation';

export default function OrderTrackingUpdateDialog({
  order,
  onUpdate,
}: OrderTrackingUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>('fulfillment');

  // Fulfillment Status Update
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(order.fulfillment_status);
  const [statusNotes, setStatusNotes] = useState('');

  // Delivery Update
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(order.delivery_status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState(order.delivery_tracking_number || '');
  const [carrier, setCarrier] = useState(order.delivery_carrier || '');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    order.delivery_date ? new Date(order.delivery_date) : undefined
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Site Survey Update
  const [surveyScheduledDate, setSurveyScheduledDate] = useState<Date | undefined>(
    order.site_survey_scheduled_date ? new Date(order.site_survey_scheduled_date) : undefined
  );
  const [surveyCompletedDate, setSurveyCompletedDate] = useState<Date | undefined>(
    order.site_survey_completed_date ? new Date(order.site_survey_completed_date) : undefined
  );
  const [surveyStatus, setSurveyStatus] = useState<SiteSurveyStatus | ''>(order.site_survey_status || '');
  const [surveyNotes, setSurveyNotes] = useState(order.site_survey_notes || '');

  // Installation Update
  const [installationScheduledDate, setInstallationScheduledDate] = useState<Date | undefined>(
    order.installation_scheduled_date ? new Date(order.installation_scheduled_date) : undefined
  );
  const [installationCompletedDate, setInstallationCompletedDate] = useState<Date | undefined>(
    order.installation_completed_date ? new Date(order.installation_completed_date) : undefined
  );
  const [technician, setTechnician] = useState(order.installation_technician || '');
  const [installationNotes, setInstallationNotes] = useState(order.installation_notes || '');

  // Activation Update
  const [activationDate, setActivationDate] = useState<Date | undefined>(
    order.activation_date ? new Date(order.activation_date) : undefined
  );
  const [billingStartDate, setBillingStartDate] = useState<Date | undefined>(
    order.billing_start_date ? new Date(order.billing_start_date) : undefined
  );
  const [activationNotes, setActivationNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let updates: any = {};

      switch (updateType) {
        case 'fulfillment':
          updates = {
            fulfillment_status: fulfillmentStatus,
            notes: statusNotes,
          };
          break;

        case 'delivery':
          updates = {
            delivery_status: deliveryStatus,
            delivery_tracking_number: trackingNumber,
            delivery_carrier: carrier,
            delivery_date: deliveryDate?.toISOString(),
            notes: deliveryNotes,
          };
          break;

        case 'survey':
          updates = {
            site_survey_scheduled_date: surveyScheduledDate?.toISOString(),
            site_survey_completed_date: surveyCompletedDate?.toISOString(),
            site_survey_status: surveyStatus,
            site_survey_notes: surveyNotes,
          };
          break;

        case 'installation':
          updates = {
            installation_scheduled_date: installationScheduledDate?.toISOString(),
            installation_completed_date: installationCompletedDate?.toISOString(),
            installation_technician: technician,
            installation_notes: installationNotes,
          };
          break;

        case 'activation':
          updates = {
            activation_date: activationDate?.toISOString(),
            billing_start_date: billingStartDate?.toISOString(),
            notes: activationNotes,
          };
          break;
      }

      await onUpdate(order.id, updates);
      setOpen(false);
    } catch (error) {
      console.error('Error updating order tracking:', error);
    } finally {
      setUpdating(false);
    }
  };

  const fulfillmentStatuses: FulfillmentStatus[] = [
    'order_confirmed',
    'equipment_prepared',
    'shipped',
    'out_for_delivery',
    'delivered',
    'site_survey_scheduled',
    'site_survey_completed',
    'installation_scheduled',
    'installation_in_progress',
    'installation_completed',
    'activation_scheduled',
    'service_activated',
    'completed',
    'cancelled',
  ];

  const deliveryStatuses: DeliveryStatus[] = [
    'pending',
    'prepared',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
  ];

  const surveyStatuses: SiteSurveyStatus[] = ['scheduled', 'in_progress', 'passed', 'failed', 'rescheduled'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Update Tracking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Order Tracking</DialogTitle>
          <DialogDescription>
            Update tracking information for order {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Update Type Selector */}
          <div className="space-y-2">
            <Label>Update Type</Label>
            <Select value={updateType} onValueChange={(value) => setUpdateType(value as UpdateType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fulfillment">Fulfillment Status</SelectItem>
                <SelectItem value="delivery">Delivery Information</SelectItem>
                {order.order_type === 'fiber' && (
                  <SelectItem value="survey">Site Survey</SelectItem>
                )}
                <SelectItem value="installation">Installation</SelectItem>
                <SelectItem value="activation">Service Activation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fulfillment Status Update */}
          {updateType === 'fulfillment' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fulfillment Status</Label>
                <Select value={fulfillmentStatus} onValueChange={(value) => setFulfillmentStatus(value as FulfillmentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fulfillmentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getFulfillmentStatusInfo(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Delivery Update */}
          {updateType === 'delivery' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Delivery Status</Label>
                <Select value={deliveryStatus} onValueChange={(value) => setDeliveryStatus(value as DeliveryStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., TPL123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g., The Courier Guy, Aramex"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !deliveryDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Add delivery notes..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Site Survey Update */}
          {updateType === 'survey' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !surveyScheduledDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {surveyScheduledDate ? format(surveyScheduledDate, 'PPP p') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={surveyScheduledDate}
                      onSelect={setSurveyScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Completed Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !surveyCompletedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {surveyCompletedDate ? format(surveyCompletedDate, 'PPP p') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={surveyCompletedDate}
                      onSelect={setSurveyCompletedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Survey Status</Label>
                <Select value={surveyStatus} onValueChange={(value) => setSurveyStatus(value as SiteSurveyStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveyStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Survey Notes</Label>
                <Textarea
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  placeholder="Add survey notes..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Installation Update */}
          {updateType === 'installation' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !installationScheduledDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {installationScheduledDate ? format(installationScheduledDate, 'PPP p') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={installationScheduledDate}
                      onSelect={setInstallationScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Completed Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !installationCompletedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {installationCompletedDate ? format(installationCompletedDate, 'PPP p') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={installationCompletedDate}
                      onSelect={setInstallationCompletedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Technician</Label>
                <Input
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Technician name"
                />
              </div>
              <div className="space-y-2">
                <Label>Installation Notes</Label>
                <Textarea
                  value={installationNotes}
                  onChange={(e) => setInstallationNotes(e.target.value)}
                  placeholder="Add installation notes..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Activation Update */}
          {updateType === 'activation' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Activation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !activationDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activationDate ? format(activationDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={activationDate}
                      onSelect={setActivationDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Billing Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !billingStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {billingStartDate ? format(billingStartDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={billingStartDate}
                      onSelect={setBillingStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Activation Notes</Label>
                <Textarea
                  value={activationNotes}
                  onChange={(e) => setActivationNotes(e.target.value)}
                  placeholder="Add activation notes..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Tracking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
