'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { SimpleProgressBar } from '@/components/order/SimpleProgressBar';
import { StickyPackageSummary } from '@/components/order/StickyPackageSummary';
import { TrustBadges } from '@/components/order/TrustBadges';
import { InputWithHelp } from '@/components/ui/input-with-help';
import { SlimFooter } from '@/components/order/SlimFooter';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';

// Minimal form validation schema
const accountSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms & Conditions and Privacy Policy',
  }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPageImproved() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const { signUp, signInWithGoogle } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Initialize form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: state.orderData.account?.email || '',
      password: '',
      phone: state.orderData.account?.phone || '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await signUp(
        data.email,
        data.password,
        {
          firstName: '',
          lastName: '',
          email: data.email,
          phone: data.phone,
          accountType: 'personal',
        }
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Save account data to OrderContext
      actions.updateOrderData({
        account: {
          email: data.email,
          phone: data.phone,
          accountType: 'personal',
          isAuthenticated: true,
        } as any,
      });

      if (result.customer?.id) {
        actions.updateOrderData({
          payment: {
            ...state.orderData.payment,
            customerId: result.customer.id,
          } as any,
        });
      }

      // Send OTP
      const otpResponse = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });

      const otpResult = await otpResponse.json();

      if (!otpResult.success) {
        toast.error('Account created, but failed to send verification code. Please try again.');
      }

      actions.markStepComplete(2);
      actions.setCurrentStage(3);
      toast.success('Account created! Please verify your phone number.');
      router.push(`/order/verify-otp?phone=${encodeURIComponent(data.phone)}`);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error);
      } else {
        // Google sign-in successful, proceed to next step
        actions.markStepComplete(2);
        actions.setCurrentStage(3);
        router.push('/order/service-address');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Simple Progress Bar */}
      <SimpleProgressBar currentStep={1} />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content - Left/Center */}
          <div className="lg:col-span-7">
            {/* Mobile Package Summary */}
            {state.orderData.package?.selectedPackage && (
              <StickyPackageSummary 
                package={state.orderData.package.selectedPackage}
              />
            )}

            {/* Account Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Create your account
                </h1>
                <p className="text-sm text-gray-600">
                  Get started with CircleTel in just a few steps
                </p>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              {/* Email Sign-up Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field with Help */}
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <InputWithHelp
                      {...field}
                      fieldId="email"
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      helpText="We'll send your order confirmation here"
                      tooltipContent="Use an email you check regularly. We'll send important account updates here."
                      error={errors.email?.message}
                      showRequired
                      autoComplete="email"
                    />
                  )}
                />

                {/* Password Field with Help */}
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <InputWithHelp
                      {...field}
                      fieldId="password"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      helpText="Minimum 8 characters"
                      tooltipContent="Choose a strong password with letters, numbers, and symbols."
                      error={errors.password?.message}
                      showRequired
                      autoComplete="new-password"
                    />
                  )}
                />

                {/* Phone Field with Help */}
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <InputWithHelp
                      {...field}
                      fieldId="phone"
                      label="Mobile Number"
                      type="tel"
                      placeholder="082 123 4567"
                      helpText="We'll send a verification code to this number"
                      tooltipContent="Used for order updates and support. Must be a South African mobile number."
                      error={errors.phone?.message}
                      showRequired
                      autoComplete="tel"
                    />
                  )}
                />

                {/* Terms Checkbox */}
                <div className="space-y-2 pt-2">
                  <Controller
                    name="acceptTerms"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="acceptTerms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                        >
                          I agree to the{' '}
                          <Link
                            href="/terms-of-service"
                            target="_blank"
                            className="text-circleTel-orange hover:underline font-medium"
                          >
                            Terms & Conditions
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy-policy"
                            target="_blank"
                            className="text-circleTel-orange hover:underline font-medium"
                          >
                            Privacy Policy
                          </Link>
                          <span className="text-red-600 ml-1">*</span>
                        </label>
                      </div>
                    )}
                  />
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-600 font-medium ml-7">
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full bg-circleTel-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>

                {/* Trust Badges Below CTA */}
                <TrustBadges variant="compact" className="mt-4" />

                {/* Quiet Back Link */}
                <div className="text-center pt-4 border-t">
                  <Link
                    href="/order/packages"
                    className="text-sm text-gray-600 hover:text-circleTel-orange transition-colors"
                  >
                    ← Back to packages
                  </Link>
                </div>

                {/* Sign In Link */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-circleTel-orange hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Sticky Package Summary - Desktop Right Sidebar */}
          <div className="hidden lg:block lg:col-span-5">
            {state.orderData.package?.selectedPackage && (
              <StickyPackageSummary 
                package={state.orderData.package.selectedPackage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Slim Footer */}
      <SlimFooter />
    </div>
  );
}
