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
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Minimal form validation schema - email, password, phone, and terms acceptance
const accountSchema = z.object({
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
  const { signUp } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      // Sign up with Supabase Auth using the provided password
      const result = await signUp(
        data.email,
        data.password,
        {
          firstName: '', // Will be collected later in the flow
          lastName: '', // Will be collected later in the flow
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

      // Show success message
      toast.success('Account created! Please verify your phone number.');

      // Navigate to OTP verification page
      router.push(`/order/verify-otp?phone=${encodeURIComponent(data.phone)}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Progress Bar */}
      <TopProgressBar currentStep={1} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Package Summary */}
        {state.orderData.package?.selectedPackage && (
          <div className="max-w-md mx-auto mb-6">
            <PackageSummary package={state.orderData.package.selectedPackage} compact />
          </div>
        )}

        {/* Minimal Card Container */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Heading */}
            <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Create an account
            </h1>
            <p className="text-sm text-gray-600">
              Enter your email below to create your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email <span className="text-red-600">*</span>
              </Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    className="w-full"
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
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password <span className="text-red-600">*</span>
              </Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full"
                    required
                  />
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Cellphone Number <span className="text-red-600">*</span>
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="0821234567"
                    className="w-full"
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
                        href="/terms-of-service"
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
              disabled={isSubmitting}
              className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Packages
            </button>

            {/* Sign In Link */}
            <div className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-[#F5831F] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
