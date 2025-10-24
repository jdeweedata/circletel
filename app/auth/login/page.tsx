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
import { createClient } from '@/integrations/supabase/client';

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
  const [rememberMe, setRememberMe] = React.useState(false);

  // Get redirect path from query params (e.g., ?redirect=/order/payment)
  const redirectPath = searchParams.get('redirect') || '/dashboard';

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
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-circleTel-orange/20 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full h-full">
          <img 
            src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" 
            alt="CircleTel" 
            className="h-20 w-auto mb-12"
          />
          <h2 className="text-4xl font-bold mb-4 text-white text-center">Welcome to CircleTel</h2>
          <p className="text-xl text-gray-300 text-center">Your trusted fibre internet provider</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" 
              alt="CircleTel" 
              className="h-12 w-auto mx-auto"
            />
          </div>

          {/* Logo - Replaces icon */}
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" 
              alt="CircleTel" 
              className="h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Get started</h1>
            <p className="text-gray-600">Sign in to access your CircleTel account</p>
          </div>

          {/* Form Container */}
          <div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      placeholder="Work email"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent outline-none transition-all"
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field with Toggle */}
              <div>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Continue'}
              </button>
            </form>

            {/* Terms */}
            <p className="text-center text-sm text-gray-600 mt-6">
              By continuing, you agree to{' '}
              <Link href="/terms" className="text-circleTel-orange hover:underline">
                Terms
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-circleTel-orange hover:underline">
                Privacy
              </Link>
            </p>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Have an account?{' '}
              <Link href="/order/account" className="text-circleTel-orange font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
