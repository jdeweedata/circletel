'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductsService } from '@/lib/services/products';
import { CreateProductData, PRODUCT_CATEGORIES, SERVICE_TYPES } from '@/lib/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Settings,
  Globe,
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  service_type: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  base_price_zar: string;
  cost_price_zar: string;
  description: string;
  features: string[];
  is_featured: boolean;
  is_popular: boolean;
  // Pricing structure
  setup_fee: string;
  monthly_fee: string;
  upload_speed: string;
  download_speed: string;
  // Metadata
  contract_months: string;
  installation_days: string;
  availability_zones: string[];
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  category: '',
  service_type: '',
  status: 'draft',
  base_price_zar: '',
  cost_price_zar: '',
  description: '',
  features: [],
  is_featured: false,
  is_popular: false,
  setup_fee: '',
  monthly_fee: '',
  upload_speed: '',
  download_speed: '',
  contract_months: '1',
  installation_days: '3',
  availability_zones: []
};

export default function NewProduct() {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [currentFeature, setCurrentFeature] = useState('');
  const [currentZone, setCurrentZone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSKU = (name: string, category: string) => {
    const namePrefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const categoryPrefix = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
  };

  const addFeature = () => {
    if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, currentFeature.trim()]
      }));
      setCurrentFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const addZone = () => {
    if (currentZone.trim() && !formData.availability_zones.includes(currentZone.trim())) {
      setFormData(prev => ({
        ...prev,
        availability_zones: [...prev.availability_zones, currentZone.trim()]
      }));
      setCurrentZone('');
    }
  };

  const removeZone = (zone: string) => {
    setFormData(prev => ({
      ...prev,
      availability_zones: prev.availability_zones.filter(z => z !== zone)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Auto-generate SKU if not provided
      const sku = formData.sku || generateSKU(formData.name, formData.category);

      // Prepare data for API
      const productData: CreateProductData = {
        name: formData.name,
        sku,
        category: formData.category,
        description: formData.description || undefined,
        base_price_zar: parseFloat(formData.base_price_zar) || 0,
        cost_price_zar: parseFloat(formData.cost_price_zar) || 0,
        service_type: formData.service_type || undefined,
        features: formData.features,
        pricing: {
          setup: parseFloat(formData.setup_fee) || 0,
          monthly: parseFloat(formData.monthly_fee) || parseFloat(formData.base_price_zar) || 0,
          upload_speed: parseFloat(formData.upload_speed) || 0,
          download_speed: parseFloat(formData.download_speed) || 0,
        },
        status: formData.status,
        is_featured: formData.is_featured,
        is_popular: formData.is_popular,
        metadata: {
          contract_months: parseInt(formData.contract_months) || 1,
          installation_days: parseInt(formData.installation_days) || 3,
          availability_zones: formData.availability_zones,
        }
      };

      const newProduct = await ProductsService.createProduct(productData);
      console.log('Product created:', newProduct);

      // Redirect to products list on success
      router.push('/admin/products');
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.category) {
      setError('Product name and category are required to save as draft');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sku = formData.sku || generateSKU(formData.name, formData.category);

      const draftData: CreateProductData = {
        name: formData.name,
        sku,
        category: formData.category,
        description: formData.description || undefined,
        base_price_zar: parseFloat(formData.base_price_zar) || 0,
        cost_price_zar: parseFloat(formData.cost_price_zar) || 0,
        service_type: formData.service_type || undefined,
        features: formData.features,
        status: 'draft',
        is_featured: false,
        is_popular: false,
        metadata: {
          contract_months: parseInt(formData.contract_months) || 1,
          installation_days: parseInt(formData.installation_days) || 3,
          availability_zones: formData.availability_zones,
        }
      };

      await ProductsService.createProduct(draftData);
      router.push('/admin/products');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600 mt-1">
              Create a new product for the CircleTel catalogue
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>
              Essential product details and categorization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., SkyFibre Essential"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed-wireless">Fixed Wireless</SelectItem>
                    <SelectItem value="fibre">Fibre</SelectItem>
                    <SelectItem value="wi-fi-solutions">Wi-Fi Solutions</SelectItem>
                    <SelectItem value="managed-services">Managed Services</SelectItem>
                    <SelectItem value="cloud-services">Cloud Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_market">Target Market</Label>
                <Select
                  value={formData.target_market}
                  onValueChange={(value) => handleInputChange('target_market', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home-users">Home Users</SelectItem>
                    <SelectItem value="small-business">Small Business</SelectItem>
                    <SelectItem value="medium-business">Medium Business</SelectItem>
                    <SelectItem value="large-enterprise">Large Enterprise</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed product description..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Technical Specifications</span>
            </CardTitle>
            <CardDescription>
              Speed, data limits, and technical details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speed_down">Download Speed</Label>
                <Input
                  id="speed_down"
                  value={formData.speed_down}
                  onChange={(e) => handleInputChange('speed_down', e.target.value)}
                  placeholder="e.g., 50 Mbps"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed_up">Upload Speed</Label>
                <Input
                  id="speed_up"
                  value={formData.speed_up}
                  onChange={(e) => handleInputChange('speed_up', e.target.value)}
                  placeholder="e.g., 25 Mbps"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_limit">Data Limit</Label>
                <Select
                  value={formData.data_limit}
                  onValueChange={(value) => handleInputChange('data_limit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="1tb">1TB</SelectItem>
                    <SelectItem value="500gb">500GB</SelectItem>
                    <SelectItem value="250gb">250GB</SelectItem>
                    <SelectItem value="100gb">100GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Pricing Information</span>
            </CardTitle>
            <CardDescription>
              Monthly pricing and setup fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price (excl. VAT)</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., R1,299"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_fee">Setup Fee (excl. VAT)</Label>
                <Input
                  id="setup_fee"
                  value={formData.setup_fee}
                  onChange={(e) => handleInputChange('setup_fee', e.target.value)}
                  placeholder="e.g., R500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_term">Contract Term</Label>
                <Select
                  value={formData.contract_term}
                  onValueChange={(value) => handleInputChange('contract_term', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month-to-month">Month-to-Month</SelectItem>
                    <SelectItem value="12-months">12 Months</SelectItem>
                    <SelectItem value="24-months">24 Months</SelectItem>
                    <SelectItem value="36-months">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Product Features</CardTitle>
            <CardDescription>
              Key features and benefits of this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={currentFeature}
                onChange={(e) => setCurrentFeature(e.target.value)}
                placeholder="Enter a product feature..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} variant="outline">
                Add Feature
              </Button>
            </div>

            {formData.features.length > 0 && (
              <div className="space-y-2">
                <Label>Current Features</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFeature(feature)}
                    >
                      {feature} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Availability & Status</span>
            </CardTitle>
            <CardDescription>
              Product availability and current status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) => handleInputChange('availability', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nationwide">Nationwide</SelectItem>
                    <SelectItem value="major-cities">Major Cities Only</SelectItem>
                    <SelectItem value="western-cape">Western Cape</SelectItem>
                    <SelectItem value="gauteng">Gauteng</SelectItem>
                    <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="limited">Limited Areas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Product Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.name || !formData.category}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Product...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}