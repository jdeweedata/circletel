'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Smartphone,
  CreditCard,
  Signal,
  Calendar,
  DollarSign,
  Package,
  Calculator,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Wifi,
  MessageSquare,
  Phone,
  Gift,
  FileText,
  ExternalLink,
  Copy,
  RefreshCw,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  MTNDealerProduct,
  MTN_COMMISSION_TIERS,
  calculateCommission,
} from '@/lib/types/mtn-dealer-products';

// Format currency
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Check if deal is currently active
const isDealActive = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return false;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

// Detail row component
function DetailRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    archived: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <Badge variant="outline" className={variants[status] || variants.inactive}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Device status badge
function DeviceStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400">-</span>;

  const variants: Record<string, string> = {
    'Available': 'bg-green-100 text-green-700',
    'Out of Stock': 'bg-red-100 text-red-700',
    'EOL': 'bg-gray-100 text-gray-700',
    'CTB': 'bg-blue-100 text-blue-700',
  };

  return (
    <Badge variant="outline" className={variants[status] || 'bg-gray-100 text-gray-700'}>
      {status}
    </Badge>
  );
}

// Technology badge
function TechnologyBadge({ technology }: { technology: string }) {
  const variants: Record<string, string> = {
    '5G': 'bg-purple-100 text-purple-700 border-purple-200',
    'LTE/5G': 'bg-blue-100 text-blue-700 border-blue-200',
    'LTE': 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <Badge variant="outline" className={variants[technology] || variants.LTE}>
      <Signal className="h-3 w-3 mr-1" />
      {technology}
    </Badge>
  );
}

export default function MTNDealerProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<MTNDealerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch product
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/mtn-dealer-products/${productId}`);
      const result = await response.json();

      if (result.success) {
        setProduct(result.data);
      } else {
        setError(result.error || 'Failed to load product');
      }
    } catch (err) {
      setError('Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Calculate commission for this product
  const commission = useMemo(() => {
    if (!product) return null;
    return calculateCommission(
      parseFloat(String(product.mtn_price_incl_vat)),
      product.contract_term,
      1,
      parseFloat(String(product.circletel_commission_share))
    );
  }, [product]);

  // Check if deal is currently active
  const isCurrentDeal = useMemo(() => {
    if (!product) return false;
    return isDealActive(product.promo_start_date, product.promo_end_date);
  }, [product]);

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/mtn-dealer-products/${productId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        router.push('/admin/mtn-dealer-products');
      } else {
        setError(result.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">{error || 'Product not found'}</p>
              <Link href="/admin/mtn-dealer-products" className="mt-4">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/admin/mtn-dealer-products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.price_plan}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="font-mono">{product.deal_id}</span>
                <button
                  onClick={() => copyToClipboard(product.deal_id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchProduct}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/admin/mtn-dealer-products/${productId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <StatusBadge status={product.status} />
            <TechnologyBadge technology={product.technology} />
            {product.has_device ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Smartphone className="h-3 w-3 mr-1" />
                With Device
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                <CreditCard className="h-3 w-3 mr-1" />
                SIM Only
              </Badge>
            )}
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {product.contract_term_label}
            </Badge>
            {isCurrentDeal ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Current Deal
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                <Clock className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
            <div className="ml-auto">
              <span className="text-2xl font-bold text-circleTel-orange">
                {formatCurrency(product.mtn_price_incl_vat)}
              </span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Commission</TabsTrigger>
          <TabsTrigger value="bundles">Bundles & Benefits</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-circleTel-orange" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Deal ID" value={product.deal_id} />
                <Separator />
                <DetailRow label="Price Plan" value={product.price_plan} />
                <Separator />
                <DetailRow label="Package Description" value={product.package_description || '-'} />
                <Separator />
                <DetailRow label="Tariff Description" value={product.tariff_description || '-'} />
                <Separator />
                <DetailRow label="Eppix Package" value={product.eppix_package || '-'} />
                <Separator />
                <DetailRow label="Eppix Tariff" value={product.eppix_tariff || '-'} />
                <Separator />
                <DetailRow label="Technology" value={<TechnologyBadge technology={product.technology} />} />
                <Separator />
                <DetailRow label="Contract Term" value={product.contract_term_label} />
              </CardContent>
            </Card>

            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-circleTel-orange" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow
                  label="Has Device"
                  value={product.has_device ? (
                    <Badge className="bg-green-100 text-green-700">Yes</Badge>
                  ) : (
                    <Badge variant="outline">SIM Only</Badge>
                  )}
                />
                {product.has_device && (
                  <>
                    <Separator />
                    <DetailRow label="Device Name" value={product.device_name || '-'} />
                    <Separator />
                    <DetailRow
                      label="Device Status"
                      value={<DeviceStatusBadge status={product.device_status} />}
                    />
                    <Separator />
                    <DetailRow
                      label="Once-off Pay-in"
                      value={formatCurrency(product.once_off_pay_in_incl_vat)}
                    />
                  </>
                )}
                <Separator />
                <DetailRow
                  label="Inventory Status"
                  value={product.inventory_status || '-'}
                />
              </CardContent>
            </Card>

            {/* Deal Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-circleTel-orange" />
                  Deal Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Promo Start Date" value={formatDate(product.promo_start_date)} />
                <Separator />
                <DetailRow label="Promo End Date" value={formatDate(product.promo_end_date)} />
                <Separator />
                <DetailRow
                  label="Deal Status"
                  value={isCurrentDeal ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100">
                      <XCircle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                />
              </CardContent>
            </Card>

            {/* Channel Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-circleTel-orange" />
                  Channel Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Channel" value={product.channel || '-'} />
                <Separator />
                <DetailRow
                  label="Available on Helios"
                  value={product.available_on_helios ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                />
                <Separator />
                <DetailRow
                  label="Available on iLula"
                  value={product.available_on_ilula ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-circleTel-orange" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="MTN Price (Incl. VAT)" value={formatCurrency(product.mtn_price_incl_vat)} />
                <Separator />
                <DetailRow label="MTN Price (Excl. VAT)" value={formatCurrency(product.mtn_price_excl_vat)} />
                <Separator />
                <DetailRow label="Markup Type" value={product.markup_type} />
                <Separator />
                <DetailRow
                  label="Markup Value"
                  value={product.markup_type === 'percentage'
                    ? `${product.markup_value}%`
                    : formatCurrency(product.markup_value)
                  }
                />
                <Separator />
                <DetailRow label="Selling Price (Excl. VAT)" value={formatCurrency(product.selling_price_excl_vat)} />
                <Separator />
                <DetailRow label="Selling Price (Incl. VAT)" value={formatCurrency(product.selling_price_incl_vat)} />
                {product.has_device && (
                  <>
                    <Separator />
                    <DetailRow label="Once-off Pay-in (Incl. VAT)" value={formatCurrency(product.once_off_pay_in_incl_vat)} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Commission */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-circleTel-orange">
                  <Calculator className="h-5 w-5" />
                  Commission Calculation
                </CardTitle>
                <CardDescription>
                  Based on Arlan Communications contract (30% share)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commission && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-gray-500">Commission Tier</p>
                        <p className="text-lg font-bold">{product.commission_tier}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-gray-500">Effective Rate</p>
                        <p className="text-lg font-bold text-circleTel-orange">
                          {commission.effective_rate.toFixed(3)}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Contract Value</span>
                        <span className="font-medium">{formatCurrency(commission.total_contract_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MTN Commission Rate</span>
                        <span className="font-medium">{product.mtn_commission_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MTN Commission (to Arlan)</span>
                        <span className="font-medium">{formatCurrency(commission.mtn_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CircleTel Share ({product.circletel_commission_share}%)</span>
                        <span className="font-medium">{formatCurrency(commission.circletel_commission)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Your Commission</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(commission.circletel_commission)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Incl. VAT (15%)</span>
                        <span>{formatCurrency(commission.circletel_commission_incl_vat)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Bundle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-circleTel-orange" />
                  Data Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Data Bundle" value={product.data_bundle || '-'} />
                <Separator />
                <DetailRow
                  label="Data (GB)"
                  value={product.data_bundle_gb ? `${product.data_bundle_gb} GB` : '-'}
                />
                <Separator />
                <DetailRow label="Inclusive Data" value={product.inclusive_data || '-'} />
              </CardContent>
            </Card>

            {/* Voice Bundle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-circleTel-orange" />
                  Voice Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Anytime Minutes" value={product.anytime_minutes || '-'} />
                <Separator />
                <DetailRow label="On-Net Minutes" value={product.on_net_minutes || '-'} />
                <Separator />
                <DetailRow label="Inclusive Minutes" value={product.inclusive_minutes || '-'} />
                <Separator />
                <DetailRow label="Inclusive On-Net Minutes" value={product.inclusive_on_net_minutes || '-'} />
                <Separator />
                <DetailRow label="In-Group Calling" value={product.inclusive_in_group_calling || '-'} />
              </CardContent>
            </Card>

            {/* SMS Bundle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-circleTel-orange" />
                  SMS Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="SMS Bundle" value={product.sms_bundle || '-'} />
                <Separator />
                <DetailRow label="Inclusive SMS" value={product.inclusive_sms || '-'} />
              </CardContent>
            </Card>

            {/* Freebies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-circleTel-orange" />
                  Freebies & Extras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow
                  label="Free SIM"
                  value={product.free_sim ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                />
                <Separator />
                <DetailRow
                  label="Free CLI"
                  value={product.free_cli ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                />
                <Separator />
                <DetailRow
                  label="Free ITB"
                  value={product.free_itb ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                />
                <Separator />
                <DetailRow label="Device Freebies" value={product.freebies_device || '-'} />
                <Separator />
                <DetailRow label="Price Plan Freebies" value={product.freebies_priceplan || '-'} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-circleTel-orange" />
                  Import Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Import Batch ID" value={
                  product.import_batch_id ? (
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {product.import_batch_id}
                    </code>
                  ) : '-'
                } />
                <Separator />
                <DetailRow label="Source File" value={product.source_file || '-'} />
              </CardContent>
            </Card>

            {/* Audit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-circleTel-orange" />
                  Audit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Created At" value={formatDate(product.created_at)} />
                <Separator />
                <DetailRow label="Updated At" value={formatDate(product.updated_at)} />
                <Separator />
                <DetailRow label="Created By" value={product.created_by || 'System'} />
                <Separator />
                <DetailRow label="Updated By" value={product.updated_by || 'System'} />
              </CardContent>
            </Card>

            {/* Raw Metadata */}
            {product.metadata && Object.keys(product.metadata).length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Raw Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(product.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Product ID */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Product UUID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{product.id}</code>
                      <button
                        onClick={() => copyToClipboard(product.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Deal ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{product.deal_id}</code>
                      <button
                        onClick={() => copyToClipboard(product.deal_id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
