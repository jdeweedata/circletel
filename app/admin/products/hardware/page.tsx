'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PiPlusBold,
  PiPencilBold,
  PiEyeBold,
  PiArchiveBold,
  PiCheckCircleBold,
  PiWarningCircleBold,
} from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import type {
  HardwareProductDetail,
  HardwareProductFilters,
} from '@/lib/hardware-catalogue/types'

// =====================================================
// Status helpers
// =====================================================

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-700',
  },
  archived: {
    label: 'Archived',
    className: 'bg-amber-100 text-amber-700',
  },
}

export default function AdminHardwareListPage() {
  const { user } = useAdminAuth()
  const [products, setProducts] = useState<HardwareProductDetail[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HardwareProductFilters>({
    status: undefined,
    search: '',
    page: 1,
  })

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/hardware/products?status=${filters.status || ''}&search=${filters.search || ''}&page=${filters.page || 1}`
      )
      const data = await res.json()
      setProducts(data.data || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/hardware/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      loadProducts()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">
            Hardware Products
          </h1>
          <p className="mt-1 text-sm text-[#7C93AF]">
            {total} products · Manage your curated hardware catalogue
          </p>
        </div>
        <Link href="/admin/products/hardware/promote">
          <Button className="gap-2 bg-[#E87A1E] hover:bg-[#C45A30]">
            <PiPlusBold className="h-4 w-4" />
            Promote from Supplier
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
            }
            className="flex-1 rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
          />
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value || undefined) as
                  | HardwareProductFilters['status'],
                page: 1,
              }))
            }
            className="rounded-lg border border-[#DDE7F3] px-4 py-2 text-sm focus:border-[#E87A1E] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </CardContent>
      </Card>

      {/* Product table */}
      {loading ? (
        <div className="py-20 text-center text-[#7C93AF]">Loading...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="mb-4 text-6xl">📦</div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">
              No products yet
            </h2>
            <p className="mt-2 text-[#7C93AF]">
              Promote products from your supplier feeds to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#DDE7F3] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#DDE7F3] bg-[#F9FAFB]">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#7C93AF]">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#7C93AF]">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                  Retail Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                  Cost
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#7C93AF]">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#7C93AF]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7F3]">
              {products.map((p) => {
                const status = statusConfig[p.status] || statusConfig.draft
                return (
                  <tr key={p.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#1B2A4A]">
                        {p.name}
                      </p>
                      <p className="text-xs text-[#7C93AF]">
                        {p.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#31527B]">
                        {p.category || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-[#1B2A4A]">
                        R
                        {p.retail_price.toLocaleString('en-ZA', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#7C93AF]">
                        R
                        {p.cost_price.toLocaleString('en-ZA', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.total_stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                          <PiCheckCircleBold className="h-4 w-4" />
                          {p.total_stock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                          <PiWarningCircleBold className="h-4 w-4" />0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/hardware/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <PiPencilBold className="h-4 w-4" />
                          </Button>
                        </Link>
                        {p.status !== 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600"
                            title="Publish"
                            onClick={() => updateStatus(p.id, 'published')}
                          >
                            <PiEyeBold className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-amber-600"
                            title="Archive"
                            onClick={() => updateStatus(p.id, 'archived')}
                          >
                            <PiArchiveBold className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between border-t border-[#DDE7F3] px-4 py-3">
              <p className="text-sm text-[#7C93AF]">
                Page {filters.page} of {Math.ceil(total / 20)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: Math.max(1, (f.page || 1) - 1),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) * 20 >= total}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: (f.page || 1) + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
