'use client';
import { PiArrowsClockwiseBold, PiCalendarBold, PiCheckCircleBold, PiCopyBold, PiDotsThreeBold, PiFunnelBold, PiGiftBold, PiMagnifyingGlassBold, PiPauseBold, PiPencilSimpleBold, PiPlayBold, PiPlusBold, PiSpinnerBold, PiTrashBold, PiWarningCircleBold } from 'react-icons/pi';

/**
 * Promotions Management Page
 *
 * List, search, filter, and manage promotional codes and discounts.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';
type DiscountType = 'percentage' | 'fixed' | 'free_installation' | 'free_month';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  promo_code: string | null;
  product_id: string | null;
  customer_type: 'residential' | 'business' | 'all' | null;
  valid_from: string;
  valid_until: string | null;
  max_usage: number | null;
  usage_count: number;
  max_per_customer: number;
  status: PromotionStatus;
  display_on_homepage: boolean;
  created_at: string;
}

interface PromotionFormData {
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  promo_code: string;
  customer_type: 'residential' | 'business' | 'all';
  valid_from: string;
  valid_until: string;
  max_usage: string;
  max_per_customer: number;
  status: PromotionStatus;
  display_on_homepage: boolean;
}

const statusOptions: { value: PromotionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
];

const discountTypeOptions: { value: DiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage Off' },
  { value: 'fixed', label: 'Fixed Amount Off' },
  { value: 'free_installation', label: 'Free Installation' },
  { value: 'free_month', label: 'Free Month' },
];

function StatusBadge({ status }: { status: PromotionStatus }) {
  const styles: Record<PromotionStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full capitalize',
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function DiscountDisplay({
  type,
  value,
}: {
  type: DiscountType;
  value: number;
}) {
  switch (type) {
    case 'percentage':
      return <span className="font-semibold text-circleTel-orange">{value}% off</span>;
    case 'fixed':
      return <span className="font-semibold text-circleTel-orange">R{value} off</span>;
    case 'free_installation':
      return <span className="font-semibold text-green-600">Free Installation</span>;
    case 'free_month':
      return <span className="font-semibold text-green-600">Free Month</span>;
    default:
      return <span>{value}</span>;
  }
}

function generatePromoCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function PromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'all'>(
    (searchParams.get('status') as PromotionStatus) || 'all'
  );

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    promo_code: '',
    customer_type: 'all',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    max_usage: '',
    max_per_customer: 1,
    status: 'draft',
    display_on_homepage: false,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Action menu
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/marketing/promotions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch promotions');

      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      promo_code: generatePromoCode(),
      customer_type: 'all',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      max_usage: '',
      max_per_customer: 1,
      status: 'draft',
      display_on_homepage: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      promo_code: promotion.promo_code || '',
      customer_type: promotion.customer_type || 'all',
      valid_from: promotion.valid_from.split('T')[0],
      valid_until: promotion.valid_until?.split('T')[0] || '',
      max_usage: promotion.max_usage?.toString() || '',
      max_per_customer: promotion.max_per_customer,
      status: promotion.status,
      display_on_homepage: promotion.display_on_homepage,
    });
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        max_usage: formData.max_usage ? parseInt(formData.max_usage) : null,
        valid_until: formData.valid_until || null,
        promo_code: formData.promo_code || null,
      };

      const url = editingPromotion
        ? `/api/admin/marketing/promotions/${editingPromotion.id}`
        : '/api/admin/marketing/promotions';

      const res = await fetch(url, {
        method: editingPromotion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save promotion');
      }

      setIsModalOpen(false);
      fetchPromotions();
    } catch (err) {
      console.error('Error saving promotion:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/marketing/promotions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete promotion');

      setDeleteConfirm(null);
      fetchPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PromotionStatus) => {
    try {
      const res = await fetch(`/api/admin/marketing/promotions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      fetchPromotions();
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add toast notification here
  };

  const filteredPromotions = promotions.filter((p) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.promo_code?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500 mt-1">
            Manage discount codes and promotional offers
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <PiPlusBold className="h-4 w-4 mr-2" />
          New Promotion
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search promotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PromotionStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <PiFunnelBold className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchPromotions}>
          <PiArrowsClockwiseBold className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <PiWarningCircleBold className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <PiSpinnerBold className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-12">
            <PiGiftBold className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No promotions found</p>
            <Button variant="outline" className="mt-4" onClick={openCreateModal}>
              <PiPlusBold className="h-4 w-4 mr-2" />
              Create your first promotion
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Promotion
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Discount
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Usage
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Valid Until
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{promotion.name}</p>
                      {promotion.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {promotion.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {promotion.promo_code ? (
                      <button
                        onClick={() => copyPromoCode(promotion.promo_code!)}
                        className="group flex items-center gap-2"
                      >
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {promotion.promo_code}
                        </code>
                        <PiCopyBold className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <DiscountDisplay
                      type={promotion.discount_type}
                      value={promotion.discount_value}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {promotion.usage_count}
                      {promotion.max_usage && ` / ${promotion.max_usage}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {promotion.valid_until ? (
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <PiCalendarBold className="h-3.5 w-3.5" />
                        {new Date(promotion.valid_until).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={promotion.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === promotion.id ? null : promotion.id
                          )
                        }
                      >
                        <PiDotsThreeBold className="h-4 w-4" />
                      </Button>
                      {actionMenuOpen === promotion.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <div className="py-1">
                            <button
                              onClick={() => openEditModal(promotion)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <PiPencilSimpleBold className="h-4 w-4" />
                              Edit
                            </button>
                            {promotion.status === 'active' ? (
                              <button
                                onClick={() =>
                                  handleStatusChange(promotion.id, 'paused')
                                }
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <PiPauseBold className="h-4 w-4" />
                                Pause
                              </button>
                            ) : promotion.status === 'paused' ||
                              promotion.status === 'draft' ? (
                              <button
                                onClick={() =>
                                  handleStatusChange(promotion.id, 'active')
                                }
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <PiPlayBold className="h-4 w-4" />
                                Activate
                              </button>
                            ) : null}
                            <button
                              onClick={() => {
                                setDeleteConfirm(promotion.id);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                              <PiTrashBold className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion
                ? 'Update the promotion details below.'
                : 'Set up a new promotional offer or discount code.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Promotion Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Summer Sale 2026"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the promotion..."
                  rows={2}
                />
              </div>
            </div>

            {/* Discount Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discount_type: value as DiscountType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(formData.discount_type === 'percentage' ||
                formData.discount_type === 'fixed') && (
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value{' '}
                    {formData.discount_type === 'percentage' ? '(%)' : '(R)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Promo Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo_code">Promo Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo_code"
                    value={formData.promo_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promo_code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., SUMMER20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({ ...formData, promo_code: generatePromoCode() })
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="customer_type">Customer Type</Label>
                <Select
                  value={formData.customer_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      customer_type: value as 'residential' | 'business' | 'all',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="residential">Residential Only</SelectItem>
                    <SelectItem value="business">Business Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_usage">Max Total Usage (optional)</Label>
                <Input
                  id="max_usage"
                  type="number"
                  min="0"
                  value={formData.max_usage}
                  onChange={(e) =>
                    setFormData({ ...formData, max_usage: e.target.value })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="max_per_customer">Max Per Customer</Label>
                <Input
                  id="max_per_customer"
                  type="number"
                  min="1"
                  value={formData.max_per_customer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_per_customer: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as PromotionStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="display_on_homepage"
                  checked={formData.display_on_homepage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_on_homepage: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="display_on_homepage">Display on Homepage</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? (
                <>
                  <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingPromotion ? (
                'Update Promotion'
              ) : (
                'Create Promotion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotion? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
