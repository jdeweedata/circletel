'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Box,
  MapPin,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Package,
  Clock,
  Tag,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  Info,
  Home,
  Truck,
} from 'lucide-react'
import { SupplierProduct, Supplier } from '@/lib/suppliers/types'

interface ProductWithDetails extends SupplierProduct {
  supplier: Pick<Supplier, 'id' | 'name' | 'code' | 'website_url'> | null
  image_url: string | null
  margin_amount: number | null
  margin_percentage: number | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = React.useState<ProductWithDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const productId = Array.isArray(params.id) ? params.id[0] : params.id

  React.useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/suppliers/products/${productId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to fetch product')
        return
      }

      if (result.success) {
        setProduct(result.data)
      } else {
        setError(result.error || 'Failed to fetch product')
      }
    } catch (err) {
      console.error('Failed to fetch product:', err)
      setError('Failed to load product details')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-'
    return `R${price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return formatDate(dateString)
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Admin
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Suppliers
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers/products">Product Catalog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Loading...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Admin
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Suppliers
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers/products">Product Catalog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Error</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/suppliers/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push('/admin/suppliers/products')}>
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No product found
  if (!product) {
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Admin
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Suppliers
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/suppliers/products">Product Catalog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not Found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/suppliers/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Product not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const priceChanged = product.previous_cost_price !== null && product.cost_price !== product.previous_cost_price
  const priceIncreased = priceChanged && (product.cost_price || 0) > (product.previous_cost_price || 0)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Admin
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/suppliers" className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Suppliers
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/suppliers/products">Product Catalog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate">{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/suppliers/products')}
            className="mt-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <code className="bg-gray-100 px-2 py-0.5 rounded">{product.sku}</code>
              {product.supplier && (
                <>
                  <span>•</span>
                  <Link
                    href={`/admin/suppliers/${product.supplier.id}`}
                    className="text-orange-600 hover:underline flex items-center gap-1"
                  >
                    {product.supplier.name}
                    <Badge variant="secondary" className="font-mono text-xs ml-1">
                      {product.supplier.code}
                    </Badge>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 ml-12 md:ml-0">
          {product.is_active ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </Badge>
          )}
          {product.is_discontinued && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Discontinued
            </Badge>
          )}
          {product.in_stock ? (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <Package className="w-3 h-3 mr-1" />
              In Stock ({product.stock_total})
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              <Package className="w-3 h-3 mr-1" />
              Out of Stock
            </Badge>
          )}
          {product.product_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View at Supplier
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Product Image */}
            <Card>
              <CardContent className="pt-6">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center')
                        const icon = document.createElement('div')
                        icon.innerHTML = '<svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                        target.parentElement?.appendChild(icon)
                      }}
                    />
                  ) : (
                    <Box className="w-16 h-16 text-gray-300" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Core Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-gray-400" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-900">{product.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Manufacturer
                    </label>
                    <p className="mt-1 text-gray-900">{product.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <p className="mt-1 text-gray-900">
                      {product.category || '-'}
                      {product.subcategory && (
                        <span className="text-gray-500"> / {product.subcategory}</span>
                      )}
                    </p>
                  </div>
                </div>

                {product.supplier && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Link
                        href={`/admin/suppliers/${product.supplier.id}`}
                        className="text-orange-600 hover:underline"
                      >
                        {product.supplier.name}
                      </Link>
                      {product.supplier.website_url && (
                        <a
                          href={product.supplier.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing and Stock Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Cost Price</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{formatPrice(product.cost_price)}</span>
                      {priceChanged && (
                        <span className={`flex items-center text-sm ${priceIncreased ? 'text-red-500' : 'text-green-500'}`}>
                          {priceIncreased ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          from {formatPrice(product.previous_cost_price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Retail Price</span>
                    <span className="text-xl font-semibold">{formatPrice(product.retail_price)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Margin</span>
                    <div className="text-right">
                      {product.margin_amount !== null ? (
                        <>
                          <span className="text-lg font-semibold text-green-600">
                            {formatPrice(product.margin_amount)}
                          </span>
                          {product.margin_percentage !== null && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({product.margin_percentage.toFixed(1)}%)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Stock by Branch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Cape Town', value: product.stock_cpt, key: 'cpt' },
                    { label: 'Johannesburg', value: product.stock_jhb, key: 'jhb' },
                    { label: 'Durban', value: product.stock_dbn, key: 'dbn' },
                  ].map((branch) => (
                    <div key={branch.key} className="flex items-center justify-between">
                      <span className="text-gray-600">{branch.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              branch.value > 0 ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            style={{
                              width: `${Math.min((branch.value / Math.max(product.stock_total, 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className={`font-medium w-12 text-right ${branch.value > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                          {branch.value}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium text-gray-900">Total Stock</span>
                    <div className="flex items-center gap-2">
                      {product.in_stock ? (
                        <Badge className="bg-green-100 text-green-700">
                          {product.stock_total} units
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-600">
                          Out of Stock
                        </Badge>
                      )}
                      {product.previous_stock_total !== null && product.stock_total !== product.previous_stock_total && (
                        <span className="text-xs text-gray-400">
                          (was {product.previous_stock_total})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-400" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell>{String(value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="w-8 h-8 mx-auto mb-2" />
                    <p>No specifications available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                {product.features && product.features.length > 0 ? (
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No features listed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sync Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                  Sync Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Synced</span>
                  <span className="font-medium">{formatRelativeTime(product.last_synced_at)}</span>
                </div>
                {product.last_synced_at && (
                  <div className="text-sm text-gray-400">
                    {formatDate(product.last_synced_at)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{formatDate(product.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">{formatDate(product.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Raw Metadata */}
          {product.metadata && Object.keys(product.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raw Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(product.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
