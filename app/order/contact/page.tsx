'use client';

import React, { useState, useEffect } from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, ArrowLeft, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

// Validation schema for contact form
const contactSchema = z.object({
  customerType: z.enum(['personal', 'business']),
  // Personal fields
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().regex(/^0[0-9]{9}$/, 'Please enter a valid South African phone number (e.g., 0821234567)'),
  // Business fields (conditional)
  businessName: z.string().optional(),
  businessRegistration: z.string().optional(),
  taxNumber: z.string().optional(),
  // Billing address
  street: z.string().min(5, 'Street address is required'),
  suburb: z.string().min(2, 'Suburb is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().regex(/^[0-9]{4}$/, 'Please enter a valid 4-digit postal code'),
}).refine((data) => {
  // If business type, require business fields
  if (data.customerType === 'business') {
    return data.businessName && data.businessName.length >= 2;
  }
  return true;
}, {
  message: 'Business name is required for business accounts',
  path: ['businessName'],
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set current stage to 3 when this page loads
  useEffect(() => {
    if (state.currentStage !== 3) {
      actions.setCurrentStage(3);
    }
  }, [state.currentStage, actions]);

  // Initialize form with existing data
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customerType: state.orderData.contact?.customerType || state.orderData.account?.accountType || 'personal',
      contactName: state.orderData.contact?.contactName || `${state.orderData.account?.firstName || ''} ${state.orderData.account?.lastName || ''}`.trim(),
      contactEmail: state.orderData.contact?.contactEmail || state.orderData.account?.email || '',
      contactPhone: state.orderData.contact?.contactPhone || state.orderData.account?.phone || '',
      businessName: state.orderData.contact?.businessName || '',
      businessRegistration: state.orderData.contact?.businessRegistration || '',
      taxNumber: state.orderData.contact?.taxNumber || '',
      street: state.orderData.contact?.billingAddress?.street || '',
      suburb: state.orderData.contact?.billingAddress?.suburb || '',
      city: state.orderData.contact?.billingAddress?.city || '',
      province: state.orderData.contact?.billingAddress?.province || '',
      postalCode: state.orderData.contact?.billingAddress?.postalCode || '',
    },
  });

  const customerType = watch('customerType');

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    try {
      // Save contact data to OrderContext
      actions.updateOrderData({
        contact: {
          customerType: data.customerType,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          businessName: data.customerType === 'business' ? data.businessName : undefined,
          businessRegistration: data.customerType === 'business' ? data.businessRegistration : undefined,
          taxNumber: data.customerType === 'business' ? data.taxNumber : undefined,
          billingAddress: {
            street: data.street,
            suburb: data.suburb,
            city: data.city,
            province: data.province,
            postalCode: data.postalCode,
            country: 'South Africa',
          },
        },
      });

      // Mark step as complete
      actions.markStepComplete(3);

      // Navigate to installation page
      router.push('/order/installation');
    } catch (error) {
      console.error('Error saving contact data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/order/account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
            Contact & Billing Information
          </h1>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Step 3 of 5: Provide your contact details and billing address
          </p>
        </div>

        {/* Order Summary Card */}
        {state.orderData.coverage?.selectedPackage && (
          <Card className="mb-6 border-circleTel-orange">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Selected Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-circleTel-darkNeutral">
                    {state.orderData.coverage.selectedPackage.name}
                  </p>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    {state.orderData.coverage.selectedPackage.speed}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-circleTel-orange">
                    R{state.orderData.coverage.selectedPackage.monthlyPrice}/month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Tell us how to reach you and where to send invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Type Selection */}
              <div className="space-y-3">
                <Label>Account Type</Label>
                <RadioGroup
                  value={customerType}
                  onValueChange={(value) => setValue('customerType', value as 'personal' | 'business')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="personal"
                      id="personal"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="personal"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-circleTel-orange peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all"
                    >
                      <User className="mb-2 h-6 w-6" />
                      <div className="text-center">
                        <p className="font-semibold">Personal</p>
                        <p className="text-xs text-gray-500">For home use</p>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="business"
                      id="business"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="business"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-circleTel-orange peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all"
                    >
                      <Building2 className="mb-2 h-6 w-6" />
                      <div className="text-center">
                        <p className="font-semibold">Business</p>
                        <p className="text-xs text-gray-500">For company use</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Personal/Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactName"
                      placeholder="John Doe"
                      className="pl-10"
                      {...register('contactName')}
                    />
                  </div>
                  {errors.contactName && (
                    <p className="text-sm text-red-600">{errors.contactName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactPhone"
                      placeholder="0821234567"
                      className="pl-10"
                      {...register('contactPhone')}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-sm text-red-600">{errors.contactPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    {...register('contactEmail')}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>

              {/* Business Fields (conditional) */}
              {customerType === 'business' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-circleTel-darkNeutral flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Details
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Acme Corp (Pty) Ltd"
                      {...register('businessName')}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-600">{errors.businessName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessRegistration">Company Registration (Optional)</Label>
                      <Input
                        id="businessRegistration"
                        placeholder="2021/123456/07"
                        {...register('businessRegistration')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">VAT Number (Optional)</Label>
                      <Input
                        id="taxNumber"
                        placeholder="4123456789"
                        {...register('taxNumber')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Address */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-circleTel-darkNeutral flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Billing Address
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    placeholder="123 Main Street"
                    {...register('street')}
                  />
                  {errors.street && (
                    <p className="text-sm text-red-600">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="suburb">Suburb *</Label>
                    <Input
                      id="suburb"
                      placeholder="Sandton"
                      {...register('suburb')}
                    />
                    {errors.suburb && (
                      <p className="text-sm text-red-600">{errors.suburb.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Johannesburg"
                      {...register('city')}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      placeholder="Gauteng"
                      {...register('province')}
                    />
                    {errors.province && (
                      <p className="text-sm text-red-600">{errors.province.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      placeholder="2196"
                      maxLength={4}
                      {...register('postalCode')}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-red-600">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Account
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-circleTel-orange hover:bg-orange-600 text-white gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Installation'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-2 w-16 rounded-full bg-circleTel-orange"></div>
          <div className="h-2 w-16 rounded-full bg-circleTel-orange"></div>
          <div className="h-2 w-16 rounded-full bg-circleTel-orange"></div>
          <div className="h-2 w-16 rounded-full bg-gray-300"></div>
          <div className="h-2 w-16 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
}
