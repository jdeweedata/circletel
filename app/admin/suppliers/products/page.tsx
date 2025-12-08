'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
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
import {
  ArrowLeft,
  RefreshCw,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Package,
  Box,
  Download,
} from 'lucide-react'
import { SupplierProduct, Supplier } from '@/lib/suppliers/types'

interface ProductWithSupplier extends SupplierProduct {
  supplier?: Pick<Supplier, 'id' | 'name' | 'code'>
}

export default function AllProductsPage() {
  const router = useRouter()
  const [products, setProducts] = React.useState<ProductWithSupplier[]>([])
  const [suppliers, setSuppliers] = React.useState<Pick<Supplier, 'id' | 'name' | 'code'>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [supplierFilter, setSupplierFilter] = React.useState('all')
  const [stockFilter, setStockFilter] = React.useState('all')
  const [manufacturerFilter, setManufacturerFilter] = React.useState('all')
  const [sortBy, setSortBy] = React.useState('name_asc')
  const [manufacturers, setManufacturers] = React.useState<string[]>([])
  const [page, setPage] = React.useState(1)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const perPage = 50

  React.useEffect(() => {
    fetchSuppliers()
    fetchManufacturers()
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [searchQuery, supplierFilter, stockFilter, manufacturerFilter, sortBy, page])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers')
      const result = await response.json()
      if (result.success) {
        setSuppliers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchManufacturers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers/products', {
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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
      })

      if (searchQuery) params.append('search', searchQuery)
      if (supplierFilter !== 'all') params.append('supplier_id', supplierFilter)
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
      setLoading(false)
    }
  }

  const handleExport = async () => {
    // Build CSV content
    const headers = ['SKU', 'Name', 'Manufacturer', 'Supplier', 'Cost Price', 'Retail Price', 'Stock CPT', 'Stock JHB', 'Stock DBN', 'Total Stock']
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.manufacturer || ''}"`,
        `"${p.supplier?.name || ''}"`,
        p.cost_price || 0,
        p.retail_price || 0,
        p.stock_cpt,
        p.stock_jhb,
        p.stock_dbn,
        p.stock_total,
      ].join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `supplier-products-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '-'
    return `R${price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const totalPages = Math.ceil(totalProducts / perPage)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/suppliers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Supplier Products</h1>
            <p className="text-gray-500 mt-1">
              {totalProducts.toLocaleString()} products across {suppliers.length} suppliers
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={handleExport} disabled={products.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products, SKU, manufacturer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select value={supplierFilter} onValueChange={(v) => { setSupplierFilter(v); setPage(1) }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
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
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="price_asc">Price (Low-High)</SelectItem>
                <SelectItem value="price_desc">Price (High-Low)</SelectItem>
                <SelectItem value="stock_desc">Stock (High-Low)</SelectItem>
                <SelectItem value="updated_desc">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No products found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Retail Price</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/admin/suppliers/products/${product.id}`)}
                    >
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
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Box className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="max-w-[250px]">
                            <div className="font-medium truncate" title={product.name}>{product.name}</div>
                            {product.category && (
                              <div className="text-xs text-gray-500">{product.category}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{product.sku}</code>
                      </TableCell>
                      <TableCell>
                        {product.supplier ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {product.supplier.code}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{product.manufacturer || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(product.cost_price)}
                        {product.previous_cost_price && product.cost_price !== product.previous_cost_price && (
                          <span className={`ml-1 text-xs ${product.cost_price! > product.previous_cost_price ? 'text-red-500' : 'text-green-500'}`}>
                            {product.cost_price! > product.previous_cost_price ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
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
                            <MapPin className="w-3 h-3 inline mr-0.5" />
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
                    Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalProducts)} of {totalProducts.toLocaleString()}
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
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-8"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
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
    </div>
  )
}
