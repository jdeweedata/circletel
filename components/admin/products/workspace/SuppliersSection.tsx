'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PiArrowCounterClockwiseBold,
  PiCheckCircleBold,
  PiWarningCircleBold,
  PiXBold,
  PiClockBold,
} from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Supplier {
  id: string
  code: string
  name: string
  website_url: string | null
  feed_type: string
  is_active: boolean
  sync_status: string
  last_synced_at: string | null
  sync_error: string | null
  products_total: number
  products_active: number
  products_in_stock: number
}

const feedTypeLabels: Record<string, string> = {
  xml: 'XML Feed',
  html: 'HTML Scrape',
  xlsm: 'Excel File',
  api: 'API',
  csv: 'CSV',
}

export function SuppliersSection() {
  const { user } = useAdminAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    loadSuppliers()
  }, [])

  async function loadSuppliers() {
    try {
      const res = await fetch('/api/admin/suppliers')
      const data = await res.json()
      setSuppliers(data.data || [])
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function triggerSync(code: string) {
    setSyncing(code)
    try {
      const res = await fetch('/api/admin/suppliers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: code }),
      })
      if (res.ok) {
        setTimeout(loadSuppliers, 3000) // Refresh after sync starts
      }
    } catch (err) {
      console.error('Sync trigger failed:', err)
    } finally {
      setSyncing(null)
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
      <div className="py-20 text-center text-[#7C93AF]">Loading...</div>
    )
  }

  // Aggregate stats
  const totalProducts = suppliers.reduce(
    (sum, s) => sum + s.products_total,
    0
  )
  const totalActive = suppliers.reduce(
    (sum, s) => sum + s.products_active,
    0
  )
  const totalInStock = suppliers.reduce(
    (sum, s) => sum + s.products_in_stock,
    0
  )
  const failedSuppliers = suppliers.filter(
    (s) => s.sync_status === 'failed'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A]">
          Supplier Management
        </h1>
        <p className="mt-1 text-sm text-[#7C93AF]">
          {suppliers.length} suppliers · {totalProducts} products ·{' '}
          {totalInStock} in stock
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Total Products
            </p>
            <p className="mt-1 text-2xl font-bold text-[#1B2A4A]">
              {totalProducts.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Active Products
            </p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {totalActive.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              In Stock
            </p>
            <p className="mt-1 text-2xl font-bold text-[#E87A1E]">
              {totalInStock.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-[#7C93AF]">
              Sync Issues
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                failedSuppliers.length > 0
                  ? 'text-red-600'
                  : 'text-green-700'
              }`}
            >
              {failedSuppliers.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {failedSuppliers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <PiWarningCircleBold className="h-5 w-5 flex-none text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-700">
                Sync failures detected
              </p>
              <p className="text-xs text-red-600">
                {failedSuppliers.map((s) => s.name).join(', ')} — last
                sync failed. Check logs for details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier table */}
      <div className="overflow-hidden rounded-xl border border-[#DDE7F3] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#DDE7F3] bg-[#F9FAFB]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#7C93AF]">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#7C93AF]">
                Feed
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                Products
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                In Stock
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#7C93AF]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#7C93AF]">
                Last Sync
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase text-[#7C93AF]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE7F3]">
            {suppliers.map((s) => {
              const staleThreshold = 24 * 60 * 60 * 1000
              const isStale =
                s.last_synced_at &&
                Date.now() - new Date(s.last_synced_at).getTime() >
                  staleThreshold

              return (
                <tr key={s.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.sync_status === 'success'
                            ? 'bg-green-500'
                            : s.sync_status === 'failed'
                              ? 'bg-red-500'
                              : s.sync_status === 'syncing'
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1B2A4A]">
                          {s.name}
                        </p>
                        <p className="text-xs text-[#7C93AF]">
                          {s.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {feedTypeLabels[s.feed_type] || s.feed_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-[#31527B]">
                      {s.products_active.toLocaleString()}
                    </span>
                    <span className="ml-1 text-xs text-[#7C93AF]">
                      / {s.products_total.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.products_in_stock > 0 ? (
                      <span className="text-sm font-semibold text-green-700">
                        {s.products_in_stock.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-[#7C93AF]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.sync_status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                        <PiCheckCircleBold className="h-3.5 w-3.5" />
                        OK
                      </span>
                    ) : s.sync_status === 'failed' ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600"
                        title={s.sync_error || ''}
                      >
                        <PiXBold className="h-3.5 w-3.5" />
                        Failed
                      </span>
                    ) : s.sync_status === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600">
                        <PiClockBold className="h-3.5 w-3.5" />
                        Syncing
                      </span>
                    ) : (
                      <span className="text-xs text-[#7C93AF]">
                        {s.sync_status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      {s.last_synced_at ? (
                        <>
                          <span className="font-semibold text-[#31527B]">
                            {new Date(
                              s.last_synced_at
                            ).toLocaleDateString('en-ZA')}
                          </span>
                          <span className="ml-1 text-[#7C93AF]">
                            {new Date(
                              s.last_synced_at
                            ).toLocaleTimeString('en-ZA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#7C93AF]">Never</span>
                      )}
                      {isStale && (
                        <span className="ml-1 text-amber-600">
                          ⚠
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => triggerSync(s.code)}
                        disabled={
                          syncing === s.code ||
                          s.sync_status === 'syncing'
                        }
                      >
                        <PiArrowCounterClockwiseBold className="h-3.5 w-3.5" />
                        {syncing === s.code
                          ? 'Starting...'
                          : 'Sync Now'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products?source=hardware">
          <Card className="cursor-pointer transition hover:ring-2 hover:ring-[#E87A1E]/20">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDF2E9] text-xl">
                📦
              </span>
              <div>
                <p className="text-sm font-bold text-[#1B2A4A]">
                  Hardware Catalogue
                </p>
                <p className="text-xs text-[#7C93AF]">
                  Manage published products
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <a href="/admin/products/hardware/promote">
          <Card className="cursor-pointer transition hover:ring-2 hover:ring-[#E87A1E]/20">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl">
                ➕
              </span>
              <div>
                <p className="text-sm font-bold text-[#1B2A4A]">
                  Promote Product
                </p>
                <p className="text-xs text-[#7C93AF]">
                  Add from supplier feed
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="/products/hardware">
          <Card className="cursor-pointer transition hover:ring-2 hover:ring-[#E87A1E]/20">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl">
                🛒
              </span>
              <div>
                <p className="text-sm font-bold text-[#1B2A4A]">
                  View Store
                </p>
                <p className="text-xs text-[#7C93AF]">
                  Customer-facing pages
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  )
}
