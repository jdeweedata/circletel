'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Info, Lock, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  // Get redirect path from query params (e.g., ?redirect=/order/payment)
  const redirectPath = searchParams.get('redirect') || '/dashboard';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Minimal Card Container */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Sign in to your account
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Welcome back! Please sign in to continue
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
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-4">
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
                  Mobile Number OTP
                </button>
              </div>

              {/* Email Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                        Email <span className="text-red-600">*</span>
                      </Label>
                    </div>
                    <Controller
                      name="email"
                      control={emailForm.control}
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
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">
                        Password <span className="text-red-600">*</span>
                      </Label>
                    </div>
                    <Controller
                      name="password"
                      control={emailForm.control}
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
                    {emailForm.formState.errors.password && (
                      <p className="text-xs text-red-600">{emailForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-[#F5831F] hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              )}

              {/* OTP Login Form */}
              {loginMethod === 'otp' && (
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="phone" className="text-sm sm:text-base font-semibold text-gray-700">
                        Mobile Number <span className="text-red-600">*</span>
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
                      control={otpForm.control}
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
                    {otpForm.formState.errors.phone && (
                      <p className="text-xs text-red-600">{otpForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {/* Info Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      Enter your mobile number and we'll send you a verification code to sign in.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isSubmitting ? 'Sending code...' : 'Send verification code'}
                  </button>
                </form>
              )}

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

              {/* Sign Up Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
                Don't have an account?{' '}
                <Link
                  href="/order/account"
                  className="text-[#F5831F] hover:underline font-bold"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
