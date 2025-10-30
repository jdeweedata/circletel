'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      // Call the admin password reset API
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      // Show success state
      setIsSuccess(true);
      toast.success('Password reset instructions sent!');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-6 text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Password reset instructions have been sent
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-blue-800 mb-3">
                    We've sent password reset instructions to your email address.
                  </p>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span>Check your inbox for an email from CircleTel Admin</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>Click the secure password reset link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span>Set a strong new password</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span>Log in with your new password</span>
                    </li>
                  </ul>
                </div>

                {/* Security Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Security Notice</p>
                      <p>The reset link expires in 1 hour and can only be used once. If you didn't request this, please contact your system administrator.</p>
                    </div>
                  </div>
                </div>

                {/* Back to Login */}
                <Link href="/admin/login">
                  <button className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg">
                    Back to Login
                  </button>
                </Link>

                {/* Resend Link */}
                <div className="text-center text-sm text-gray-600 mt-4">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-[#F5831F] hover:underline font-bold"
                  >
                    Try again
                  </button>
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
                  Reset Admin Password
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Enter your admin email to receive reset instructions
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Admin Security Notice</p>
                    <p>Password reset requests for admin accounts are logged and monitored. Only registered admin users can reset their passwords.</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                      Admin Email <span className="text-red-600">*</span>
                    </Label>
                  </div>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="admin@circletel.co.za"
                          className="w-full pl-10 text-sm sm:text-base"
                          required
                        />
                      </div>
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    You will receive an email with a secure link to reset your password. The link expires in 1 hour.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>

              {/* Back Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-4">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
