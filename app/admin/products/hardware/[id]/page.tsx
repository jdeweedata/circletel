'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PiArrowLeftBold,
  PiArchiveBold,
  PiArrowRightBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiFileTextBold,
  PiFloppyDiskBold,
} from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import type { HardwareProductFull } from '@/lib/hardware-catalogue/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function AdminHardwareEditorPage({ params }: Props) {
  const { user } = useAdminAuth()
  const router = useRouter()
  const [product, setProduct] = useState<HardwareProductFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    retail_price: 0,
    cost_price: 0,
    status: 'draft' as string,
    is_featured: false,
    sort_order: 0,
    warranty_months: null as number | null,
    warranty_description: '',
  })

  useEffect(() => {
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProduct() {
    const { id } = await params
    try {
      const res = await fetch(`/api/hardware/products/${id}`)
      const data = await res.json()
      setProduct(data)
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        category: data.category || '',
        retail_price: data.retail_price || 0,
        cost_price: data.cost_price || 0,
        status: data.status || 'draft',
        is_featured: data.is_featured || false,
        sort_order: data.sort_order || 0,
        warranty_months: data.warranty_months || null,
        warranty_description: data.warranty_description || '',
      })
    } catch (err) {
      console.error('Failed to load product:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { id } = await params
      const res = await fetch(`/api/hardware/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/admin/products/hardware')
      } else {
        const err = await res.json()
        alert(`Failed to save: ${err.error}`)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    await updateStatus('published')
  }

  async function handleArchive() {
    await updateStatus('archived')
  }

  async function updateStatus(status: string) {
    try {
      const { id } = await params
      await fetch(`/api/hardware/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.push('/admin/products/hardware')
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#7C93AF]">Authenticating...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-[#7C93AF]">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#7C93AF]">Product not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/products/hardware')}
          className="flex items-center gap-2 text-sm font-semibold text-[#7C93AF] hover:text-[#1B2A4A]"
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back to Products
        </button>
        <div className="flex gap-2">
          {product.status !== 'published' && (
            <Button
              variant="outline"
              className="gap-2 text-green-600"
              onClick={handlePublish}
            >
              <PiCheckCircleBold className="h-4 w-4" />
              Publish
            </Button>
          )}
          {product.status === 'published' && (
            <Button
              variant="outline"
              className="gap-2 text-amber-600"
              onClick={handleArchive}
            >
              <PiArchiveBold className="h-4 w-4" />
              Archive
            </Button>
          )}
          <Button
            className="gap-2 bg-[#E87A1E] hover:bg-[#C45A30]"
            onClick={handleSave}
            disabled={saving}
          >
            <PiFloppyDiskBold className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main fields */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Product Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm font-mono focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1B2A4A]">
                Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g., Networking, Streaming, Routers"
                className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Pricing</h3>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Retail Price (incl VAT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.retail_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      retail_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Supplier Cost (excl VAT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cost_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
                />
              </div>
              {form.cost_price > 0 && (
                <p className="text-xs text-[#7C93AF]">
                  Markup:{' '}
                  {(
                    ((form.retail_price - form.cost_price) /
                      form.cost_price) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Settings</h3>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_featured: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm font-semibold text-[#31527B]">
                  Featured product
                </span>
              </label>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Warranty</h3>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Warranty (months)
                </label>
                <input
                  type="number"
                  value={form.warranty_months || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      warranty_months: parseInt(e.target.value) || null,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none"
                  placeholder="e.g., 24"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7C93AF]">
                  Warranty Description
                </label>
                <input
                  type="text"
                  value={form.warranty_description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      warranty_description: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none"
                  placeholder="e.g., 12 months manufacturer warranty"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Link */}
          <Card>
            <CardContent className="p-4">
              <Link
                href={`/admin/products/hardware/${product.id}/terms`}
                className="flex items-center justify-between text-sm font-semibold text-[#31527B] hover:text-[#E87A1E]"
              >
                <span className="flex items-center gap-2">
                  <PiFileTextBold className="h-4 w-4" />
                  Terms & Conditions
                </span>
                <PiCaretRightBold className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Supplier Info (read-only) */}
          {product.suppliers.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Supplier Sources
                </h3>
                {product.suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#31527B]">
                        {s.supplier_name}
                      </p>
                      <p className="text-xs text-[#7C93AF]">SKU: {s.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1B2A4A]">
                        R{s.supplier_cost.toLocaleString()}
                      </p>
                      {s.is_preferred && (
                        <span className="text-xs text-[#AE5B16]">
                          Preferred
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
