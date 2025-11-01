'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Loader2,
  Plus,
  X,
  Package
} from 'lucide-react';
import Link from 'next/link';

// Validation schema
const quoteFormSchema = z.object({
  // Company Information
  customer_type: z.enum(['smme', 'enterprise']),
  company_name: z.string().min(2, 'Company name is required'),
  registration_number: z.string().optional(),
  vat_number: z.string().optional(),
  
  // Contact Information
  contact_name: z.string().min(2, 'Contact name is required'),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().min(10, 'Valid phone number is required'),
  
  // Service Address
  service_address: z.string().min(5, 'Service address is required'),
  
  // Quote Details
  contract_term: z.enum(['12', '24', '36']),
  customer_notes: z.string().optional(),
  
  // Items will be added separately
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface ServicePackage {
  id: string;
  name: string;
  speed: string;
  pricing: {
    monthly: number;
    installation: number;
  };
  service_type: string;
}

interface QuoteItem {
  package_id: string;
  package: ServicePackage;
  quantity: number;
  item_type: 'primary' | 'secondary' | 'additional';
}

export default function NewQuotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([]);
  const [showPackageSelector, setShowPackageSelector] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customer_type: 'smme',
      contract_term: '12',
      quantity: 1,
    },
  });

  // Fetch available packages
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/products?status=active&per_page=50');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.products);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load service packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const addServiceItem = (pkg: ServicePackage, itemType: 'primary' | 'secondary' | 'additional') => {
    const newItem: QuoteItem = {
      package_id: pkg.id,
      package: pkg,
      quantity: 1,
      item_type: itemType,
    };
    setSelectedItems([...selectedItems, newItem]);
    setShowPackageSelector(false);
  };

  const removeServiceItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, quantity);
    setSelectedItems(updated);
  };

  const calculatePricing = () => {
    const subtotalMonthly = selectedItems.reduce(
      (sum, item) => sum + (item.package.pricing.monthly * item.quantity),
      0
    );
    const subtotalInstallation = selectedItems.reduce(
      (sum, item) => sum + (item.package.pricing.installation * item.quantity),
      0
    );
    const vat = (subtotalMonthly + subtotalInstallation) * 0.15;
    const total = subtotalMonthly + subtotalInstallation + vat;

    return {
      subtotalMonthly,
      subtotalInstallation,
      vat,
      totalMonthly: subtotalMonthly,
      totalInstallation: subtotalInstallation,
      total,
    };
  };

  const onSubmit = async (data: QuoteFormValues) => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one service to the quote');
      return;
    }

    setIsSubmitting(true);

    try {
      const quotePayload = {
        ...data,
        contract_term: parseInt(data.contract_term),
        items: selectedItems.map(item => ({
          package_id: item.package_id,
          quantity: item.quantity,
          item_type: item.item_type,
        })),
      };

      const response = await fetch('/api/quotes/business/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotePayload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Quote created successfully!');
        router.push(`/admin/quotes/${result.quote.id}`);
      } else {
        throw new Error(result.error || 'Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricing = calculatePricing();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin/quotes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quotes
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">Create New Quote</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Generate a business quote for a potential customer
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-circleTel-orange" />
                  Company Information
                </CardTitle>
                <CardDescription>Business details for the quote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_type">Customer Type *</Label>
                    <Controller
                      name="customer_type"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smme">SMME</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.customer_type && (
                      <p className="text-sm text-red-600">{form.formState.errors.customer_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_term">Contract Term *</Label>
                    <Controller
                      name="contract_term"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12">12 Months</SelectItem>
                            <SelectItem value="24">24 Months</SelectItem>
                            <SelectItem value="36">36 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.contract_term && (
                      <p className="text-sm text-red-600">{form.formState.errors.contract_term.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    {...form.register('company_name')}
                    placeholder="e.g., Upstream Connect PTY LTD"
                  />
                  {form.formState.errors.company_name && (
                    <p className="text-sm text-red-600">{form.formState.errors.company_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      {...form.register('registration_number')}
                      placeholder="e.g., 2021/410852/07"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vat_number">VAT Number</Label>
                    <Input
                      id="vat_number"
                      {...form.register('vat_number')}
                      placeholder="e.g., 4110302991"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-circleTel-orange" />
                  Contact Information
                </CardTitle>
                <CardDescription>Primary contact for this quote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    {...form.register('contact_name')}
                    placeholder="e.g., Wade Wiborg"
                  />
                  {form.formState.errors.contact_name && (
                    <p className="text-sm text-red-600">{form.formState.errors.contact_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="contact_email"
                        type="email"
                        {...form.register('contact_email')}
                        placeholder="email@company.com"
                        className="pl-10"
                      />
                    </div>
                    {form.formState.errors.contact_email && (
                      <p className="text-sm text-red-600">{form.formState.errors.contact_email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="contact_phone"
                        {...form.register('contact_phone')}
                        placeholder="0827225217"
                        className="pl-10"
                      />
                    </div>
                    {form.formState.errors.contact_phone && (
                      <p className="text-sm text-red-600">{form.formState.errors.contact_phone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-circleTel-orange" />
                  Service Address
                </CardTitle>
                <CardDescription>Where the service will be installed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_address">Address *</Label>
                  <Textarea
                    id="service_address"
                    {...form.register('service_address')}
                    placeholder="e.g., Welmoed Estate, Stellenbosch"
                    rows={3}
                  />
                  {form.formState.errors.service_address && (
                    <p className="text-sm text-red-600">{form.formState.errors.service_address.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-circleTel-orange" />
                  Services
                </CardTitle>
                <CardDescription>Add services to this quote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No services added yet</p>
                    <p className="text-xs mt-1">Click "Add Service" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.package.name}</h4>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              {item.item_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.package.speed}</p>
                          <p className="text-sm font-medium text-circleTel-orange mt-1">
                            R {item.package.pricing.monthly.toLocaleString()}/month
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeServiceItem(index)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showPackageSelector ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">Select Service Package</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPackageSelector(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {loadingPackages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-circleTel-orange" />
                      </div>
                    ) : packages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No active packages available</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {packages.map((pkg) => (
                          <div key={pkg.id} className="flex items-center justify-between p-3 border rounded bg-white hover:border-circleTel-orange transition-colors">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{pkg.name}</h5>
                              <p className="text-xs text-gray-600">{pkg.speed}</p>
                              <p className="text-sm font-medium text-circleTel-orange mt-1">
                                R {pkg.pricing.monthly.toLocaleString()}/month
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addServiceItem(pkg, 'primary')}
                              >
                                Primary
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addServiceItem(pkg, 'secondary')}
                              >
                                Backup
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPackageSelector(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-circleTel-orange" />
                  Additional Notes
                </CardTitle>
                <CardDescription>Internal notes or special requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...form.register('customer_notes')}
                  placeholder="Add any special requirements, notes, or custom terms..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Summary</CardTitle>
                  <CardDescription>Quote totals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Subtotal</span>
                      <span className="font-medium">R {pricing.subtotalMonthly.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Installation Fee</span>
                      <span className="font-medium">R {pricing.subtotalInstallation.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT (15%)</span>
                      <span className="font-medium">R {pricing.vat.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total Monthly</span>
                        <span className="font-bold text-circleTel-orange text-lg">
                          R {pricing.totalMonthly.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Contract Term: {form.watch('contract_term')} months</p>
                      <p>Services: {selectedItems.length}</p>
                      <p>Total Items: {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || selectedItems.length === 0}
                      className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Quote...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Create Quote
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
