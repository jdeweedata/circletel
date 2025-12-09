'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { TopProgressBar } from '@/components/order/TopProgressBar';
import { PackageSummary } from '@/components/order/PackageSummary';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Eye, EyeOff, Info, Lock } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Form validation schema - firstName, lastName, email, password, phone, and terms acceptance
const accountSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms & Conditions and Privacy Policy',
  }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const { signUp, signInWithGoogle, isAuthenticated, customer, user, session, loading: authLoading } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = React.useState(true);

  // Check if user is already authenticated - redirect to service-address
  React.useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    // Check if authenticated - support both customer record and user session (for OAuth)
    if (isAuthenticated && (customer || user)) {
      // User is already logged in - populate account data from customer OR user metadata
      // This ensures OAuth users (who have user but may not have customer yet) still work
      const firstName = customer?.first_name ||
                       user?.user_metadata?.first_name ||
                       user?.user_metadata?.full_name?.split(' ')[0] ||
                       '';
      const lastName = customer?.last_name ||
                      user?.user_metadata?.last_name ||
                      user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                      '';
      const email = customer?.email || user?.email || '';
      const phone = customer?.phone || user?.user_metadata?.phone || '';
      const accountType = customer?.account_type || 'personal';

      console.log('[AccountPage] Authenticated user detected, populating order context:', {
        isAuthenticated,
        hasCustomer: !!customer,
        hasUser: !!user,
        email,
        firstName,
        lastName
      });

      actions.updateOrderData({
        account: {
          firstName,
          lastName,
          email,
          phone,
          accountType,
          isAuthenticated: true,
        } as any,
      });

      // Mark step as complete and redirect
      actions.markStepComplete(2);
      actions.setCurrentStage(3);
      router.replace('/order/service-address');
      return;
    }
  }, [isAuthenticated, customer, user, authLoading, actions, router]);

  // Protect route - require package selection first
  React.useEffect(() => {
    if (authLoading) return; // Wait for auth check first
    if (isAuthenticated) return; // Don't check if authenticated (will redirect above)

    const hasPackageData = state.orderData.package?.selectedPackage;
    const hasCoverageData = state.orderData.coverage?.address ||
                            state.orderData.coverage?.coordinates;

    // Check localStorage as backup
    const savedCoverage = typeof window !== 'undefined'
      ? localStorage.getItem('circletel_coverage_address')
      : null;

    if (!hasPackageData && !hasCoverageData && !savedCoverage) {
      // No valid order flow - redirect to home
      router.replace('/');
      return;
    }

    setIsCheckingAccess(false);
  }, [state.orderData.package, state.orderData.coverage, router, authLoading, isAuthenticated]);

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Initialize form with existing data from OrderContext
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: state.orderData.account?.firstName || '',
      lastName: state.orderData.account?.lastName || '',
      email: state.orderData.account?.email || '',
      password: '',
      phone: state.orderData.account?.phone || '',
      acceptTerms: false,
    },
  });

  // Watch form values for autosave
  const watchedValues = watch();

  // Autosave form progress to OrderContext
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if there's actual data
      if (watchedValues.email || watchedValues.phone || watchedValues.firstName || watchedValues.lastName) {
        actions.updateOrderData({
          account: {
            ...state.orderData.account,
            firstName: watchedValues.firstName,
            lastName: watchedValues.lastName,
            email: watchedValues.email,
            phone: watchedValues.phone,
          } as any,
        });
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [watchedValues.firstName, watchedValues.lastName, watchedValues.email, watchedValues.phone]);

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      // Sign up with Supabase Auth using the provided password
      const result = await signUp(
        data.email,
        data.password,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          accountType: 'personal', // Default to personal
        }
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Save account data to OrderContext
      actions.updateOrderData({
        account: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          accountType: 'personal',
          isAuthenticated: true,
        } as any,
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

      // Send OTP to phone number
      const otpResponse = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });

      const otpResult = await otpResponse.json();

      if (!otpResult.success) {
        toast.error('Account created, but failed to send verification code. Please try again.');
        // Still allow user to proceed, they can resend OTP
      }

      // Mark step 2 as complete
      actions.markStepComplete(2);

      // Move to next stage
      actions.setCurrentStage(3);

      // Show success messages
      toast.success('Account created successfully!', { duration: 4000 });
      toast.info('📧 Verification email sent! Please check your inbox and verify your email address.', { duration: 6000 });
      toast.info('📱 SMS verification code sent to your phone.', { duration: 4000 });

      // Navigate to OTP verification page
      router.push(`/order/verify-otp?phone=${encodeURIComponent(data.phone)}&email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
      actions.setErrors({
        account: ['Failed to create account. Please try again.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/order/packages');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error);
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  // Show loading while checking authentication status
  // Include 'user' check for OAuth users who may not have customer record yet
  if (authLoading || (isAuthenticated && (customer || user))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isAuthenticated ? 'Redirecting to next step...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Progress Bar */}
        <TopProgressBar currentStep={1} />

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Minimal Card Container */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                {/* Heading */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Create an account
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Enter your email below to create your account
                  </p>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isSubmitting}
                  className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* First Name Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="firstName" className="text-sm sm:text-base font-semibold text-gray-700">
                        First Name <span className="text-red-600">*</span>
                      </Label>
                    </div>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="firstName"
                          type="text"
                          placeholder="John"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lastName" className="text-sm sm:text-base font-semibold text-gray-700">
                        Last Name <span className="text-red-600">*</span>
                      </Label>
                    </div>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                        Email <span className="text-red-600">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">We'll send order updates to this email</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">
                        Password <span className="text-red-600">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Must be at least 8 characters</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="w-full pr-10 text-sm sm:text-base"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="phone" className="text-sm sm:text-base font-semibold text-gray-700">
                        Cellphone Number <span className="text-red-600">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">We'll send a verification code to this number</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="phone"
                          type="tel"
                          placeholder="0821234567"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="space-y-2">
                    <Controller
                      name="acceptTerms"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-start space-x-2">
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
                              href="/terms"
                              target="_blank"
                              className="text-[#F5831F] hover:underline font-medium"
                            >
                              Terms & Conditions
                            </Link>{' '}
                            and{' '}
                            <Link
                              href="/privacy-policy"
                              target="_blank"
                              className="text-[#F5831F] hover:underline font-medium"
                            >
                              Privacy Policy
                            </Link>
                            <span className="text-red-600 ml-1">*</span>
                          </label>
                        </div>
                      )}
                    />
                    {errors.acceptTerms && (
                      <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </button>

                  {/* Back Link */}
                  <div className="text-center text-sm sm:text-base text-gray-600 mt-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline transition-colors font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Packages
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
                    Already have an account?{' '}
                    <Link
                      href="/auth/login?redirect=/order/service-address"
                      className="text-[#F5831F] hover:underline font-bold"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
