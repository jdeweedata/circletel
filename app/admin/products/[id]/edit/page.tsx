'use client';
import { PiCurrencyDollarBold, PiFileTextBold, PiFloppyDiskBold, PiGearBold, PiSpinnerBold, PiTagBold, PiTrendUpBold, PiWifiHighBold } from 'react-icons/pi';

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
  customer_type: z.enum(['consumer', 'smme', 'enterprise', 'soho']),
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
        <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Header with Breadcrumb */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm mb-2">
                <Link href="/admin/products" className="text-gray-500 hover:text-circleTel-orange transition-colors">
                  Products
                </Link>
                <span className="text-gray-300">/</span>
                <Link href={`/admin/products/${params.id}`} className="text-gray-500 hover:text-circleTel-orange transition-colors truncate max-w-[200px]">
                  {product?.name || 'Product'}
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">Edit</span>
              </nav>

              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
            </div>
            {product?.sku && (
              <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200 uppercase px-3 py-1 text-xs tracking-wider">
                {product.sku}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Column (Left - 2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Information */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
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
                            <SelectItem value="soho">SOHO</SelectItem>
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

                {/* Description & Features */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PiFileTextBold className="h-5 w-5 text-purple-600" />
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

                {/* Pricing & Costs */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg">Pricing & Costs</CardTitle>
                    <CardDescription>Setup monthly and upfront pricing, promotional thresholds, and cost tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">

                    {/* Margin Calculator Summary - Compact */}
                    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                      <div className="bg-gray-50 border-b border-gray-200 pb-2 pt-3 px-4 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <PiTrendUpBold className="h-4 w-4 text-green-600" />
                          Cost & Margin Analysis
                        </div>
                        {priceCalculations.usingBreakdown && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                            Cost Breakdown Active
                          </Badge>
                        )}
                      </div>
                      <div className="pt-3 px-4 pb-4">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="text-center p-2.5 bg-red-50 rounded text-red-700">
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-0.5">Total Cost</p>
                            <p className="text-base font-bold">{formatCurrency(priceCalculations.cost)}</p>
                          </div>
                          <div className="text-center p-2.5 bg-gray-50 rounded">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Selling Price</p>
                            <p className="text-base font-bold text-gray-900">{formatCurrency(priceCalculations.sellingPriceExclVat)}</p>
                          </div>
                          <div className="text-center p-2.5 bg-orange-50 rounded text-circleTel-orange">
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">Incl. VAT</p>
                            <p className="text-base font-bold">{formatCurrency(priceCalculations.sellingPriceInclVat)}</p>
                          </div>
                          <div className={`text-center p-2.5 rounded ${priceCalculations.marginPercentage >= 30 ? 'bg-green-50 text-green-700' : priceCalculations.marginPercentage >= 20 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">Margin %</p>
                            <p className="text-base font-bold">
                              {priceCalculations.marginPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center p-2.5 bg-gray-50 rounded">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Once-off</p>
                            <p className="text-base font-bold text-gray-900">{formatCurrency(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Selling Price */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-2">
                          <PiCurrencyDollarBold className="h-5 w-5 text-circleTel-orange" />
                          <h4 className="font-semibold text-gray-900">Selling Price</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="pricing_monthly" className="text-sm font-semibold">
                              Monthly Fee (Excl. VAT) *
                            </Label>
                            <Input
                              id="pricing_monthly"
                              type="number"
                              step="0.01"
                              {...register('pricing_monthly', { valueAsNumber: true })}
                              placeholder="e.g., 749.00"
                            />
                            {errors.pricing_monthly && (
                              <p className="text-sm text-destructive">{errors.pricing_monthly.message}</p>
                            )}
                          </div>

                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-0.5">Price Incl. VAT</p>
                            <p className="text-xl font-bold text-circleTel-orange">
                              {formatCurrency(priceCalculations.sellingPriceInclVat)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              VAT: {formatCurrency(priceCalculations.vatAmount)}
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <Label htmlFor="pricing_setup" className="text-sm">Setup Fee (Once-off)</Label>
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
                        </div>
                      </div>

                      {/* Cost Input & Promos */}
                      <div className="space-y-6">
                        <div className={`space-y-4 ${priceCalculations.usingBreakdown ? 'opacity-60 grayscale' : ''}`}>
                          <div className="flex items-center gap-2">
                            <PiCurrencyDollarBold className="h-5 w-5 text-red-500" />
                            <h4 className="font-semibold text-gray-900">Base Wholesale Cost</h4>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="wholesale_cost" className="text-sm">Monthly Cost (ZAR)</Label>
                            <Input
                              id="wholesale_cost"
                              type="number"
                              step="0.01"
                              {...register('wholesale_cost', { valueAsNumber: true })}
                              placeholder="e.g., 450.00"
                              disabled={priceCalculations.usingBreakdown}
                            />
                            <p className="text-xs text-muted-foreground">
                              {priceCalculations.usingBreakdown 
                                ? 'Overridden by breakdown below.'
                                : 'Enter your total monthly wholesale amount.'
                              }
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PiTagBold className="h-5 w-5 text-circleTel-orange" />
                              <Label htmlFor="is_promotional" className="font-semibold cursor-pointer text-base">
                                Special Promotion
                              </Label>
                            </div>
                            <Switch
                              id="is_promotional"
                              checked={isPromotional}
                              onCheckedChange={(checked) => setValue('is_promotional', checked)}
                              className="data-[state=checked]:bg-circleTel-orange"
                            />
                          </div>

                          {isPromotional && (
                            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-1.5">
                                  <Label>Type</Label>
                                  <Select
                                    value={promoDiscountType || 'percentage'}
                                    onValueChange={(value) => setValue('promo_discount_type', value as 'percentage' | 'fixed')}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">% Off</SelectItem>
                                      <SelectItem value="fixed">ZAR Off</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    className="h-9"
                                    {...register('promo_discount_value', { valueAsNumber: true })}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1.5">
                                <Label className="text-xs">Override Promo Price (ZAR)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-9"
                                  {...register('promo_price', { valueAsNumber: true })}
                                  placeholder="Auto-calculates if blank"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Start Date</Label>
                                  <Input type="date" className="h-9 text-xs" {...register('promo_start_date')} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">End Date</Label>
                                  <Input type="date" className="h-9 text-xs" {...register('promo_end_date')} />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs">Promo Code</Label>
                                <Input className="h-9" {...register('promo_code')} placeholder="e.g. SUMMER25" />
                              </div>

                              {pricingMonthly && promoDiscountValue && (
                                <div className="p-3 bg-slate-50 flex items-center justify-between rounded border">
                                  <div>
                                    <span className="font-bold text-circleTel-orange mr-2">R {calculatedPromoPrice}</span>
                                    <span className="text-muted-foreground line-through text-xs mr-2">R {Math.round(pricingMonthly)}</span>
                                  </div>
                                  <Badge className="bg-red-500 text-white text-[10px]">
                                    {promoDiscountType === 'percentage' ? `${promoDiscountValue}% OFF` : `R${promoDiscountValue} OFF`}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown Manager */}
                {params.id && typeof params.id === 'string' && (
                  <ProductCostBreakdown
                    packageId={params.id}
                    sellingPriceExclVat={priceCalculations.sellingPriceExclVat}
                    onTotalCostChange={setTotalCostFromBreakdown}
                  />
                )}

              </div>


              {/* Sidebar Column (Right - 1/3 width) */}
              <div className="space-y-6">
                
                {/* Status & Visibility */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PiGearBold className="h-5 w-5 text-gray-600" />
                      Status & Visibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_active" className="text-sm font-semibold text-emerald-900 cursor-pointer">Active Product</Label>
                        <div className="text-xs text-emerald-700/80">
                          Available for purchase
                        </div>
                      </div>
                      <Switch
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={(checked) => setValue('is_active', checked)}
                        className="data-[state=checked]:bg-emerald-500 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                      <div className="space-y-0.5">
                        <Label htmlFor="featured" className="text-sm font-semibold text-amber-900 cursor-pointer">Featured</Label>
                        <div className="text-xs text-amber-700/80">
                          Highlight in top results
                        </div>
                      </div>
                      <Switch
                        id="featured"
                        checked={featured}
                        onCheckedChange={(checked) => setValue('featured', checked)}
                        className="data-[state=checked]:bg-amber-500 shadow-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Connectivity Specifications */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PiWifiHighBold className="h-5 w-5 text-blue-600" />
                      Connectivity Specs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricing_download_speed" className="text-xs font-semibold text-gray-600">Download (Mbps)</Label>
                        <Input
                          id="pricing_download_speed"
                          type="number"
                          {...register('pricing_download_speed', { valueAsNumber: true })}
                          placeholder="e.g., 50"
                          className="h-9"
                        />
                        {errors.pricing_download_speed && (
                          <p className="text-[10px] text-destructive">{errors.pricing_download_speed.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pricing_upload_speed" className="text-xs font-semibold text-gray-600">Upload (Mbps)</Label>
                        <Input
                          id="pricing_upload_speed"
                          type="number"
                          {...register('pricing_upload_speed', { valueAsNumber: true })}
                          placeholder="e.g., 25"
                          className="h-9"
                        />
                        {errors.pricing_upload_speed && (
                          <p className="text-[10px] text-destructive">{errors.pricing_upload_speed.message}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="data_limit" className="text-xs font-semibold text-gray-600">Data Limit</Label>
                        <Input
                          id="data_limit"
                          {...register('data_limit')}
                          placeholder="e.g., Unlimited, 100GB"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contract_duration" className="text-xs font-semibold text-gray-600">Contract Duration</Label>
                        <Input
                          id="contract_duration"
                          {...register('contract_duration')}
                          placeholder="e.g., Month-to-Month, 12 Months"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Change Reason (Audit Log) */}
                <Card className="border-2 border-orange-200 bg-orange-50/30 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-circleTel-orange"></div>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base text-gray-900">Change Reason *</CardTitle>
                    <CardDescription className="text-xs">
                      Required for your audit log.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      {...register('change_reason')}
                      placeholder="e.g., Pricing updated per wholesale change"
                      rows={3}
                      className="resize-none text-sm"
                    />
                    {errors.change_reason && (
                      <p className="text-xs text-destructive mt-1.5 font-medium">{errors.change_reason.message}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Actions - Sticky Footer */}
            <div className="flex justify-between items-center sticky bottom-4 bg-white/90 backdrop-blur border border-gray-200 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 transition-all">
              <div className="text-sm text-gray-500 font-medium hidden sm:block">
                Please ensure all fields are verified before saving.
              </div>
              <div className="flex justify-end gap-3 w-full sm:w-auto">
                <Link href="/admin/products">
                  <Button variant="outline" type="button" className="px-6 border-gray-300">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-circleTel-orange text-white font-semibold px-8 hover:bg-[#e07018] shadow text-sm group"
                >
                  {saving ? (
                    <>
                      <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PiFloppyDiskBold className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Save Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PermissionGate>
  );
}
