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
import { User, Mail, Phone, Building, ShieldCheck, ArrowLeft, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema with business fields
const accountSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type',
  }),
  // Business-specific fields (optional)
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
}).refine((data) => {
  // If business account, company name is required
  if (data.accountType === 'business' && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: 'Company name is required for business accounts',
  path: ['companyName'],
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
      companyName: state.orderData.account?.companyName || '',
      vatNumber: state.orderData.account?.vatNumber || '',
    },
  });

  // Watch account type for progressive disclosure
  const accountType = form.watch('accountType');

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-blue-50/20">
      {/* Checkout Progress */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CheckoutProgress currentStep="account" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 text-circleTel-secondaryNeutral hover:text-circleTel-darkNeutral hover:bg-gray-100 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>

          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-circleTel-orange to-orange-600 text-white shadow-lg">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-circleTel-darkNeutral mb-3 bg-gradient-to-r from-circleTel-darkNeutral to-gray-700 bg-clip-text">
                Create Your Account
              </h1>
              <p className="text-base sm:text-lg text-circleTel-secondaryNeutral max-w-2xl">
                Just a few details to get you started with CircleTel. We'll use this information to set up your account and keep you updated about your order.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Form - Left/Center Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Why We Need This Info */}
            <Alert className="border-blue-200 bg-blue-50/50 backdrop-blur-sm">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <span className="font-semibold">Quick setup:</span> This information helps us create your account, schedule installation, and send you important updates about your service.
              </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-circleTel-orange/10 via-orange-50/50 to-white border-b border-orange-100/50 pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-circleTel-orange/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-circleTel-orange" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-circleTel-darkNeutral">Account Information</CardTitle>
                    <CardDescription className="text-circleTel-secondaryNeutral text-base mt-1">
                      Let's get you set up in under a minute
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                              <SelectTrigger className="h-14 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal" className="cursor-pointer">
                                <div className="flex items-center gap-3 py-2">
                                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base">Personal Account</p>
                                    <p className="text-sm text-gray-500">For home and personal use</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="business" className="cursor-pointer">
                                <div className="flex items-center gap-3 py-2">
                                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Building className="h-5 w-5 text-circleTel-orange" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base">Business Account</p>
                                    <p className="text-sm text-gray-500">For companies and organizations</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business-Specific Fields (Progressive Disclosure) */}
                    {accountType === 'business' && (
                      <div className="space-y-6 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                        <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Building className="h-5 w-5 text-circleTel-orange" />
                            <h3 className="font-semibold text-circleTel-darkNeutral">Business Details</h3>
                          </div>

                          <div className="space-y-5">
                            {/* Company Name */}
                            <FormField
                              control={form.control}
                              name="companyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold text-circleTel-darkNeutral">
                                    Company Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Acme Corporation (Pty) Ltd"
                                      {...field}
                                      autoComplete="organization"
                                      className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* VAT Number */}
                            <FormField
                              control={form.control}
                              name="vatNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold text-circleTel-darkNeutral">
                                    VAT Number <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 4123456789"
                                      {...field}
                                      className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-sm text-gray-600">
                                    Required for VAT invoices
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Personal Details Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-circleTel-orange"></div>
                        <h3 className="text-lg font-semibold text-circleTel-darkNeutral">Personal Details</h3>
                      </div>

                      {/* Name Fields - Two Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                                <User className="h-4 w-4 text-circleTel-orange" />
                                First Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John"
                                  {...field}
                                  autoComplete="given-name"
                                  className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
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
                                  autoComplete="family-name"
                                  className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-circleTel-orange"></div>
                        <h3 className="text-lg font-semibold text-circleTel-darkNeutral">Contact Information</h3>
                      </div>

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base font-semibold text-circleTel-darkNeutral">
                              <Mail className="h-4 w-4 text-circleTel-orange" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john.doe@example.com"
                                {...field}
                                autoComplete="email"
                                className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
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
                              <Phone className="h-4 w-4 text-circleTel-orange" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="082 123 4567"
                                {...field}
                                autoComplete="tel"
                                className="h-12 border-2 focus:border-circleTel-orange focus:ring-4 focus:ring-circleTel-orange/10 transition-all"
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              We'll contact you to schedule installation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Security Notice */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200/60 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                      <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-blue-900 mb-2">Your information is secure</p>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          We use industry-standard encryption to protect your personal data.
                          Your details will never be shared with third parties without your consent.
                        </p>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex-1 h-14 text-base border-2 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Packages
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-14 text-base bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
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
                          <>
                            Continue to Installation Details
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-xs font-semibold text-gray-700">Secure Checkout</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <ShieldCheck className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-xs font-semibold text-gray-700">Data Protected</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No Hidden Fees</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <ShieldCheck className="h-8 w-8 text-blue-600 mb-2" />
                <p className="text-xs font-semibold text-gray-700">24/7 Support</p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar - Right Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <Card className="border-0 shadow-xl shadow-gray-200/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-circleTel-darkNeutral via-gray-800 to-gray-900 text-white pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  {selectedPackage ? (
                    <div className="space-y-5">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200">
                        <p className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wide">Selected Package</p>
                        <p className="font-bold text-xl text-circleTel-darkNeutral">{selectedPackage.name}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Download Speed</span>
                          <span className="font-bold text-lg text-circleTel-darkNeutral">
                            {selectedPackage.download_speed} <span className="text-sm text-gray-500">Mbps</span>
                          </span>
                        </div>

                        {selectedPackage.promotion_price && selectedPackage.promotion_price !== selectedPackage.price ? (
                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm text-gray-500">Regular Price</span>
                              <span className="text-gray-400 line-through text-sm">
                                R{Number(selectedPackage.price).toLocaleString()}/mo
                              </span>
                            </div>
                            <div className="bg-gradient-to-br from-circleTel-orange to-orange-600 text-white rounded-xl p-4">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium opacity-90">Promotional Price</span>
                                <span className="font-bold text-3xl">
                                  R{Number(selectedPackage.promotion_price).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs opacity-75">
                                per month for {selectedPackage.promotion_months} months
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-circleTel-orange to-orange-600 text-white rounded-xl p-4">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-medium opacity-90">Monthly Price</span>
                              <span className="font-bold text-3xl">
                                R{Number(selectedPackage.price).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200/60 rounded-xl p-5 mt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <p className="text-sm font-bold text-green-900">What's Included</p>
                        </div>
                        <ul className="space-y-2.5">
                          <li className="flex items-center gap-2.5 text-sm text-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            <span>Free professional installation</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-sm text-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            <span>Free router included</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-sm text-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            <span>24/7 customer support</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-sm text-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            <span>No contract required</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-circleTel-secondaryNeutral">
                      <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No package selected</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-blue-900 mb-1">Need help?</p>
                    <p className="text-sm text-blue-700 mb-3">Our team is here to assist</p>
                    <a
                      href="tel:0800123456"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      0800 123 456
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
