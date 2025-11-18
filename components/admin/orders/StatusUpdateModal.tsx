'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    status: string;
  };
  onSuccess: () => void;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', description: 'Order received, awaiting action' },
  { value: 'payment', label: 'Payment', description: 'Awaiting payment confirmation' },
  {
    value: 'kyc_submitted',
    label: 'KYC Submitted',
    description: 'Customer documents submitted',
  },
  {
    value: 'kyc_approved',
    label: 'KYC Approved',
    description: 'Documents verified and approved',
  },
  {
    value: 'installation_scheduled',
    label: 'Installation Scheduled',
    description: 'Installation date confirmed',
  },
  {
    value: 'installation_completed',
    label: 'Installation Completed',
    description: 'Installation finished successfully',
  },
  { value: 'active', label: 'Active', description: 'Service is live and running' },
  { value: 'cancelled', label: 'Cancelled', description: 'Order cancelled' },
];

export function StatusUpdateModal({ open, onClose, order, onSuccess }: StatusUpdateModalProps) {
  const [newStatus, setNewStatus] = useState<string>(order.status);
  const [notes, setNotes] = useState<string>('');
  const [installationDate, setInstallationDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Calculate min date (tomorrow) for installation scheduling
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60); // 60 days out
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newStatus) {
      setError('Please select a status');
      return;
    }

    if (newStatus === 'installation_scheduled' && !installationDate) {
      setError('Please select an installation date');
      return;
    }

    if (newStatus === 'cancelled' && !notes) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData: any = {
        status: newStatus,
        notes: notes || undefined,
      };

      // Add installation date if scheduling
      if (newStatus === 'installation_scheduled' && installationDate) {
        updateData.scheduledDate = installationDate;
      }

      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Order status updated successfully', {
          description: `${order.order_number} is now "${getStatusLabel(newStatus)}"`,
        });
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to update order status');
        toast.error('Update failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewStatus(order.status);
    setNotes('');
    setInstallationDate('');
    setError('');
    onClose();
  };

  const getStatusLabel = (status: string): string => {
    return ORDER_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const selectedStatus = ORDER_STATUSES.find((s) => s.value === newStatus);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order{' '}
              <span className="font-semibold text-gray-900">{order.order_number}</span> -{' '}
              {order.first_name} {order.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Current Status</Label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border">
                <span className="font-medium">{getStatusLabel(order.status)}</span>
              </div>
            </div>

            {/* New Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                New Status <span className="text-red-500">*</span>
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{status.label}</span>
                        <span className="text-xs text-gray-500">{status.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStatus && (
                <p className="text-xs text-gray-500">{selectedStatus.description}</p>
              )}
            </div>

            {/* Installation Date (conditional) */}
            {newStatus === 'installation_scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="installation_date">
                  Installation Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="installation_date"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  min={minDate}
                  max={maxDateStr}
                  required
                />
                <p className="text-xs text-gray-500">
                  Select a date for the installation appointment
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes {newStatus === 'cancelled' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  newStatus === 'cancelled'
                    ? 'Provide a reason for cancellation...'
                    : 'Add any internal notes about this status change...'
                }
                rows={3}
                required={newStatus === 'cancelled'}
              />
              <p className="text-xs text-gray-500">
                {newStatus === 'cancelled'
                  ? 'Required: Explain why the order is being cancelled'
                  : 'Optional: Add internal notes (not visible to customer)'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> The customer will receive an automated email notification
                about this status change.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
