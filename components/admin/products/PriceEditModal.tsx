'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  monthly_price: string | number;
  setup_fee: string | number;
}

interface PriceEditModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSave: (productId: string, updates: { monthly_price: number; setup_fee: number; change_reason: string }) => Promise<void>;
}

export function PriceEditModal({ product, open, onClose, onSave }: PriceEditModalProps) {
  const [monthlyPrice, setMonthlyPrice] = useState(parseFloat(product.monthly_price?.toString() || '0'));
  const [setupFee, setSetupFee] = useState(parseFloat(product.setup_fee?.toString() || '0'));
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    monthlyPrice !== parseFloat(product.monthly_price?.toString() || '0') ||
    setupFee !== parseFloat(product.setup_fee?.toString() || '0');

  const handleSave = async () => {
    if (!changeReason.trim()) {
      setError('Please provide a reason for this price change');
      return;
    }

    if (!hasChanges) {
      setError('No changes detected');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(product.id, {
        monthly_price: monthlyPrice,
        setup_fee: setupFee,
        change_reason: changeReason
      });
      onClose();
      // Reset form
      setChangeReason('');
    } catch (err) {
      console.error('Error saving price changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setMonthlyPrice(parseFloat(product.monthly_price?.toString() || '0'));
    setSetupFee(parseFloat(product.setup_fee?.toString() || '0'));
    setChangeReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Edit Pricing - {product.name}
          </DialogTitle>
          <DialogDescription>
            Update product pricing. All changes are tracked in the audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Monthly Price */}
          <div className="space-y-2">
            <Label htmlFor="monthly-price">Monthly Price (ZAR)*</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R
              </span>
              <Input
                id="monthly-price"
                type="number"
                step="0.01"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
            {monthlyPrice !== parseFloat(product.monthly_price?.toString() || '0') && (
              <p className="text-xs text-orange-600">
                Original: R{parseFloat(product.monthly_price?.toString() || '0').toFixed(2)} →
                New: R{monthlyPrice.toFixed(2)}
                ({monthlyPrice > parseFloat(product.monthly_price?.toString() || '0') ? '+' : ''}
                R{(monthlyPrice - parseFloat(product.monthly_price?.toString() || '0')).toFixed(2)})
              </p>
            )}
          </div>

          {/* Setup Fee */}
          <div className="space-y-2">
            <Label htmlFor="setup-fee">Setup Fee (ZAR)*</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R
              </span>
              <Input
                id="setup-fee"
                type="number"
                step="0.01"
                min="0"
                value={setupFee}
                onChange={(e) => setSetupFee(parseFloat(e.target.value) || 0)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
            {setupFee !== parseFloat(product.setup_fee?.toString() || '0') && (
              <p className="text-xs text-orange-600">
                Original: R{parseFloat(product.setup_fee?.toString() || '0').toFixed(2)} →
                New: R{setupFee.toFixed(2)}
                ({setupFee > parseFloat(product.setup_fee?.toString() || '0') ? '+' : ''}
                R{(setupFee - parseFloat(product.setup_fee?.toString() || '0')).toFixed(2)})
              </p>
            )}
          </div>

          {/* Change Reason */}
          <div className="space-y-2">
            <Label htmlFor="change-reason">Reason for Change*</Label>
            <Textarea
              id="change-reason"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g., Market adjustment, Promotional pricing, Cost increase..."
              className="min-h-[80px]"
              required
            />
            <p className="text-xs text-gray-500">
              This will be recorded in the audit trail for compliance.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Change Summary */}
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm space-y-1">
              <p className="font-semibold">Changes Summary:</p>
              <ul className="list-disc list-inside text-xs">
                {monthlyPrice !== parseFloat(product.monthly_price?.toString() || '0') && (
                  <li>
                    Monthly price: R{parseFloat(product.monthly_price?.toString() || '0').toFixed(2)} → R{monthlyPrice.toFixed(2)}
                  </li>
                )}
                {setupFee !== parseFloat(product.setup_fee?.toString() || '0') && (
                  <li>
                    Setup fee: R{parseFloat(product.setup_fee?.toString() || '0').toFixed(2)} → R{setupFee.toFixed(2)}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={saving || !hasChanges || !changeReason.trim()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
