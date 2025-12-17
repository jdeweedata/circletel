'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { FeaturesEditor } from '@/components/admin/products/FeaturesEditor';
import { ProductCostBreakdown } from '@/components/admin/products/ProductCostBreakdown';
import { ArrowLeft, Save, Loader2, Tag, DollarSign, Wifi, FileText, Settings, TrendingUp, Calculator, Percent, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// South African VAT rate
const VAT_RATE = 0.15;

// Product edit form schema - using database field names
const productEditSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  service: z.string().min(1, 'Service is required'),
  customer_type: z.enum(['consumer', 'smme', 'enterprise']),
  // Root-level pricing fields (legacy/backward compatibility)
  base_price_zar: z.number().min(0, 'Price must be positive').nullable(),
  cost_price_zar: z.number().min(0, 'Cost must be positive').nullable(),
  // Pricing object fields (preferred - synced with root-level on save)
  pricing_monthly: z.number().min(0, 'Monthly fee must be positive').nullable(),
  pricing_setup: z.number().min(0, 'Setup fee must be positive').nullable(),
  pricing_download_speed: z.number().int().min(0).nullable(),
  pricing_upload_speed: z.number().int().min(0).nullable(),
  // Legacy speed fields (for backward compatibility)
  speed_download: z.number().int().min(0).nullable(),
  speed_upload: z.number().int().min(0).nullable(),
  data_limit: z.string().optional(),
  contract_duration: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()),
  is_active: z.boolean(),
  featured: z.boolean(),
  change_reason: z.string().min(5, 'Please provide a reason for this change'),
  // Promotional Pricing
  is_promotional: z.boolean(),
  promo_price: z.number().min(0).nullable(),
  promo_start_date: z.string().nullable(),
  promo_end_date: z.string().nullable(),
  promo_discount_type: z.enum(['percentage', 'fixed']).nullable(),
  promo_discount_value: z.number().min(0).nullable(),
  promo_code: z.string().nullable(),
  // Cost & Margin fields
  wholesale_cost: z.number().min(0, 'Wholesale cost must be positive').nullable(),
});

type ProductEditFormData = z.infer<typeof productEditSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
  });

  const features = watch('features') || [];
  const isActive = watch('is_active');
  const featured = watch('featured');

  // Promotional pricing watchers
  const isPromotional = watch('is_promotional');
  const promoDiscountType = watch('promo_discount_type');
  const promoDiscountValue = watch('promo_discount_value');
  const pricingMonthly = watch('pricing_monthly');
  const wholesaleCost = watch('wholesale_cost');
  const [totalCostFromBreakdown, setTotalCostFromBreakdown] = useState<number | null>(null);
  const costPriceZar = watch('cost_price_zar');

  // Calculate promotional price
  const calculatedPromoPrice = useMemo(() => {
    if (!isPromotional || !pricingMonthly) return 0;
    if (promoDiscountType === 'percentage' && promoDiscountValue) {
      return Math.round(pricingMonthly * (1 - promoDiscountValue / 100));
    } else if (promoDiscountType === 'fixed' && promoDiscountValue) {
      return Math.max(0, pricingMonthly - promoDiscountValue);
    }
    return pricingMonthly;
  }, [isPromotional, pricingMonthly, promoDiscountType, promoDiscountValue]);

  // Calculate VAT and margin values
  // Use cost breakdown total if available, otherwise fall back to wholesale_cost field
  const priceCalculations = useMemo(() => {
    const sellingPriceExclVat = pricingMonthly || 0;
    const sellingPriceInclVat = sellingPriceExclVat * (1 + VAT_RATE);
    // Priority: Cost breakdown total > wholesale_cost > cost_price_zar
    const cost = totalCostFromBreakdown ?? wholesaleCost ?? costPriceZar ?? 0;
    const grossProfit = sellingPriceExclVat - cost;
    const marginPercentage = sellingPriceExclVat > 0 ? (grossProfit / sellingPriceExclVat) * 100 : 0;
    const markupPercentage = cost > 0 ? (grossProfit / cost) * 100 : 0;
    
    return {
      sellingPriceExclVat,
      sellingPriceInclVat,
      vatAmount: sellingPriceInclVat - sellingPriceExclVat,
      cost,
      grossProfit,
      marginPercentage,
      markupPercentage,
      usingBreakdown: totalCostFromBreakdown !== null && totalCostFromBreakdown > 0,
    };
  }, [pricingMonthly, wholesaleCost, costPriceZar, totalCostFromBreakdown]);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/products/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch product');
        }

        setProduct(data.data);

        // Populate form
        setValue('name', data.data.name || '');
        setValue('sku', data.data.sku || '');
        setValue('category', data.data.category || '');
        setValue('service', data.data.service_type || data.data.service || '');
        setValue('customer_type', data.data.customer_type || 'consumer');

        // Root-level pricing (legacy/backward compatibility)
        setValue('base_price_zar', data.data.base_price_zar || null);
        setValue('cost_price_zar', data.data.cost_price_zar || null);

        // Pricing object fields (preferred - read from pricing JSONB if available)
        const pricing = data.data.pricing || {};
        setValue('pricing_monthly', pricing.monthly || data.data.base_price_zar || null);
        setValue('pricing_setup', pricing.setup || data.data.cost_price_zar || null);
        setValue('pricing_download_speed', pricing.download_speed || data.data.speed_download || null);
        setValue('pricing_upload_speed', pricing.upload_speed || data.data.speed_upload || null);

        // Legacy speed fields
        setValue('speed_download', data.data.speed_download || pricing.download_speed || null);
        setValue('speed_upload', data.data.speed_upload || pricing.upload_speed || null);

        setValue('data_limit', data.data.data_limit || '');
        setValue('contract_duration', data.data.contract_duration || '');
        setValue('description', data.data.description || '');
        setValue('features', Array.isArray(data.data.features) ? data.data.features : []);
        setValue('is_active', data.data.is_active !== false);
        setValue('featured', data.data.featured === true);
        setValue('change_reason', '');

        // Promotional pricing fields
        setValue('is_promotional', data.data.is_promotional || false);
        setValue('promo_price', data.data.price_promo || null);
        setValue('promo_start_date', data.data.promo_start_date?.split('T')[0] || null);
        setValue('promo_end_date', data.data.promo_end_date?.split('T')[0] || null);
        setValue('promo_discount_type', data.data.promo_discount_type || 'percentage');
        setValue('promo_discount_value', data.data.promo_discount_value || null);
        setValue('promo_code', data.data.promo_code || null);
        
        // Cost & Margin fields
        setValue('wholesale_cost', data.data.wholesale_cost || data.data.cost_price_zar || null);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load product',
        });
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router, setValue, toast]);

  const onSubmit = async (data: ProductEditFormData) => {
    try {
      setSaving(true);

      // Build the pricing JSONB object from form data
      const pricingObject = {
        monthly: data.pricing_monthly || data.base_price_zar || 0,
        setup: data.pricing_setup || data.cost_price_zar || 0,
        download_speed: data.pricing_download_speed || data.speed_download || 0,
        upload_speed: data.pricing_upload_speed || data.speed_upload || 0,
      };

      // Build promotional data object
      const promotionalData = data.is_promotional ? {
        is_promotional: true,
        price_promo: data.promo_price,
        promo_start_date: data.promo_start_date,
        promo_end_date: data.promo_end_date,
        promo_discount_type: data.promo_discount_type,
        promo_discount_value: data.promo_discount_value,
        promo_code: data.promo_code,
      } : {
        is_promotional: false,
        price_promo: null,
        promo_start_date: null,
        promo_end_date: null,
        promo_discount_type: null,
        promo_discount_value: null,
        promo_code: null,
      };

      // Sync root-level fields with pricing object (for backward compatibility)
      const syncedData = {
        ...data,
        // Sync pricing: primary source is pricing object fields
        base_price_zar: data.pricing_monthly || data.base_price_zar,
        cost_price_zar: data.wholesale_cost || data.cost_price_zar,
        speed_download: data.pricing_download_speed || data.speed_download,
        speed_upload: data.pricing_upload_speed || data.speed_upload,
        // Add the pricing JSONB object
        pricing: pricingObject,
        // Add promotional data
        ...promotionalData,
        // Add wholesale cost
        wholesale_cost: data.wholesale_cost,
      };

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'admin@circletel.co.za',
          'x-user-name': 'Admin User',
        },
        body: JSON.stringify(syncedData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update product');
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully (both pricing fields synced)',
      });

      // Redirect back to products list
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update product',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product details, pricing, and features
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="bg-white p-1 border border-gray-200 rounded-lg shadow-sm h-auto grid w-full grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="basic" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <FileText className="h-4 w-4 mr-1.5" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="pricing" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Calculator className="h-4 w-4 mr-1.5" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="cost-breakdown" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Layers className="h-4 w-4 mr-1.5" />
                Cost Breakdown
              </TabsTrigger>
              <TabsTrigger value="connectivity" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Wifi className="h-4 w-4 mr-1.5" />
                Connectivity
              </TabsTrigger>
              <TabsTrigger value="features" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Tag className="h-4 w-4 mr-1.5" />
                Features
              </TabsTrigger>
              <TabsTrigger value="status" className="px-3 py-2 text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Settings className="h-4 w-4 mr-1.5" />
                Status
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Product name, SKU, and classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., SkyFibre Starter"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="e.g., SKY-RES-START"
                  />
                  {errors.sku && (
                    <p className="text-sm text-destructive">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connectivity">Connectivity</SelectItem>
                      <SelectItem value="it_services">IT Services</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                      <SelectItem value="add_on">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Select
                    value={watch('service')}
                    onValueChange={(value) => setValue('service', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SkyFibre">SkyFibre</SelectItem>
                      <SelectItem value="HomeFibreConnect">Home Fibre Connect</SelectItem>
                      <SelectItem value="BizFibreConnect">Biz Fibre Connect</SelectItem>
                      <SelectItem value="5G">5G</SelectItem>
                      <SelectItem value="LTE">LTE</SelectItem>
                      <SelectItem value="VoIP">VoIP</SelectItem>
                      <SelectItem value="Hosting">Hosting</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="IT_Support">IT Support</SelectItem>
                      <SelectItem value="Cloud_Services">Cloud Services</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.service && (
                    <p className="text-sm text-destructive">{errors.service.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_type">Customer Type *</Label>
                  <Select
                    value={watch('customer_type')}
                    onValueChange={(value) => setValue('customer_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumer">Consumer</SelectItem>
                      <SelectItem value="smme">SME/SMME</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.customer_type && (
                    <p className="text-sm text-destructive">{errors.customer_type.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            {/* Pricing & Costs Tab */}
            <TabsContent value="pricing" className="space-y-6">
              {/* Margin Calculator Summary */}
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <TrendingUp className="h-5 w-5" />
                    Margin Calculator
                  </CardTitle>
                  <CardDescription>
                    Real-time profit margin analysis
                    {priceCalculations.usingBreakdown && (
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                        Using Cost Breakdown
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(priceCalculations.cost)}</p>
                      <p className="text-xs text-gray-400">
                        {priceCalculations.usingBreakdown ? 'From breakdown' : 'Wholesale'}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Selling Price (Excl. VAT)</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(priceCalculations.sellingPriceExclVat)}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Selling Price (Incl. VAT)</p>
                      <p className="text-2xl font-bold text-circleTel-orange">{formatCurrency(priceCalculations.sellingPriceInclVat)}</p>
                      <p className="text-xs text-gray-400">VAT: {formatCurrency(priceCalculations.vatAmount)}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Profit</p>
                      <p className={`text-2xl font-bold ${priceCalculations.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(priceCalculations.grossProfit)}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Margin %</p>
                      <p className={`text-2xl font-bold ${priceCalculations.marginPercentage >= 30 ? 'text-green-600' : priceCalculations.marginPercentage >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {priceCalculations.marginPercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">Markup: {priceCalculations.markupPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Input - Legacy/Simple Mode */}
              <Card className={priceCalculations.usingBreakdown ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-red-500" />
                    Simple Wholesale Cost
                  </CardTitle>
                  <CardDescription>
                    {priceCalculations.usingBreakdown 
                      ? 'Cost breakdown is active - this field is overridden. Go to Cost Breakdown tab to manage detailed costs.'
                      : 'Enter a single wholesale cost, or use the Cost Breakdown tab for detailed cost components.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="wholesale_cost">Wholesale Cost (Monthly)</Label>
                    <Input
                      id="wholesale_cost"
                      type="number"
                      step="0.01"
                      {...register('wholesale_cost', { valueAsNumber: true })}
                      placeholder="e.g., 450.00"
                      className="font-semibold text-lg"
                      disabled={priceCalculations.usingBreakdown}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the monthly cost you pay to the provider
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Selling Price */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-circleTel-orange" />
                    Selling Price
                  </CardTitle>
                  <CardDescription>
                    Monthly recurring fee (incl. VAT)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pricing_monthly" className="text-base font-semibold">
                        Monthly Fee (Excl. VAT) *
                      </Label>
                      <Input
                        id="pricing_monthly"
                        type="number"
                        step="0.01"
                        {...register('pricing_monthly', { valueAsNumber: true })}
                        placeholder="e.g., 749.00"
                        className="font-semibold text-lg"
                      />
                      {errors.pricing_monthly && (
                        <p className="text-sm text-destructive">{errors.pricing_monthly.message}</p>
                      )}
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-gray-600 mb-1">Price Incl. VAT (15%)</p>
                      <p className="text-2xl font-bold text-circleTel-orange">
                        {formatCurrency(priceCalculations.sellingPriceInclVat)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        VAT Amount: {formatCurrency(priceCalculations.vatAmount)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="pricing_setup">Setup Fee (Once-off)</Label>
                    <Input
                      id="pricing_setup"
                      type="number"
                      step="0.01"
                      {...register('pricing_setup', { valueAsNumber: true })}
                      placeholder="e.g., 2500.00"
                    />
                    {errors.pricing_setup && (
                      <p className="text-sm text-destructive">{errors.pricing_setup.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Promotional Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-circleTel-orange" />
                    Promotional Pricing
                  </CardTitle>
                  <CardDescription>
                    Configure special deals and promotional offers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable Promotion Toggle */}
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_promotional" className="text-base font-medium">
                        Enable Promotional Pricing
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Activate a special deal for this product
                      </div>
                    </div>
                    <Switch
                      id="is_promotional"
                      checked={isPromotional}
                      onCheckedChange={(checked) => setValue('is_promotional', checked)}
                      className="h-7 w-14 data-[state=checked]:bg-circleTel-orange data-[state=unchecked]:bg-gray-300 transition-colors shadow-inner"
                    />
                  </div>

                  {/* Promotional Fields (shown when enabled) */}
                  {isPromotional && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Discount Type Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Discount Type</Label>
                          <Select
                            value={promoDiscountType || 'percentage'}
                            onValueChange={(value) => setValue('promo_discount_type', value as 'percentage' | 'fixed')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage Off</SelectItem>
                              <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Discount Value {promoDiscountType === 'percentage' ? '(%)' : '(R)'}
                          </Label>
                          <Input
                            type="number"
                            {...register('promo_discount_value', { valueAsNumber: true })}
                            placeholder={promoDiscountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                          />
                        </div>
                      </div>

                      {/* Promo Price Display */}
                      <div className="space-y-2">
                        <Label>Promotional Price (ZAR)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register('promo_price', { valueAsNumber: true })}
                          placeholder="Final promotional price (leave blank to auto-calculate)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave blank to auto-calculate from discount
                        </p>
                      </div>

                      {/* Promo Code */}
                      <div className="space-y-2">
                        <Label>Promo Code (Optional)</Label>
                        <Input
                          {...register('promo_code')}
                          placeholder="e.g., SUMMER25"
                        />
                      </div>

                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            {...register('promo_start_date')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            {...register('promo_end_date')}
                          />
                        </div>
                      </div>

                      {/* Live Preview */}
                      {pricingMonthly && promoDiscountValue && (
                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <p className="text-sm font-medium mb-2">Preview</p>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl font-bold text-circleTel-orange">
                              R {calculatedPromoPrice}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              R {Math.round(pricingMonthly)}
                            </span>
                            <Badge className="bg-red-500 text-white">
                              {promoDiscountType === 'percentage'
                                ? `${promoDiscountValue}% OFF`
                                : `R${promoDiscountValue} OFF`
                              }
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cost Breakdown Tab */}
            <TabsContent value="cost-breakdown" className="space-y-6">
              {params.id && typeof params.id === 'string' && (
                <ProductCostBreakdown
                  packageId={params.id}
                  sellingPriceExclVat={priceCalculations.sellingPriceExclVat}
                  onTotalCostChange={setTotalCostFromBreakdown}
                />
              )}
            </TabsContent>

            {/* Connectivity Tab */}
            <TabsContent value="connectivity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-blue-600" />
                    Connectivity Specifications
                  </CardTitle>
                  <CardDescription>
                    Speed, data limits, and contract terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricing_download_speed">Download Speed (Mbps) *</Label>
                      <Input
                        id="pricing_download_speed"
                        type="number"
                        {...register('pricing_download_speed', { valueAsNumber: true })}
                        placeholder="e.g., 50"
                        className="font-semibold text-lg"
                      />
                      {errors.pricing_download_speed && (
                        <p className="text-sm text-destructive">{errors.pricing_download_speed.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricing_upload_speed">Upload Speed (Mbps) *</Label>
                      <Input
                        id="pricing_upload_speed"
                        type="number"
                        {...register('pricing_upload_speed', { valueAsNumber: true })}
                        placeholder="e.g., 25"
                        className="font-semibold text-lg"
                      />
                      {errors.pricing_upload_speed && (
                        <p className="text-sm text-destructive">{errors.pricing_upload_speed.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_limit">Data Limit</Label>
                      <Input
                        id="data_limit"
                        {...register('data_limit')}
                        placeholder="e.g., Unlimited, 100GB"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contract_duration">Contract Duration</Label>
                      <Input
                        id="contract_duration"
                        {...register('contract_duration')}
                        placeholder="e.g., Month-to-Month, 12 Months"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Description & Features
                  </CardTitle>
                  <CardDescription>
                    Product description and feature list
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Product description..."
                      rows={4}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <FeaturesEditor
                      features={features}
                      onChange={(newFeatures) => setValue('features', newFeatures)}
                    />
                    {errors.features && (
                      <p className="text-sm text-destructive">{errors.features.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Status & Visibility
                  </CardTitle>
                  <CardDescription>
                    Control product visibility and featuring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active" className="text-base font-medium">Active</Label>
                      <div className="text-sm text-muted-foreground">
                        Make this product available for sale
                      </div>
                    </div>
                    <Switch
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                      className="h-7 w-14 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300 transition-colors shadow-inner"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="featured" className="text-base font-medium">Featured</Label>
                      <div className="text-sm text-muted-foreground">
                        Highlight this product on the homepage
                      </div>
                    </div>
                    <Switch
                      id="featured"
                      checked={featured}
                      onCheckedChange={(checked) => setValue('featured', checked)}
                      className="h-7 w-14 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300 transition-colors shadow-inner"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Change Reason - Always visible outside tabs */}
          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle>Change Reason *</CardTitle>
              <CardDescription>
                Explain why you&apos;re making these changes (for audit log)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('change_reason')}
                placeholder="e.g., Updated pricing for Q1 2025, Added new features, Fixed description typo"
                rows={2}
              />
              {errors.change_reason && (
                <p className="text-sm text-destructive mt-2">{errors.change_reason.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions - Always visible */}
          <div className="flex justify-end gap-4 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
            <Link href="/admin/products">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-circleTel-orange text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:bg-[#e07018] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGate>
  );
}
