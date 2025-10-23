'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

// Reset password form validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [passwordReset, setPasswordReset] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Check if we have the access token from the URL (Supabase sends this after clicking reset link)
  useEffect(() => {
    let mounted = true;

    const handlePasswordResetLink = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setHasError(true);
        toast.error(errorDescription || 'Invalid or expired reset link');
        return;
      }

      const { createClient } = await import('@/integrations/supabase/client');
      const supabase = createClient();

      // Check if there's a hash fragment with access_token (Magic Link implicit flow)
      // The hash format is: #access_token=...&expires_at=...&refresh_token=...&type=recovery
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Detected access_token in URL hash, waiting for Supabase to establish session...');

        // Listen for auth state change when session is established from hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, 'Session:', !!session);

          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (mounted) {
              console.log('Session established from URL hash fragment');
              toast.success('Session verified! Please set your new password.');
            }
          }
        });

        // Also check immediately in case session is already established
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session && mounted) {
            console.log('Session already established from URL hash fragment');
            toast.success('Session verified! Please set your new password.');
          }
        }, 500);

        return () => {
          subscription.unsubscribe();
        };
      }

      // Try PKCE flow (for code parameter in query string)
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            // Don't set error yet, try token_hash approach
          } else if (data.session) {
            toast.success('Session verified! Please set your new password.');
            return;
          }
        } catch (err) {
          console.error('Password reset link error:', err);
        }
      }

      // Try implicit flow with token_hash (for token_hash parameter in query string)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (verifyError) {
            console.error('Token verification error:', verifyError);
            setHasError(true);
            toast.error('Invalid or expired reset link. Please request a new one.');
            return;
          }

          if (data.session) {
            toast.success('Session verified! Please set your new password.');
            return;
          }
        } catch (err) {
          console.error('Token verification error:', err);
          setHasError(true);
          toast.error('Failed to verify reset link. Please try again.');
        }
      }

      // If no valid session or token found, show error
      if (code || tokenHash) {
        setHasError(true);
        toast.error('Invalid or expired reset link. Please request a new one.');
      }
    };

    handlePasswordResetLink();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      // Update password using Supabase Auth
      const result = await CustomerAuthService.updatePassword(data.password);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Show success state
      setPasswordReset(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error state - invalid or expired link
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-white relative overflow-hidden flex items-center justify-center">
        {/* Decorative Background Circles */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-lg mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
            Invalid or Expired Link
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>

          <Link
            href="/auth/forgot-password"
            className="inline-block w-full bg-webafrica-blue text-white font-bold px-8 py-3 rounded-full hover:bg-webafrica-blue-dark transition-colors"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-white relative overflow-hidden">
      {/* Decorative Background Circles */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Heading */}
        <h1 className="text-webafrica-blue text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12">
          Create a new password
        </h1>

        {/* White Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          {!passwordReset ? (
            // Reset Password Form
            <div className="mb-8">
              <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
                Set your new password
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Your new password must be different from your previous password and meet the security requirements below.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Password Field with Toggle */}
                <div>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <FloatingInput
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          label="New Password"
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

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength <= 2 ? 'text-red-600' :
                          passwordStrength.strength <= 4 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field with Toggle */}
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <FloatingInput
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="Confirm New Password"
                        required
                        placeholder=" "
                        error={errors.confirmPassword?.message}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-5 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                />

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="font-semibold text-webafrica-blue mb-2 text-sm">Password requirements:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One number
                    </li>
                  </ul>
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
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Success State
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
                Password reset successful!
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>

              <p className="text-sm text-gray-500 mb-6">
                Redirecting to sign in page...
              </p>

              <Link
                href="/auth/login"
                className="inline-block w-full bg-webafrica-blue text-white font-bold px-8 py-3 rounded-full hover:bg-webafrica-blue-dark transition-colors"
              >
                Sign In Now
              </Link>
            </div>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
