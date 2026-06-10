'use client';
import { PiArrowsClockwiseBold, PiArrowRightBold } from 'react-icons/pi';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PackageOption {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  customer_type: string;
}

interface ChangePackageDialogProps {
  customerId: string;
  service: {
    id: string;
    package_name: string;
    monthly_price: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

export function ChangePackageDialog({
  customerId,
  service,
  open,
  onOpenChange,
  onSuccess,
}: ChangePackageDialogProps) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedPackageId('');
    setReason('');
    setNotes('');
    setError(null);

    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const response = await fetch(
          `/api/admin/customers/${customerId}/services/change-package`
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load packages');
        }
        setPackages(data.packages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, [open, customerId]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || null;
  const priceDiff = selectedPackage ? selectedPackage.price - service.monthly_price : 0;

  const handleSubmit = async () => {
    if (!selectedPackageId || !reason.trim()) {
      setError('Select a package and provide a reason');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch(
        `/api/admin/customers/${customerId}/services/change-package`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: service.id,
            new_package_id: selectedPackageId,
            reason: reason.trim(),
            notes: notes.trim() || undefined,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change package');
      }
      onOpenChange(false);
      onSuccess(`${data.message}. ${data.billing_note}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change package');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Package</DialogTitle>
          <DialogDescription>
            Current: {service.package_name} ({formatCurrency(service.monthly_price)}/mo). The new
            price applies from the next invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">New package</label>
            {packagesLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.speed_down}/{pkg.speed_up} Mbps —{' '}
                      {formatCurrency(pkg.price)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPackage && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm flex items-center gap-2">
              <span className="text-gray-600">{formatCurrency(service.monthly_price)}/mo</span>
              <PiArrowRightBold className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium text-gray-900">
                {formatCurrency(selectedPackage.price)}/mo
              </span>
              <span
                className={`ml-auto font-medium ${
                  priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {priceDiff > 0 ? '+' : ''}
                {formatCurrency(priceDiff)}/mo
              </span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Customer requested upgrade"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
            <Textarea
              placeholder="Additional context for the audit log…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedPackageId || !reason.trim()}
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
          >
            {submitting && <PiArrowsClockwiseBold className="h-4 w-4 mr-1.5 animate-spin" />}
            Change Package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
