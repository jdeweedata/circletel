'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';

// Partner registration form schema
const partnerRegistrationSchema = z.object({
  // Business Information
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  businessType: z.enum(['sole_proprietor', 'company', 'partnership'], {
    required_error: 'Please select a business type',
  }),

  // Contact Information
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  alternativePhone: z.string().optional(),

  // Address
  streetAddress: z.string().min(5, 'Street address is required'),
  suburb: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),

  // Banking Details
  bankName: z.string().min(2, 'Bank name is required'),
  accountHolder: z.string().min(2, 'Account holder name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  accountType: z.enum(['cheque', 'savings'], {
    required_error: 'Please select an account type',
  }),
  branchCode: z.string().min(6, 'Branch code must be at least 6 digits'),
});

type PartnerRegistrationForm = z.infer<typeof partnerRegistrationSchema>;

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerRegistrationForm>({
    resolver: zodResolver(partnerRegistrationSchema),
    defaultValues: {
      businessType: undefined,
      accountType: undefined,
    },
  });

  const onSubmit = async (data: PartnerRegistrationForm) => {
    setIsSubmitting(true);

    try {
      // Submit partner registration
      const response = await fetch('/api/partners/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to submit registration');
        return;
      }

      toast.success('Registration submitted successfully!');

      // Redirect to KYC document upload
      router.push('/partners/onboarding/verify');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-2">
            Partner Registration
          </h1>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Join the CircleTel Partner Program and start earning commissions
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-circleTel-orange" />
                Business Information
              </CardTitle>
              <CardDescription>
                Tell us about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Business Name <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="businessName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="businessName" placeholder="Acme Sales PTY LTD" />
                    )}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <Label htmlFor="businessType">
                    Business Type <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="businessType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="businessType">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                          <SelectItem value="company">Company (PTY LTD)</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.businessType && (
                    <p className="text-xs text-red-600">{errors.businessType.message}</p>
                  )}
                </div>

                {/* Registration Number */}
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Controller
                    name="registrationNumber"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="registrationNumber" placeholder="2023/123456/07" />
                    )}
                  />
                </div>

                {/* VAT Number */}
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Controller
                    name="vatNumber"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="vatNumber" placeholder="4123456789" />
                    )}
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
              <CardDescription>
                How can we reach you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">
                    Contact Person <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="contactPerson"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="contactPerson" placeholder="John Doe" />
                    )}
                  />
                  {errors.contactPerson && (
                    <p className="text-xs text-red-600">{errors.contactPerson.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="email" type="email" placeholder="john@example.com" />
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="phone" type="tel" placeholder="0821234567" />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Alternative Phone */}
                <div className="space-y-2">
                  <Label htmlFor="alternativePhone">Alternative Phone</Label>
                  <Controller
                    name="alternativePhone"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="alternativePhone" type="tel" placeholder="0112345678" />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-circleTel-orange" />
                Business Address
              </CardTitle>
              <CardDescription>
                Where is your business located?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="streetAddress">
                  Street Address <span className="text-red-600">*</span>
                </Label>
                <Controller
                  name="streetAddress"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="streetAddress" placeholder="123 Main Road" />
                  )}
                />
                {errors.streetAddress && (
                  <p className="text-xs text-red-600">{errors.streetAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Suburb */}
                <div className="space-y-2">
                  <Label htmlFor="suburb">Suburb</Label>
                  <Controller
                    name="suburb"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="suburb" placeholder="Sandton" />
                    )}
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="city" placeholder="Johannesburg" />
                    )}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-600">{errors.city.message}</p>
                  )}
                </div>

                {/* Province */}
                <div className="space-y-2">
                  <Label htmlFor="province">
                    Province <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="province" placeholder="Gauteng" />
                    )}
                  />
                  {errors.province && (
                    <p className="text-xs text-red-600">{errors.province.message}</p>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="postalCode">
                  Postal Code <span className="text-red-600">*</span>
                </Label>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="postalCode" placeholder="2196" />
                  )}
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-600">{errors.postalCode.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-circleTel-orange" />
                Banking Details
              </CardTitle>
              <CardDescription>
                For commission payouts (encrypted and secure)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Bank Name <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="bankName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="bankName" placeholder="FNB" />
                    )}
                  />
                  {errors.bankName && (
                    <p className="text-xs text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                {/* Account Holder */}
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">
                    Account Holder <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="accountHolder"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="accountHolder" placeholder="John Doe" />
                    )}
                  />
                  {errors.accountHolder && (
                    <p className="text-xs text-red-600">{errors.accountHolder.message}</p>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">
                    Account Number <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="accountNumber"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="accountNumber" type="password" placeholder="••••••••" />
                    )}
                  />
                  {errors.accountNumber && (
                    <p className="text-xs text-red-600">{errors.accountNumber.message}</p>
                  )}
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <Label htmlFor="accountType">
                    Account Type <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="accountType">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cheque">Cheque/Current</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.accountType && (
                    <p className="text-xs text-red-600">{errors.accountType.message}</p>
                  )}
                </div>

                {/* Branch Code */}
                <div className="space-y-2">
                  <Label htmlFor="branchCode">
                    Branch Code <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="branchCode"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="branchCode" placeholder="250655" />
                    )}
                  />
                  {errors.branchCode && (
                    <p className="text-xs text-red-600">{errors.branchCode.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/partners')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-circleTel-orange hover:bg-[#E67510] text-white min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Continue to Verification'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
