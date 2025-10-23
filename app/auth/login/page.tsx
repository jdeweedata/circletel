'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Get redirect path from query params (e.g., ?redirect=/order/payment)
  const redirectPath = searchParams.get('redirect') || '/my-account/dashboard';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Show success message
      toast.success('Welcome back!');

      // Redirect to intended page or dashboard
      router.push(redirectPath);
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-white relative overflow-hidden">
      {/* Decorative Background Circles */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-webafrica-blue hover:text-webafrica-blue-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Main Heading */}
        <h1 className="text-webafrica-blue text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12">
          Welcome back to CircleTel
        </h1>

        {/* White Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          {/* Login Section */}
          <div className="mb-8">
            <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
              Sign in to your account
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Enter your credentials to access your account and continue your order.
            </p>

            {/* New Customer Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex items-center justify-between">
              <span className="text-webafrica-blue font-medium text-sm sm:text-base">
                New Customer?
              </span>
              <Link
                href="/order/account"
                className="text-webafrica-blue font-bold hover:underline text-sm sm:text-base"
              >
                Create Account
              </Link>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <FloatingInput
                    {...field}
                    type="email"
                    label="Email Address"
                    required
                    placeholder=" "
                    error={errors.email?.message}
                  />
                )}
              />

              {/* Password Field with Toggle */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <FloatingInput
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      required
                      placeholder=" "
                      error={errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-5 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              />

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-webafrica-blue text-sm hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button - Full Width */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-webafrica-blue text-white font-extrabold px-8 py-3.5 rounded-full hover:bg-webafrica-blue-dark transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Lock className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />
              <p>
                Your information is secure and encrypted. We use industry-standard security measures to protect your data.
              </p>
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
