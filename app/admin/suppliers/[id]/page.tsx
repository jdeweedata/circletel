'use client'
import { PiArrowLeftBold, PiArrowSquareOutBold, PiArrowsClockwiseBold, PiCheckCircleBold, PiClockBold, PiCubeBold, PiMagnifyingGlassBold, PiMapPinBold, PiPackageBold, PiSparkleBold, PiSpinnerBold, PiTrendDownBold, PiTrendUpBold, PiWarningCircleBold } from 'react-icons/pi';

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Supplier, SupplierProduct, SupplierSyncLog, SyncStatus } from '@/lib/suppliers/types'

interface SupplierDetailData extends Supplier {
  stats: {
    total_products: number
    active_products: number
    in_stock_products: number
  }
  recent_sync_logs: SupplierSyncLog[]
}

export default function SupplierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params.id as string

  const [supplier, setSupplier] = React.useState<SupplierDetailData | null>(null)
  const [products, setProducts] = React.useState<SupplierProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [productsLoading, setProductsLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [enriching, setEnriching] = React.useState(false)
  const [enrichmentStats, setEnrichmentStats] = React.useState<{
    total: number
    enriched: number
    pending: number
    cost_estimate?: { estimated_tokens: number; estimated_cost_usd: number }
  } | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [stockFilter, setStockFilter] = React.useState('all')
  const [manufacturerFilter, setManufacturerFilter] = React.useState('all')
  const [manufacturers, setManufacturers] = React.useState<string[]>([])
  const [page, setPage] = React.useState(1)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const perPage = 25

  React.useEffect(() => {
    fetchSupplier()
    fetchManufacturers()
    fetchEnrichmentStats()
  }, [supplierId])

  React.useEffect(() => {
    fetchProducts()
  }, [supplierId, searchQuery, stockFilter, manufacturerFilter, page])

  const fetchSupplier = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/suppliers/${supplierId}`)
      const result = await response.json()

      if (result.success) {
        setSupplier(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const params = new URLSearchParams({
        supplier_id: supplierId,
        page: page.toString(),
        per_page: perPage.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)
      if (stockFilter !== 'all') params.append('in_stock', stockFilter)
      if (manufacturerFilter !== 'all') params.append('manufacturer', manufacturerFilter)

      const response = await fetch(`/api/admin/suppliers/products?${params}`)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data || [])
        setTotalProducts(result.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchManufacturers = async () => {
    try {
      const response = await fetch(`/api/admin/suppliers/products?supplier_id=${supplierId}`, {
        method: 'OPTIONS',
      })
      const result = await response.json()
      if (result.success) {
        setManufacturers(result.data?.manufacturers || [])
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error)
    }
  }

  const fetchEnrichmentStats = async () => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/enrich`)
      const result = await response.json()
      if (result.success) {
        setEnrichmentStats(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch enrichment stats:', error)
    }
  }

  const handleEnrich = async () => {
    if (!confirm('This will use AI to enrich product data. Estimated cost shown in the stats card. Continue?')) {
      return
    }

    try {
      setEnriching(true)
      const response = await fetch(`/api/admin/suppliers/${supplierId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'missing' }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Enrichment complete!\n\nEnriched: ${result.data.enriched}\nFailed: ${result.data.failed}\nDuration: ${(result.data.duration_ms / 1000).toFixed(1)}s`)
        await fetchEnrichmentStats()
        await fetchProducts()
      } else {
        alert(`Enrichment failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Enrichment failed:', error)
      alert('Enrichment failed. Please try again.')
    } finally {
      setEnriching(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`/api/admin/suppliers/${supplierId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cache_images: true }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSupplier()
        await fetchProducts()
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const getSyncStatusBadge = (status: SyncStatus, error: string | null) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <PiCheckCircleBold className="w-3 h-3 mr-1" />
            Success
          </Badge>
        )
      case 'syncing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <PiArrowsClockwiseBold className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" title={error || ''}>
            <PiWarningCircleBold className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <PiClockBold className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '-'
    return `R${price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-ZA')
  }

  const totalPages = Math.ceil(totalProducts / perPage)

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <PiArrowsClockwiseBold className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading supplier...</span>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <PiWarningCircleBold className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Supplier not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/suppliers')}>
            <PiArrowLeftBold className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/suppliers')}>
            <PiArrowLeftBold className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              <Badge variant="secondary" className="font-mono">{supplier.code}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              {supplier.website_url && (
                <a
                  href={supplier.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-orange-600"
                >
                  <PiArrowSquareOutBold className="w-3 h-3 mr-1" />
                  Website
                </a>
              )}
              {supplier.contact_email && (
                <span>{supplier.contact_email}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            disabled={enriching || !enrichmentStats?.pending}
            onClick={handleEnrich}
            title={enrichmentStats?.pending ? `Enrich ${enrichmentStats.pending} products` : 'All products enriched'}
          >
            {enriching ? (
              <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PiSparkleBold className="w-4 h-4 mr-2" />
            )}
            {enriching ? 'Enriching...' : 'AI Enrich'}
          </Button>
          <Button
            variant="default"
            className="bg-orange-500 hover:bg-orange-600"
            disabled={syncing}
            onClick={handleSync}
          >
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Products'}
          </Button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Column (Left - 75%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Products Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    {totalProducts.toLocaleString()} products from {supplier.name}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="true">In Stock</SelectItem>
                      <SelectItem value="false">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={manufacturerFilter} onValueChange={(v) => { setManufacturerFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Manufacturers</SelectItem>
                      {manufacturers.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <PiArrowsClockwiseBold className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <PiPackageBold className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No products found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Retail Price</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.cached_image_path || product.source_image_url ? (
                                <img
                                  src={product.cached_image_path
                                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/supplier-images/${product.cached_image_path}`
                                    : product.source_image_url || ''}
                                  alt={product.name}
                                  className="w-10 h-10 object-contain rounded bg-gray-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.png'
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <PiCubeBold className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="max-w-[300px]">
                                <div className="font-medium truncate">{product.name}</div>
                                {product.category && (
                                  <div className="text-xs text-gray-500">{product.category}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{product.sku}</code>
                          </TableCell>
                          <TableCell>{product.manufacturer || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(product.cost_price)}
                            {product.previous_cost_price && product.cost_price !== product.previous_cost_price && (
                              <span className={`ml-1 text-xs ${product.cost_price! > product.previous_cost_price ? 'text-red-500' : 'text-green-500'}`}>
                                {product.cost_price! > product.previous_cost_price ? <PiTrendUpBold className="w-3 h-3 inline" /> : <PiTrendDownBold className="w-3 h-3 inline" />}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(product.retail_price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {product.in_stock ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {product.stock_total}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Out
                                </Badge>
                              )}
                              <div className="text-xs text-gray-400" title="CPT / JHB / DBN">
                                <PiMapPinBold className="w-3 h-3 inline mr-0.5" />
                                {product.stock_cpt}/{product.stock_jhb}/{product.stock_dbn}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalProducts)} of {totalProducts}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Sync Logs */}
          {supplier.recent_sync_logs && supplier.recent_sync_logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Found</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.recent_sync_logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.started_at)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              log.status === 'completed'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : log.status === 'failed'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.products_found}</TableCell>
                        <TableCell className="text-green-600">+{log.products_created}</TableCell>
                        <TableCell className="text-blue-600">{log.products_updated}</TableCell>
                        <TableCell>{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column (Right - 25%) */}
        <div className="space-y-6">
          {/* Supplier Overview Card */}
          <Card>
             <CardHeader className="pb-4">
               <CardTitle>Overview</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <p className="text-sm text-gray-500">Total Products</p>
                 <p className="text-2xl font-bold">{supplier.stats.total_products.toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Active Products</p>
                 <p className="text-2xl font-bold">{supplier.stats.active_products.toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">In Stock</p>
                 <p className="text-2xl font-bold text-green-600">{supplier.stats.in_stock_products.toLocaleString()}</p>
               </div>
               <div className="pt-4 border-t border-gray-100">
                 <p className="text-sm text-gray-500 mb-2">Sync Status</p>
                 <div className="flex flex-col gap-1">
                   <div>{getSyncStatusBadge(supplier.sync_status as SyncStatus, supplier.sync_error)}</div>
                   <span className="text-xs text-gray-400">Last sync: {formatDate(supplier.last_synced_at)}</span>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Enrichment Stats Card */}
          {enrichmentStats && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PiSparkleBold className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-lg">AI Enrichment</CardTitle>
                    </div>
                  </div>
                  {enrichmentStats.pending > 0 && enrichmentStats.cost_estimate && (
                    <Badge variant="outline" className="w-fit bg-purple-100 text-purple-700 border-purple-300">
                      Est. ${enrichmentStats.cost_estimate.estimated_cost_usd.toFixed(2)} USD
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-purple-200/50 pb-4">
                  <div>
                    <p className="text-sm text-gray-500">Enriched</p>
                    <p className="text-2xl font-bold text-green-600">{enrichmentStats.enriched}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{enrichmentStats.pending}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 font-medium">Global Progress</span>
                    <span className="font-bold text-purple-600">
                      {enrichmentStats.total > 0
                        ? Math.round((enrichmentStats.enriched / enrichmentStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  {enrichmentStats.total > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${(enrichmentStats.enriched / enrichmentStats.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
