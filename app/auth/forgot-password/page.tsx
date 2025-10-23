'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await CustomerAuthService.sendPasswordResetEmail(data.email);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Show success state
      setEmailSent(true);
      setSubmittedEmail(data.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);

    try {
      const result = await CustomerAuthService.sendPasswordResetEmail(submittedEmail);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Password reset email resent!');
    } catch (error) {
      console.error('Error resending password reset:', error);
      toast.error('Failed to resend email. Please try again.');
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
            <span className="font-medium">Back to Sign In</span>
          </button>
        </div>

        {/* Main Heading */}
        <h1 className="text-webafrica-blue text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12">
          Reset your password
        </h1>

        {/* White Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          {!emailSent ? (
            // Request Reset Form
            <div className="mb-8">
              <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
                Forgot your password?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Remember Password Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-webafrica-blue text-sm hover:underline"
                >
                  Remember your password? Sign in
                </Link>
              </div>
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
                Check your email
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                We've sent a password reset link to <strong>{submittedEmail}</strong>
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-webafrica-blue mb-2">Next steps:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="w-full bg-webafrica-blue text-white font-bold px-8 py-3 rounded-full hover:bg-webafrica-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resending...' : 'Resend Email'}
                </button>

                <Link
                  href="/auth/login"
                  className="block w-full text-webafrica-blue font-bold py-3 text-center hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Security Notice */}
          {!emailSent && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Mail className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />
                <p>
                  The password reset link will expire in 1 hour for security reasons. If you don't receive the email, check your spam folder.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
