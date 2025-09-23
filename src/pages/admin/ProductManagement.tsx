import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useProductsRealtime } from '@/hooks/useRealtimeSync'

interface Product {
  id: string
  name: string
  slug: string
  category: 'business_fibre' | 'fixed_wireless_business' | 'fixed_wireless_residential'
  service_type: string
  speed_down: number
  speed_up: number
  status: 'draft' | 'pending' | 'approved' | 'archived'
  is_featured: boolean
  created_at: string
  updated_at: string
  pricing?: {
    price_regular: number
    price_promo?: number
    approval_status: 'pending' | 'approved' | 'rejected'
  }[]
}

export function ProductManagement() {
  const { canEdit, canApprove } = useAdminAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: products, isLoading, error, refresh, lastUpdated } = useProductsRealtime(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')

  // Fallback mock data if no products are loaded
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'BizFibre Connect Lite',
      slug: 'bizfibre-connect-lite',
      category: 'business_fibre',
      service_type: 'Fibre',
      speed_down: 10,
      speed_up: 10,
      status: 'approved',
      is_featured: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      pricing: [{
        price_regular: 1699,
        approval_status: 'approved'
      }]
    },
    {
      id: '2',
      name: 'BizFibre Connect Ultra',
      slug: 'bizfibre-connect-ultra',
      category: 'business_fibre',
      service_type: 'Fibre',
      speed_down: 200,
      speed_up: 200,
      status: 'pending',
      is_featured: true,
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      pricing: [{
        price_regular: 4373,
        approval_status: 'pending'
      }]
    },
    {
      id: '3',
      name: 'SkyFibre SMB Essential',
      slug: 'skyfibre-smb-essential',
      category: 'fixed_wireless_business',
      service_type: 'Fixed Wireless',
      speed_down: 50,
      speed_up: 50,
      status: 'approved',
      is_featured: false,
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      pricing: [{
        price_regular: 1899,
        price_promo: 1299,
        approval_status: 'approved'
      }]
    },
    {
      id: '4',
      name: 'SkyFibre Home Lite',
      slug: 'skyfibre-home-lite',
      category: 'fixed_wireless_residential',
      service_type: 'Fixed Wireless',
      speed_down: 50,
      speed_up: 50,
      status: 'draft',
      is_featured: false,
      created_at: '2024-01-22T11:20:00Z',
      updated_at: '2024-01-22T11:20:00Z',
      pricing: [{
        price_regular: 899,
        price_promo: 799,
        approval_status: 'pending'
      }]
    }
  ]

  // Use mock data if no real data is available
  const displayProducts = products.length > 0 ? products : mockProducts

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value)
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', value)
    }
    setSearchParams(newParams)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Edit },
      pending: { label: 'Pending', variant: 'default' as const, icon: Clock },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      archived: { label: 'Archived', variant: 'outline' as const, icon: Archive }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      business_fibre: 'Business Fibre',
      fixed_wireless_business: 'Fixed Wireless Business',
      fixed_wireless_residential: 'Fixed Wireless Residential'
    }
    return labels[category as keyof typeof labels] || category
  }

  const filteredProducts = displayProducts.filter(product => {
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.service_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDuplicateProduct = (productId: string) => {
    console.log('Duplicate product:', productId)
    // Implement duplication logic
  }

  const handleArchiveProduct = (productId: string) => {
    console.log('Archive product:', productId)
    // Implement archival logic
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalogue and pricing
            {lastUpdated && (
              <span className="text-xs text-gray-500 ml-2">
                • Last synced {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
          {error && (
            <div className="flex items-center space-x-2 mt-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Sync error: {error}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {canEdit() && (
            <Button asChild>
              <Link to="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="business_fibre">Business Fibre</SelectItem>
                <SelectItem value="fixed_wireless_business">Fixed Wireless Business</SelectItem>
                <SelectItem value="fixed_wireless_residential">Fixed Wireless Residential</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No products found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {product.name}
                              {product.is_featured && (
                                <Badge variant="secondary" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.service_type}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getCategoryLabel(product.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {product.speed_down === product.speed_up
                            ? `${product.speed_down} Mbps`
                            : `${product.speed_down}/${product.speed_up} Mbps`
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.pricing?.[0] && (
                          <div className="text-sm">
                            <div className="font-medium">
                              R{product.pricing[0].price_regular.toLocaleString()}
                            </div>
                            {product.pricing[0].price_promo && (
                              <div className="text-green-600">
                                Promo: R{product.pricing[0].price_promo.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/products/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {canEdit() && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/products/${product.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicateProduct(product.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canApprove() && product.status !== 'archived' && (
                              <DropdownMenuItem
                                onClick={() => handleArchiveProduct(product.id)}
                                className="text-red-600"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}