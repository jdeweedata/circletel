'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/types/products';
import type { UnifiedProduct } from '@/lib/types/unified-product';

interface EditableFields {
  name: string;
  description: string;
  price: number;
  cost: number | null;
  status: string;
  isFeatured: boolean;
}

/**
 * Per-source endpoint + body mapping (all verified 2026-06-11):
 * - service_packages: PATCH /api/admin/products/{id}
 *     body: { name, description, base_price_zar, featured, is_active }
 *     ⚠️ NEVER send cost_price_zar here — that endpoint maps it to pricing.setup.
 *     cost not editable via drawer for this source.
 * - circletel_hardware_products: PATCH /api/hardware/products/{id}
 *     body: { name, description, retail_price, cost_price, status }
 *     (status: 'published' | 'draft' | 'archived'; passed to updateHardwareProduct)
 * - mtn_dealer_products: PUT /api/admin/mtn-dealer-products/{id}
 *     body: { selling_price_incl_vat, status, change_reason }
 *     name/description are MTN feed data — not editable.
 * - admin_products: no update endpoint — drawer not offered (button hidden).
 */

export function ProductEditDrawer({
  product,
  onClose,
  onSaved,
}: {
  product: UnifiedProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<EditableFields>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    cost: product?.sourceTable === 'admin_products' ? null : product?.cost ?? 0,
    status: product?.rawStatus ?? 'draft',
    isFeatured: product?.isFeatured ?? false,
  });

  const open = product !== null;

  if (!open || !product) {
    return (
      <>
        <div className="fixed inset-0 z-40 pointer-events-none" />
        <aside className="fixed left-0 top-0 z-50 h-full w-full max-w-md -translate-x-full" />
      </>
    );
  }

  const isServicePackage = product.sourceTable === 'service_packages';
  const isHardware = product.sourceTable === 'circletel_hardware_products';
  const isMTN = product.sourceTable === 'mtn_dealer_products';

  // Status options per source
  const statusOptions =
    isServicePackage ? ['active', 'inactive']
    : isHardware ? ['published', 'draft', 'archived']
    : isMTN ? ['active', 'inactive', 'archived']
    : [];

  async function handleSave() {
    setError(null);
    setSubmitting(true);

    try {
      let method: string;
      let url: string;
      let body: Record<string, unknown>;

      if (isServicePackage) {
        method = 'PATCH';
        url = `/api/admin/products/${product!.id}`;
        body = {
          name: formData.name,
          description: formData.description,
          base_price_zar: formData.price > 0 ? formData.price : undefined,
          featured: formData.isFeatured,
          is_active: formData.status === 'active',
        };
        // Remove undefined fields
        Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      } else if (isHardware) {
        method = 'PATCH';
        url = `/api/hardware/products/${product!.id}`;
        body = {
          name: formData.name,
          description: formData.description,
          retail_price: formData.price > 0 ? formData.price : undefined,
          cost_price: (formData.cost ?? 0) > 0 ? formData.cost : undefined,
          status: formData.status,
        };
        Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      } else if (isMTN) {
        method = 'PUT';
        url = `/api/admin/mtn-dealer-products/${product!.id}`;
        body = {
          selling_price_incl_vat: formData.price > 0 ? formData.price : undefined,
          status: formData.status,
          change_reason: 'Edited in Product Workspace',
        };
        Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      } else {
        throw new Error('Unknown product source');
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.error === 'string' ? data.error : `Save failed (${res.status})`;
        setError(errorMsg);
        return;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-label="Edit product"
      >
        <header className="flex items-center justify-between gap-3 border-b border-ui-border p-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ui-text-primary">
              Edit {product.name}
            </h2>
            <p className="text-xs text-ui-text-muted">{product.source}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1 text-ui-text-muted hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <PiXBold className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name field - editable for service_packages and hardware, read-only for MTN */}
            <div>
              <label className="block text-sm font-medium text-ui-text-primary mb-1">
                Name
              </label>
              {isMTN ? (
                <div className="rounded-lg border border-ui-border bg-slate-50 px-3 py-2 text-sm text-ui-text-muted">
                  {formData.name}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                  className="w-full rounded-lg border border-ui-border px-3 py-2 text-sm disabled:bg-slate-50"
                  placeholder="Product name"
                />
              )}
              {isMTN && (
                <p className="mt-1 text-xs text-ui-text-muted">MTN feed data — not editable</p>
              )}
            </div>

            {/* Description field - editable for service_packages and hardware, read-only for MTN */}
            <div>
              <label className="block text-sm font-medium text-ui-text-primary mb-1">
                Description
              </label>
              {isMTN ? (
                <div className="rounded-lg border border-ui-border bg-slate-50 px-3 py-2 text-sm text-ui-text-muted max-h-24 overflow-y-auto">
                  {formData.description || '—'}
                </div>
              ) : (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                  rows={3}
                  className="w-full rounded-lg border border-ui-border px-3 py-2 text-sm disabled:bg-slate-50 resize-none"
                  placeholder="Product description"
                />
              )}
              {isMTN && (
                <p className="mt-1 text-xs text-ui-text-muted">MTN feed data — not editable</p>
              )}
            </div>

            {/* Price field */}
            <div>
              <label className="block text-sm font-medium text-ui-text-primary mb-1">
                {isServicePackage ? 'Monthly price (ZAR)' : isHardware ? 'Retail price (ZAR)' : 'Selling price (ZAR)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, price: Number.isNaN(val) ? 0 : val });
                }}
                disabled={submitting}
                className="w-full rounded-lg border border-ui-border px-3 py-2 text-sm disabled:bg-slate-50"
                placeholder="0.00"
              />
            </div>

            {/* Cost field - only for hardware */}
            {isHardware && (
              <div>
                <label className="block text-sm font-medium text-ui-text-primary mb-1">
                  Cost price (ZAR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(formData.cost ?? 0) || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      cost: Number.isNaN(val) ? 0 : val,
                    });
                  }}
                  disabled={submitting}
                  className="w-full rounded-lg border border-ui-border px-3 py-2 text-sm disabled:bg-slate-50"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Status field */}
            <div>
              <label className="block text-sm font-medium text-ui-text-primary mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={submitting}
                className="w-full rounded-lg border border-ui-border px-3 py-2 text-sm disabled:bg-slate-50"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured toggle - only for service_packages */}
            {isServicePackage && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  disabled={submitting}
                  className="rounded border-ui-border"
                />
                <label htmlFor="featured" className="text-sm font-medium text-ui-text-primary">
                  Featured
                </label>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-ui-border p-4">
          <button
            onClick={handleSave}
            disabled={submitting}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors',
              submitting
                ? 'cursor-not-allowed bg-slate-300'
                : 'bg-circleTel-orange hover:bg-circleTel-orange-dark'
            )}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </aside>
    </>
  );
}
