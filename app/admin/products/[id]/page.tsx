'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/lib/types/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { ProviderLogo } from '@/components/products/ProviderLogo';
import {
  ArrowLeft,
  Edit,
  Archive,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  History,
  Package,
  Star,
  TrendingUp,
  Calendar,
  User,
  FileText,
  Wifi,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PriceEditModal } from '@/components/admin/products/PriceEditModal';
import { AuditHistoryModal } from '@/components/admin/products/AuditHistoryModal';

import { ProductLifecycleStepper } from '@/components/admin/products/ProductLifecycleStepper';
import { ProductLifecycleActions } from '@/components/admin/products/ProductLifecycleActions';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = usePermissions();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceEditModalOpen, setPriceEditModalOpen] = useState(false);
  const [auditHistoryModalOpen, setAuditHistoryModalOpen] = useState(false);

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/products/${productId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      setProduct(data.data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, isActive: boolean) => {
    if (!product) return;

    try {
      // Map UI status to API/DB status logic
      // 'publish' action -> status: active, is_active: true
      // 'deactivate' action -> status: active, is_active: false
      // 'reactivate' action -> status: active, is_active: true
      // 'restore' action -> status: draft, is_active: false (or true? usually false for draft)
      
      // The component passes generic status strings, we need to map them or accept them
      // The component passes (newStatus, isActive).
      // If newStatus is 'active' and isActive is true -> Activate
      
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'admin@circletel.co.za',
          'x-user-name': 'Admin User'
        },
        body: JSON.stringify({
          status: newStatus === 'draft' ? 'draft' : product.status, // Only change status enum if moving to/from draft/archived
          is_active: isActive,
          change_reason: `Lifecycle status change to ${newStatus} (Active: ${isActive}) by admin`
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchProduct();
      } else {
        setError(data.error || 'Failed to update product status');
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating product status:', err);
      setError('Failed to update product status');
      alert('Failed to update product status');
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': 'admin@circletel.co.za',
          'x-user-name': 'Admin User'
        }
      });

      const data = await response.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        setError(data.error || 'Failed to archive product');
      }
    } catch (err) {
      console.error('Error archiving product:', err);
      setError('Failed to archive product');
    }
  };

  const handlePriceSave = async (productId: string, updates: { base_price_zar: number; cost_price_zar: number; change_reason: string }) => {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@circletel.co.za',
        'x-user-name': 'Admin User'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update price');
    }

    await fetchProduct();
  };

  const formatPrice = (priceStr: string | number) => {
    const price = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusBadge = () => {
    if (!product) return null;

    if (!product.is_active && product.status === 'active') {
      return <Badge variant="secondary" className="text-sm bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
    }

    switch (product.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-sm border-green-200">Active</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-50 text-yellow-800 text-sm border-yellow-200">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-red-50 text-red-800 text-sm border-red-200">Archived</Badge>;
      default:
        return <Badge variant="outline" className="capitalize text-sm">{product.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
              <Button asChild>
                <Link href="/admin/products">Return to Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const providerCode = product.metadata?.provider_code || product.metadata?.provider || '';
  const providerName = product.metadata?.provider_name || providerCode;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto pb-10 bg-gray-50/50">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            {/* Back Button */}
            <Link
              href="/admin/products"
              className="mt-1 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title="Back to Products"
            >
              <ArrowLeft size={24} />
            </Link>

            {/* Product ID and Status */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                SKU: <span className="font-mono text-gray-700">{product.sku}</span>
                <span className="text-gray-300">|</span>
                Created {new Date(product.created_at).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {/* Action Buttons */}
              <div className="mt-4">
                <ProductLifecycleActions
                  product={product}
                  onStatusChange={handleStatusChange}
                  onEdit={() => router.push(`/admin/products/${product.id}/edit`)}
                  onArchive={() => setDeleteDialogOpen(true)}
                  onViewHistory={() => setAuditHistoryModalOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <Card className="shadow-sm overflow-hidden border-gray-200">
          <div className="p-6">
            <ProductLifecycleStepper product={product} />
          </div>
        </Card>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-2">{getStatusBadge()}</div>
                </div>
                {product.is_active ? (
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-gray-100 rounded-full">
                    <XCircle className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-lg font-bold text-gray-900 capitalize mt-1">{product.category}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {product.is_featured && (
            <Card className="shadow-sm border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Featured</p>
                    <p className="text-lg font-bold text-yellow-900 mt-1">Yes</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Star className="h-5 w-5 text-yellow-600 fill-current" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {product.is_popular && (
            <Card className="shadow-sm border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Popular</p>
                    <p className="text-lg font-bold text-green-900 mt-1">Yes</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 border border-gray-200 rounded-lg shadow-sm h-auto grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Pricing & Costs</TabsTrigger>
            <TabsTrigger value="technical" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Technical Details</TabsTrigger>
            <TabsTrigger value="metadata" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Metadata</TabsTrigger>
          </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerCode && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Provider</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                      <ProviderLogo
                        providerCode={providerCode}
                        providerName={providerName}
                        variant="grayscale"
                        size="small"
                        priority={false}
                      />
                      <span className="font-medium">{providerName}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Description</Label>
                  <p className="mt-2 text-gray-900">{product.description || 'No description available'}</p>
                </div>

                {product.service_type && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Service Type</Label>
                    <Badge variant="outline" className="mt-2">{product.service_type}</Badge>
                  </div>
                )}

                {product.metadata?.features && Array.isArray(product.metadata.features) && product.metadata.features.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Features</Label>
                    <ul className="mt-2 space-y-2">
                      {product.metadata.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-900">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(product.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(product.updated_at).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {product.metadata?.contract_months && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4" />
                        Contract Duration
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.metadata.contract_months} months
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-circleTel-orange" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="text-sm text-gray-600">Base Price</p>
                    <p className="text-3xl font-bold text-circleTel-orange">
                      {formatPrice(product.base_price_zar)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">per month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Cost Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(product.cost_price_zar)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">wholesale cost</p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatPrice(parseFloat(product.base_price_zar) - parseFloat(product.cost_price_zar))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((parseFloat(product.base_price_zar) - parseFloat(product.cost_price_zar)) / parseFloat(product.base_price_zar) * 100).toFixed(1)}% margin
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing History</CardTitle>
                <CardDescription>View all price changes for this product</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAuditHistoryModalOpen(true)}
                >
                  <History className="mr-2 h-4 w-4" />
                  View Full History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Details Tab */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-600" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.pricing?.download_speed && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                      <Download className="h-4 w-4" />
                      Download Speed
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      {product.pricing.download_speed}
                      <span className="text-lg font-medium ml-1">Mbps</span>
                    </p>
                  </div>
                )}

                {product.pricing?.upload_speed && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-sm text-green-900 mb-2">
                      <Upload className="h-4 w-4" />
                      Upload Speed
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {product.pricing.upload_speed}
                      <span className="text-lg font-medium ml-1">Mbps</span>
                    </p>
                  </div>
                )}

                {product.pricing?.data_cap && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900 mb-2">Data Cap</p>
                    <p className="text-2xl font-bold text-purple-900">{product.pricing.data_cap}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Metadata</CardTitle>
              <CardDescription>Additional product information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 py-2 border-b">
                  <span className="font-semibold text-gray-700">Field</span>
                  <span className="font-semibold text-gray-700 col-span-2">Value</span>
                </div>
                {product.metadata && Object.entries(product.metadata).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-gray-900 col-span-2 font-mono">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{product.name}&quot;? This will set the
              product status to archived and make it inactive. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Archive Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Edit Modal */}
      {product && (
        <PriceEditModal
          product={product}
          open={priceEditModalOpen}
          onClose={() => setPriceEditModalOpen(false)}
          onSave={handlePriceSave}
        />
      )}

      {/* Audit History Modal */}
      {product && (
        <AuditHistoryModal
          productId={product.id}
          productName={product.name}
          open={auditHistoryModalOpen}
          onClose={() => setAuditHistoryModalOpen(false)}
        />
      )}
      </div>
    </main>
  );
}
