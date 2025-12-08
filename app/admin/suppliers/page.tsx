'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  Box,
  TrendingUp,
} from 'lucide-react'
import { SupplierWithStats, SyncStatus } from '@/lib/suppliers/types'

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = React.useState<SupplierWithStats[]>([])
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/suppliers')
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (supplierId: string) => {
    try {
      setSyncing(supplierId)
      const response = await fetch(`/api/admin/suppliers/${supplierId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cache_images: true }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh suppliers list
        await fetchSuppliers()
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setSyncing(null)
    }
  }

  const getSyncStatusBadge = (status: SyncStatus, error: string | null) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        )
      case 'syncing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" title={error || 'Sync failed'}>
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Calculate totals
  const totals = suppliers.reduce(
    (acc, s) => ({
      products: acc.products + (s.total_products || 0),
      inStock: acc.inStock + (s.in_stock_products || 0),
      active: acc.active + (s.active_products || 0),
    }),
    { products: 0, inStock: 0, active: 0 }
  )

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">
            Manage equipment suppliers and product catalogs
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => router.push('/admin/suppliers/products')}>
            <Package className="w-4 h-4 mr-2" />
            View All Products
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Suppliers</CardDescription>
            <CardTitle className="text-3xl">{suppliers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <Truck className="w-4 h-4 mr-1" />
              Active suppliers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{totals.products.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <Box className="w-4 h-4 mr-1" />
              Across all suppliers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Stock</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totals.inStock.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 mr-1" />
              Products available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Products</CardDescription>
            <CardTitle className="text-3xl">{totals.active.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="w-4 h-4 mr-1" />
              Currently listed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>
            Click on a supplier to view products and manage settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading suppliers...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No suppliers configured yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/suppliers/${supplier.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                              {supplier.code}
                            </span>
                            {supplier.website_url && (
                              <ExternalLink className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.total_products?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500">
                        {supplier.active_products?.toLocaleString() || 0} active
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {supplier.in_stock_products?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {supplier.total_stock_units?.toLocaleString() || 0} units
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.min_price && supplier.max_price ? (
                        <div className="text-sm">
                          R{supplier.min_price.toLocaleString()} - R{supplier.max_price.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatLastSync(supplier.last_synced_at)}</div>
                    </TableCell>
                    <TableCell>
                      {getSyncStatusBadge(supplier.sync_status as SyncStatus, supplier.sync_error)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={syncing === supplier.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSync(supplier.id)
                        }}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${syncing === supplier.id ? 'animate-spin' : ''}`} />
                        {syncing === supplier.id ? 'Syncing...' : 'Sync'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
