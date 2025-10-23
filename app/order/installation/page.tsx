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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Phone, ArrowLeft, ArrowRight, Clock, Info, CheckCircle2 } from 'lucide-react';

// Validation schema for installation form
const installationSchema = z.object({
  preferredDate: z.string().min(1, 'Please select a preferred installation date'),
  alternativeDate: z.string().optional(),
  onsiteContactName: z.string().min(2, 'Contact name is required'),
  onsiteContactPhone: z.string().regex(/^0[0-9]{9}$/, 'Please enter a valid South African phone number'),
  isAccountHolder: z.boolean(),
  specialInstructions: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type InstallationFormValues = z.infer<typeof installationSchema>;

export default function InstallationPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set current stage to 4 when this page loads
  useEffect(() => {
    if (state.currentStage !== 4) {
      actions.setCurrentStage(4);
    }
  }, [state.currentStage, actions]);

  // Calculate min date (tomorrow) and max date (30 days from now)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // Initialize form with existing data
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstallationFormValues>({
    resolver: zodResolver(installationSchema),
    defaultValues: {
      preferredDate: state.orderData.installation?.preferredDate
        ? new Date(state.orderData.installation.preferredDate).toISOString().split('T')[0]
        : '',
      alternativeDate: state.orderData.installation?.alternativeDate
        ? new Date(state.orderData.installation.alternativeDate).toISOString().split('T')[0]
        : '',
      onsiteContactName: state.orderData.installation?.onsiteContact?.name ||
        state.orderData.contact?.contactName ||
        `${state.orderData.account?.firstName || ''} ${state.orderData.account?.lastName || ''}`.trim(),
      onsiteContactPhone: state.orderData.installation?.onsiteContact?.phone ||
        state.orderData.contact?.contactPhone ||
        state.orderData.account?.phone || '',
      isAccountHolder: state.orderData.installation?.onsiteContact?.isAccountHolder ?? true,
      specialInstructions: state.orderData.installation?.specialInstructions || '',
      termsAccepted: state.orderData.installation?.termsAccepted ?? false,
    },
  });

  const isAccountHolder = watch('isAccountHolder');
  const termsAccepted = watch('termsAccepted');

  const onSubmit = async (data: InstallationFormValues) => {
    setIsSubmitting(true);

    try {
      // Save installation data to OrderContext
      actions.updateOrderData({
        installation: {
          preferredDate: new Date(data.preferredDate),
          alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : undefined,
          onsiteContact: {
            name: data.onsiteContactName,
            phone: data.onsiteContactPhone,
            isAccountHolder: data.isAccountHolder,
          },
          specialInstructions: data.specialInstructions,
          paymentMethod: {
            type: 'card', // Default to card payment
          },
          termsAccepted: data.termsAccepted,
        },
      });

      // Mark step as complete
      actions.markStepComplete(4);

      // Navigate to payment page
      router.push('/order/payment');
    } catch (error) {
      console.error('Error saving installation data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/order/contact');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
            Installation Scheduling
          </h1>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Step 4 of 5: Choose when to schedule your installation
          </p>
        </div>

        {/* Order Summary Card */}
        {state.orderData.coverage?.selectedPackage && (
          <Card className="mb-6 border-circleTel-orange">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Installation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600">
                      Professional installation is included at no extra cost. Our technician will ensure everything is set up correctly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Installation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Installation</CardTitle>
            <CardDescription>
              Choose your preferred installation dates and provide onsite contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Installation Dates */}
              <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-circleTel-darkNeutral">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Select Installation Dates</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="preferredDate"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className="pl-10"
                        {...register('preferredDate')}
                      />
                    </div>
                    {errors.preferredDate && (
                      <p className="text-sm text-red-600">{errors.preferredDate.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Available from tomorrow onwards
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternativeDate">Alternative Date (Optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="alternativeDate"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className="pl-10"
                        {...register('alternativeDate')}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      In case your preferred date is not available
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded border border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Installation Window</p>
                    <p className="text-gray-600">
                      Our team will contact you to confirm the exact time between 8:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Onsite Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-circleTel-darkNeutral">Onsite Contact</h3>
                <p className="text-sm text-gray-600">
                  Who will be available during the installation?
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="isAccountHolder"
                    checked={isAccountHolder}
                    onCheckedChange={(checked) => setValue('isAccountHolder', checked as boolean)}
                  />
                  <Label
                    htmlFor="isAccountHolder"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I will be the onsite contact
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="onsiteContactName">Contact Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="onsiteContactName"
                        placeholder="John Doe"
                        className="pl-10"
                        disabled={isAccountHolder}
                        {...register('onsiteContactName')}
                      />
                    </div>
                    {errors.onsiteContactName && (
                      <p className="text-sm text-red-600">{errors.onsiteContactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onsiteContactPhone">Contact Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="onsiteContactPhone"
                        placeholder="0821234567"
                        className="pl-10"
                        disabled={isAccountHolder}
                        {...register('onsiteContactPhone')}
                      />
                    </div>
                    {errors.onsiteContactPhone && (
                      <p className="text-sm text-red-600">{errors.onsiteContactPhone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="E.g., Gate code, parking instructions, specific installation requirements..."
                  rows={4}
                  className="resize-none"
                  {...register('specialInstructions')}
                />
                <p className="text-xs text-gray-500">
                  Any important details our installation team should know
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-circleTel-darkNeutral">Terms & Conditions</h3>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Free professional installation included</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>No long-term contracts - cancel anytime with 30 days notice</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>24/7 technical support included</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>14-day money-back guarantee if you're not satisfied</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pt-3 border-t">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setValue('termsAccepted', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      I accept the{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-circleTel-orange hover:underline"
                      >
                        Terms & Conditions
                      </a>
                      {' '}and{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-circleTel-orange hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </Label>
                    {errors.termsAccepted && (
                      <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
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
                  Back to Contact
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="bg-circleTel-orange hover:bg-orange-600 text-white gap-2"
                >
                  {isSubmitting ? 'Processing...' : 'Continue to Payment'}
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
          <div className="h-2 w-16 rounded-full bg-circleTel-orange"></div>
          <div className="h-2 w-16 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
}
