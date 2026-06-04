'use client';
import { PiArrowLeftBold, PiEyeBold, PiEyeSlashBold, PiInfoBold, PiPhoneBold } from 'react-icons/pi';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { clearSupabaseSession, createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SplitAuthLayout from '@/components/auth/SplitAuthLayout';

// Login form validation schema - supports both email and OTP login
const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpLoginSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;
type OtpLoginFormValues = z.infer<typeof otpLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [loginMethod, setLoginMethod] = React.useState<'email' | 'otp'>('email');

  const ALLOWED_REDIRECT_PATHS = [
    '/dashboard',
    '/order/checkout',
    '/packages',
    '/partners',
  ];

  function safeRedirectPath(raw: string | null): string {
    if (!raw) return '/dashboard';
    if (!raw.startsWith('/')) return '/dashboard';
    if (raw.startsWith('//')) return '/dashboard';
    const isAllowed = ALLOWED_REDIRECT_PATHS.some((allowed) => raw.startsWith(allowed));
    return isAllowed ? raw : '/dashboard';
  }

  // Get redirect path from query params — validated against allowlist to prevent open redirect
  const redirectPath = safeRedirectPath(searchParams.get('redirect'));

  // Redirect already-authenticated users away from the login page.
  // CustomerAuthProvider skips initialization on /auth/* routes, so we check
  // the Supabase session directly here.
  React.useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace(redirectPath);
      }
    };
    checkExistingSession();
  }, [router, redirectPath]);

  // Only clear session if there's an explicit auth error indicator
  // Don't clear just because there's a redirect param - that's too aggressive
  // and can cause login loops when the session is still valid
  React.useEffect(() => {
    const authError = searchParams.get('error') || searchParams.get('auth_error');
    if (authError) {
      // Only clear session for actual auth errors, not just redirects
      console.log('[Login] Clearing session due to auth error:', authError);
      clearSupabaseSession();
    }
  }, [searchParams]);

  // Email login form
  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // OTP login form
  const otpForm = useForm<OtpLoginFormValues>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onEmailSubmit = async (data: EmailLoginFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Show success message
      toast.success('Welcome back!');

      // Small delay to ensure cookies are set before navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to intended page or dashboard
      router.push(redirectPath);
      
      // Force a refresh to ensure session is picked up
      router.refresh();
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpLoginFormValues) => {
    setIsSubmitting(true);

    try {
      // Send OTP to phone number
      const otpResponse = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });

      const otpResult = await otpResponse.json();

      if (!otpResult.success) {
        toast.error('Failed to send verification code. Please try again.');
        return;
      }

      toast.success('Verification code sent to your phone!');

      // Navigate to OTP verification page
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(data.phone)}&redirect=${encodeURIComponent(redirectPath)}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ redirectTo: redirectPath });
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

  return (
    <SplitAuthLayout
      heading="Customer Portal"
      subtitle="Manage your account, view invoices, track your connection and get support — all in one place."
    >
      <div className="space-y-6">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back — please sign in to continue</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-[#F5831F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('otp')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'otp'
                ? 'bg-[#F5831F] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mobile OTP
          </button>
        </div>

        {/* Email Login Form */}
        {loginMethod === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Controller
                name="email"
                control={emailForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="rounded-none border-0 border-b border-gray-300 bg-transparent px-0 shadow-none focus-visible:border-[#F5831F] focus-visible:ring-0"
                    required
                  />
                )}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <Controller
                name="password"
                control={emailForm.control}
                render={({ field }) => (
                  <div className="relative">
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="rounded-none border-0 border-b border-gray-300 bg-transparent px-0 pr-10 shadow-none focus-visible:border-[#F5831F] focus-visible:ring-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <PiEyeSlashBold className="w-4 h-4" />
                      ) : (
                        <PiEyeBold className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              />
              {emailForm.formState.errors.password && (
                <p className="text-xs text-red-600">{emailForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-gray-700 hover:text-[#F5831F]"
              >
                Forgot password
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-base py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMethod === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
            {/* Phone Field */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Mobile Number
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PiInfoBold className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">We'll send a verification code to this number</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Controller
                name="phone"
                control={otpForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="0821234567"
                    className="rounded-none border-0 border-b border-gray-300 bg-transparent px-0 shadow-none focus-visible:border-[#F5831F] focus-visible:ring-0"
                    required
                  />
                )}
              />
              {otpForm.formState.errors.phone && (
                <p className="text-xs text-red-600">{otpForm.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-base py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PiPhoneBold className="w-4 h-4" />
              {isSubmitting ? 'Sending code...' : 'Send verification code'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="text-sm font-semibold text-gray-700">
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-600">
          New customer?{' '}
          <Link href="/auth/register" className="text-[#F5831F] hover:underline font-bold">
            Create account
          </Link>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <PiArrowLeftBold className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </SplitAuthLayout>
  );
}
