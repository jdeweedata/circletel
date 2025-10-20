'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutProgress } from '@/components/ui/checkout-progress';
import { User, Mail, Phone, Building, ShieldCheck, ArrowLeft } from 'lucide-react';

// Form validation schema
const accountSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type',
  }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Initialize form with existing data from OrderContext
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: state.orderData.account?.email || '',
      firstName: state.orderData.account?.firstName || '',
      lastName: state.orderData.account?.lastName || '',
      phone: state.orderData.account?.phone || '',
      accountType: state.orderData.account?.accountType || 'personal',
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      // Save customer to database
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save customer');
      }

      // Save account data to OrderContext (including customer ID)
      actions.updateOrderData({
        account: {
          ...data,
          isAuthenticated: false,
        },
      });

      // Store customer ID for order creation
      if (result.customer?.id) {
        actions.updateOrderData({
          payment: {
            ...state.orderData.payment,
            customerId: result.customer.id,
          } as any,
        });
      }

      // Mark step 2 as complete
      actions.markStepComplete(2);

      // Move to next stage
      actions.setCurrentStage(3);

      // Navigate to contact page
      router.push('/order/contact');
    } catch (error) {
      console.error('Error saving account data:', error);
      actions.setErrors({
        account: ['Failed to save account information. Please try again.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Get selected package info from OrderContext
  const selectedPackage = state.selectedPackage;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Checkout Progress */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <CheckoutProgress currentStep="account" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-circleTel-secondaryNeutral hover:text-circleTel-darkNeutral"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
            Create Your Account
          </h1>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Just a few details to get you started with CircleTel
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Left/Center Column */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-circleTel-orange/5 to-circleTel-orange/10 border-b border-gray-200">
                <CardTitle className="text-2xl text-circleTel-darkNeutral">Account Information</CardTitle>
                <CardDescription className="text-circleTel-secondaryNeutral">
                  We'll use this to create your account and keep you updated about your order
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Account Type Selection */}
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                            <Building className="h-5 w-5 text-circleTel-orange" />
                            Account Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 focus:border-circleTel-orange">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">
                                <div className="flex items-center gap-2 py-1">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">Personal Account</p>
                                    <p className="text-xs text-gray-500">For home use</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="business">
                                <div className="flex items-center gap-2 py-1">
                                  <Building className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">Business Account</p>
                                    <p className="text-xs text-gray-500">For companies</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name Fields - Two Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                              <User className="h-5 w-5 text-circleTel-orange" />
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John"
                                {...field}
                                className="h-12 border-2 focus:border-circleTel-orange"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-circleTel-darkNeutral">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Doe"
                                {...field}
                                className="h-12 border-2 focus:border-circleTel-orange"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                            <Mail className="h-5 w-5 text-circleTel-orange" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john.doe@example.com"
                              {...field}
                              className="h-12 border-2 focus:border-circleTel-orange"
                            />
                          </FormControl>
                          <FormDescription className="text-circleTel-secondaryNeutral">
                            Order confirmations and updates will be sent here
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Number */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                            <Phone className="h-5 w-5 text-circleTel-orange" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="082 123 4567"
                              {...field}
                              className="h-12 border-2 focus:border-circleTel-orange"
                            />
                          </FormControl>
                          <FormDescription className="text-circleTel-secondaryNeutral">
                            We'll contact you to schedule installation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Security Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Your information is secure</p>
                        <p className="text-blue-800">
                          We use industry-standard encryption to protect your personal data.
                          Your details will never be shared with third parties.
                        </p>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex-1 h-12 text-base border-2 hover:bg-gray-50"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Packages
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-12 text-base bg-circleTel-orange hover:bg-orange-600 text-white font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                          </>
                        ) : (
                          'Continue to Installation Details'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-circleTel-darkNeutral text-white">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {selectedPackage ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-circleTel-secondaryNeutral mb-1">Selected Package</p>
                        <p className="font-bold text-lg text-circleTel-darkNeutral">{selectedPackage.name}</p>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-circleTel-secondaryNeutral">Speed</span>
                          <span className="font-semibold text-circleTel-darkNeutral">
                            {selectedPackage.download_speed}Mbps
                          </span>
                        </div>

                        {selectedPackage.promotion_price && selectedPackage.promotion_price !== selectedPackage.price ? (
                          <>
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="text-circleTel-secondaryNeutral">Regular Price</span>
                              <span className="text-gray-500 line-through">
                                R{Number(selectedPackage.price).toLocaleString()}/month
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold text-circleTel-darkNeutral">Promotional Price</span>
                              <span className="font-bold text-2xl text-circleTel-orange">
                                R{Number(selectedPackage.promotion_price).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
                              per month for {selectedPackage.promotion_months} months
                            </p>
                          </>
                        ) : (
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-circleTel-darkNeutral">Monthly Price</span>
                            <span className="font-bold text-2xl text-circleTel-orange">
                              R{Number(selectedPackage.price).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                        <p className="text-sm font-semibold text-orange-900 mb-2">What's Included:</p>
                        <ul className="text-sm text-orange-800 space-y-1">
                          <li>✓ Free installation</li>
                          <li>✓ Free router included</li>
                          <li>✓ 24/7 customer support</li>
                          <li>✓ No contract required</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-circleTel-secondaryNeutral">
                      <p>No package selected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
