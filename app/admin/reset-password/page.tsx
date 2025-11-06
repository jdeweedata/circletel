'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Password validation schema with strict requirements
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isValidToken, setIsValidToken] = React.useState(false);
  const [isCheckingToken, setIsCheckingToken] = React.useState(true);

  const supabase = createClient();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Check if we have a valid recovery token and establish session
  useEffect(() => {
    const checkToken = async () => {
      try {
        const hashFragment = window.location.hash;

        if (!hashFragment) {
          setIsValidToken(false);
          setIsCheckingToken(false);
          toast.error('No reset token found in URL');
          return;
        }

        // Supabase auth tokens come in the URL hash
        const params = new URLSearchParams(hashFragment.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          // Establish the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            toast.error('Failed to establish auth session: ' + error.message);
            setIsValidToken(false);
          } else if (data.session) {
            console.log('Auth session established successfully for:', data.session.user.email);
            setIsValidToken(true);
            toast.success('Reset link verified successfully');
          } else {
            console.error('No session returned');
            toast.error('Failed to establish auth session');
            setIsValidToken(false);
          }
        } else {
          console.error('Missing required tokens or invalid type:', { type, hasAccess: !!accessToken, hasRefresh: !!refreshToken });
          toast.error('Invalid reset link');
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        toast.error('Error validating reset link');
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, [supabase.auth]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      // Verify we have an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('No active session:', sessionError);
        toast.error('Your session has expired. Please request a new reset link.');
        setIsValidToken(false);
        return;
      }

      console.log('Active session found for:', sessionData.session.user.email);
      console.log('Attempting to update password...');

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully');
      setIsSuccess(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-circleTel-orange animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <Shield className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Invalid or Expired Link
                  </h1>
                  <p className="text-gray-600 mb-6">
                    This password reset link is invalid or has expired. Password reset links are only valid for 1 hour.
                  </p>
                  <Link href="/admin/forgot-password">
                    <button className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold py-3 rounded-md transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg">
                      Request New Reset Link
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Password Reset Successful!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Your admin password has been reset successfully. Redirecting to login...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-circleTel-orange border-t-transparent"></div>
                    <span>Redirecting...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Admin Badge */}
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-circleTel-orange/10">
                  <Shield className="h-6 w-6 text-circleTel-orange" />
                </div>
              </div>

              {/* Heading */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Set New Password
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Create a strong password for your admin account
                </p>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character</li>
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">
                    New Password <span className="text-red-600">*</span>
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
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-semibold text-gray-700">
                    Confirm Password <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <Input
                          {...field}
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pr-10 text-sm sm:text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
