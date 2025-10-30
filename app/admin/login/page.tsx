'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from 'lucide-react';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Handle signout from middleware redirect and check existing auth
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signout') === 'true') {
      // Clear any existing session
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.signOut().catch(console.error);
      });
      localStorage.removeItem('admin_user');

      // Remove signout param from URL
      params.delete('signout');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    // Check if user is already authenticated and is an admin
    const checkExistingAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Check if user is in admin_users table
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id, is_active')
            .eq('id', session.user.id)
            .maybeSingle();

          if (adminUser && adminUser.is_active) {
            // Already authenticated as admin - redirect to dashboard
            window.location.href = '/admin';
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkExistingAuth();
  }, []);

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
      // Call API endpoint with audit logging
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Login failed');
      }

      // Save user to localStorage for admin layout
      if (result.user) {
        localStorage.setItem('admin_user', JSON.stringify(result.user));
      }

      // Show success message
      toast.success('Welcome back!');

      // Small delay to ensure cookies are set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to admin dashboard
      window.location.href = '/admin';
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Minimal Card Container */}
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
                  Admin Portal
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Sign in to access the admin dashboard
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                      Email <span className="text-red-600">*</span>
                    </Label>
                  </div>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="admin@circletel.co.za"
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="password" className="text-sm sm:text-base font-semibold text-gray-700">
                      Password <span className="text-red-600">*</span>
                    </Label>
                  </div>
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

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    href="/admin/forgot-password"
                    className="text-sm text-[#F5831F] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
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

              {/* Sign Up Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
                Don't have an account?{' '}
                <Link
                  href="/admin/signup"
                  className="text-[#F5831F] hover:underline font-bold"
                >
                  Request Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
