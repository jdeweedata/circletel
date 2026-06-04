'use client';

import { PiArrowLeftBold, PiEyeBold, PiEyeSlashBold, PiUserPlusBold } from 'react-icons/pi';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import SplitAuthLayout from '@/components/auth/SplitAuthLayout';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [registrationComplete, setRegistrationComplete] = React.useState(false);

  React.useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace('/dashboard');
      }
    };
    checkExistingSession();
  }, [router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.emailSendFailed) {
        toast.warning('Account created but confirmation email could not be sent. Please contact support.');
      }

      setRegistrationComplete(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationComplete) {
    return (
      <SplitAuthLayout
        heading="Join CircleTel"
        subtitle="Create your account to manage your services, billing and support — all in one place."
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a confirmation link to <span className="font-semibold">{form.getValues('email')}</span>.
            Please check your inbox and click the link to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#F5831F] hover:bg-[#E67510] text-white font-bold py-3 px-6 rounded-md transition-all duration-200"
          >
            Go to Sign In
          </Link>
        </div>
      </SplitAuthLayout>
    );
  }

  return (
    <SplitAuthLayout
        heading="Join CircleTel"
        subtitle="Create your account to manage your services, billing and support — all in one place."
      >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Register to manage your CircleTel services
          </p>
        </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm sm:text-base font-semibold text-gray-700">
                      First Name <span className="text-red-600">*</span>
                    </Label>
                    <Controller
                      name="firstName"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="firstName"
                          type="text"
                          placeholder="Jane"
                          className="w-full text-sm sm:text-base"
                        />
                      )}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm sm:text-base font-semibold text-gray-700">
                      Last Name <span className="text-red-600">*</span>
                    </Label>
                    <Controller
                      name="lastName"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className="w-full text-sm sm:text-base"
                        />
                      )}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

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
                        placeholder="nurse@unjani.org"
                        className="w-full text-sm sm:text-base"
                      />
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-semibold text-gray-700">
                    Phone Number <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        placeholder="0821234567"
                        className="w-full text-sm sm:text-base"
                      />
                    )}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                  )}
                </div>

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
                          placeholder="••••••••"
                          className="w-full pr-10 text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>

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
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <PiEyeSlashBold className="w-4 h-4" />
                          ) : (
                            <PiEyeBold className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <PiUserPlusBold className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>

        <div className="text-center text-sm sm:text-base text-gray-600 mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline transition-colors font-medium"
          >
            <PiArrowLeftBold className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-[#F5831F] hover:underline font-bold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </SplitAuthLayout>
  );
}
