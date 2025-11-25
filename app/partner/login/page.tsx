'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Lock, Handshake } from 'lucide-react';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Failed to sign in. Please try again.');
        return;
      }

      // Check if user has a partner account
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, status, business_name')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (partnerError) {
        console.error('Error checking partner status:', partnerError);
        toast.error('Failed to verify partner account. Please try again.');
        return;
      }

      if (!partner) {
        toast.error('No partner account found. Please register as a partner first.');
        // Sign out since they're not a partner
        await supabase.auth.signOut();
        return;
      }

      // Check partner status
      if (partner.status === 'pending' || partner.status === 'under_review') {
        toast.info('Your partner application is still under review. You will be notified once approved.');
        router.push('/partner/onboarding/verify');
        return;
      }

      if (partner.status === 'rejected') {
        toast.error('Your partner application was not approved. Please contact support for more information.');
        await supabase.auth.signOut();
        return;
      }

      if (partner.status === 'suspended') {
        toast.error('Your partner account has been suspended. Please contact support.');
        await supabase.auth.signOut();
        return;
      }

      // Success - redirect to dashboard
      toast.success(`Welcome back, ${partner.business_name}!`);
      router.push('/partner/dashboard');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/partner/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Card Container */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Partner Branding Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="bg-circleTel-orange/10 p-3 rounded-full">
                  <Handshake className="w-8 h-8 text-circleTel-orange" />
                </div>
              </div>

              {/* Heading */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Partner Portal
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Sign in to access your partner dashboard
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

              {/* Login Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="partner@company.com"
                        className="w-full text-sm sm:text-base"
                        required
                      />
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
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
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-circleTel-orange hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isSubmitting ? 'Signing in...' : 'Sign in to Partner Portal'}
                </button>
              </form>

              {/* Back Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>

              {/* Register Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
                Not a partner yet?{' '}
                <Link
                  href="/become-a-partner"
                  className="text-circleTel-orange hover:underline font-bold"
                >
                  Join our partner program
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
