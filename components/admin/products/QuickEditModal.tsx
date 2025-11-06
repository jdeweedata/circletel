'use client';

import { useState } from 'react';
import { Product } from '@/lib/types/products';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuickEditModalProps {
  products: Product[];
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Product>) => Promise<void>;
}

export function QuickEditModal({
  products,
  open,
  onClose,
  onSave,
}: QuickEditModalProps) {
  const [updates, setUpdates] = useState<Partial<Product>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    if (!updates.change_reason) {
      alert('Please provide a reason for these changes');
      return;
    }

    setIsProcessing(true);
    try {
      await onSave(updates);
      setUpdates({});
      onClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUpdates({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Quick Edit {products.length} Product{products.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Make quick updates to multiple products at once. Only fields you change will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              onValueChange={(value) =>
                setUpdates({ ...updates, category: value === 'none' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                <SelectItem value="connectivity">Connectivity</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="bundles">Bundles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-sm text-gray-500">Enable or disable products</p>
            </div>
            <Switch
              checked={updates.is_active ?? false}
              onCheckedChange={(checked) => setUpdates({ ...updates, is_active: checked })}
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Featured</Label>
              <p className="text-sm text-gray-500">Show on homepage</p>
            </div>
            <Switch
              checked={updates.is_featured ?? false}
              onCheckedChange={(checked) => setUpdates({ ...updates, is_featured: checked })}
            />
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Popular</Label>
              <p className="text-sm text-gray-500">Mark as popular choice</p>
            </div>
            <Switch
              checked={updates.is_popular ?? false}
              onCheckedChange={(checked) => setUpdates({ ...updates, is_popular: checked })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              onValueChange={(value) =>
                setUpdates({ ...updates, status: value === 'none' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Change Reason */}
          <div className="space-y-2">
            <Label className="text-red-600">Change Reason *</Label>
            <Textarea
              placeholder="Describe why you're making these changes..."
              value={(updates.change_reason as string) || ''}
              onChange={(e) => setUpdates({ ...updates, change_reason: e.target.value })}
              required
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">Required for audit trail</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!updates.change_reason || isProcessing}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            {isProcessing ? 'Saving...' : `Apply to ${products.length} Product${products.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
