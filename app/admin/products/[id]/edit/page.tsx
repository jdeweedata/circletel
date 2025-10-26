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
  base_price_zar: z.number().min(0, 'Price must be positive').nullable(),
  cost_price_zar: z.number().min(0, 'Price must be positive').nullable(),
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
        setValue('service', data.data.service || '');
        setValue('customer_type', data.data.customer_type || 'consumer');
        setValue('base_price_zar', data.data.base_price_zar || null);
        setValue('cost_price_zar', data.data.cost_price_zar || null);
        setValue('speed_download', data.data.speed_download || null);
        setValue('speed_upload', data.data.speed_upload || null);
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

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update product');
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully',
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
                Monthly subscription and one-time fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price_zar">Monthly Price (ZAR)</Label>
                  <Input
                    id="base_price_zar"
                    type="number"
                    step="0.01"
                    {...register('base_price_zar', { valueAsNumber: true })}
                    placeholder="e.g., 799.00"
                  />
                  {errors.base_price_zar && (
                    <p className="text-sm text-destructive">{errors.base_price_zar.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_price_zar">Setup Fee / Cost (ZAR)</Label>
                  <Input
                    id="cost_price_zar"
                    type="number"
                    step="0.01"
                    {...register('cost_price_zar', { valueAsNumber: true })}
                    placeholder="e.g., 900.00"
                  />
                  {errors.cost_price_zar && (
                    <p className="text-sm text-destructive">{errors.cost_price_zar.message}</p>
                  )}
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speed_download">Download Speed (Mbps)</Label>
                  <Input
                    id="speed_download"
                    type="number"
                    {...register('speed_download', { valueAsNumber: true })}
                    placeholder="e.g., 50"
                  />
                  {errors.speed_download && (
                    <p className="text-sm text-destructive">{errors.speed_download.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed_upload">Upload Speed (Mbps)</Label>
                  <Input
                    id="speed_upload"
                    type="number"
                    {...register('speed_upload', { valueAsNumber: true })}
                    placeholder="e.g., 50"
                  />
                  {errors.speed_upload && (
                    <p className="text-sm text-destructive">{errors.speed_upload.message}</p>
                  )}
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
