'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Product edit form schema - using database field names
const productEditSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  service: z.string().min(1, 'Service is required'),
  customer_type: z.enum(['consumer', 'smme', 'enterprise']),
  // Root-level pricing fields (legacy/backward compatibility)
  base_price_zar: z.number().min(0, 'Price must be positive').nullable(),
  cost_price_zar: z.number().min(0, 'Price must be positive').nullable(),
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

      // Sync root-level fields with pricing object (for backward compatibility)
      const syncedData = {
        ...data,
        // Sync pricing: primary source is pricing object fields
        base_price_zar: data.pricing_monthly || data.base_price_zar,
        cost_price_zar: data.pricing_setup || data.cost_price_zar,
        speed_download: data.pricing_download_speed || data.speed_download,
        speed_upload: data.pricing_upload_speed || data.speed_upload,
        // Add the pricing JSONB object
        pricing: pricingObject,
      };

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="container mx-auto py-8 max-w-4xl">
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
          {/* Basic Information */}
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

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Recurring and non-recurring fees (both fields will be synced on save)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Pricing (from pricing JSONB object) */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border-2 border-circleTel-orange/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-circleTel-orange"></div>
                  <p className="text-sm font-semibold text-circleTel-orange">
                    Primary Pricing (from pricing object)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing_monthly">
                      Recurring Fee (Monthly) *
                    </Label>
                    <Input
                      id="pricing_monthly"
                      type="number"
                      step="0.01"
                      {...register('pricing_monthly', { valueAsNumber: true })}
                      placeholder="e.g., 749.00"
                      className="font-semibold"
                    />
                    {errors.pricing_monthly && (
                      <p className="text-sm text-destructive">{errors.pricing_monthly.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing_setup">
                      Non-Recurring Fee (Setup) *
                    </Label>
                    <Input
                      id="pricing_setup"
                      type="number"
                      step="0.01"
                      {...register('pricing_setup', { valueAsNumber: true })}
                      placeholder="e.g., 2500.00"
                      className="font-semibold"
                    />
                    {errors.pricing_setup && (
                      <p className="text-sm text-destructive">{errors.pricing_setup.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Legacy Pricing Fields (for backward compatibility) */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">
                  Legacy Fields (auto-synced with primary pricing above)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price_zar" className="text-sm text-muted-foreground">
                      Base Price (ZAR)
                    </Label>
                    <Input
                      id="base_price_zar"
                      type="number"
                      step="0.01"
                      {...register('base_price_zar', { valueAsNumber: true })}
                      placeholder="e.g., 749.00"
                      className="text-muted-foreground"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_price_zar" className="text-sm text-muted-foreground">
                      Cost Price (ZAR)
                    </Label>
                    <Input
                      id="cost_price_zar"
                      type="number"
                      step="0.01"
                      {...register('cost_price_zar', { valueAsNumber: true })}
                      placeholder="e.g., 2500.00"
                      className="text-muted-foreground"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connectivity Specs */}
          <Card>
            <CardHeader>
              <CardTitle>Connectivity Specifications</CardTitle>
              <CardDescription>
                Speed, data limits, and contract terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Speed Fields (from pricing JSONB object) */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border-2 border-circleTel-orange/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-circleTel-orange"></div>
                  <p className="text-sm font-semibold text-circleTel-orange">
                    Primary Speed Settings (from pricing object)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing_download_speed">Download Speed (Mbps) *</Label>
                    <Input
                      id="pricing_download_speed"
                      type="number"
                      {...register('pricing_download_speed', { valueAsNumber: true })}
                      placeholder="e.g., 50"
                      className="font-semibold"
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
                      className="font-semibold"
                    />
                    {errors.pricing_upload_speed && (
                      <p className="text-sm text-destructive">{errors.pricing_upload_speed.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Legacy Speed Fields */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">
                  Legacy Speed Fields (auto-synced with primary speeds above)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="speed_download" className="text-sm text-muted-foreground">
                      Download Speed (Mbps)
                    </Label>
                    <Input
                      id="speed_download"
                      type="number"
                      {...register('speed_download', { valueAsNumber: true })}
                      placeholder="e.g., 50"
                      className="text-muted-foreground"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="speed_upload" className="text-sm text-muted-foreground">
                      Upload Speed (Mbps)
                    </Label>
                    <Input
                      id="speed_upload"
                      type="number"
                      {...register('speed_upload', { valueAsNumber: true })}
                      placeholder="e.g., 25"
                      className="text-muted-foreground"
                      disabled
                    />
                  </div>
                </div>
              </div>

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

          {/* Description & Features */}
          <Card>
            <CardHeader>
              <CardTitle>Description & Features</CardTitle>
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
                  rows={3}
                />
              </div>

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

          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
              <CardDescription>
                Control product visibility and featuring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active</Label>
                  <div className="text-sm text-muted-foreground">
                    Make this product available for sale
                  </div>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured">Featured</Label>
                  <div className="text-sm text-muted-foreground">
                    Highlight this product on the homepage
                  </div>
                </div>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setValue('featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Change Reason *</CardTitle>
              <CardDescription>
                Explain why you're making these changes (for audit log)
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/products">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
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
