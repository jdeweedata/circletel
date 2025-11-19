'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { ROLE_TEMPLATES, DEPARTMENTS } from '@/lib/rbac/role-templates';

// Signup form validation schema
const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  requested_role_template_id: z.string().min(1, 'Please select a role'),
  reason: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function AdminSignupPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      requested_role_template_id: 'viewer',
      reason: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // If a pending request already exists for this email, treat it as a successful submission
        if (
          response.status === 409 &&
          (result?.error === 'A pending access request already exists for this email' ||
            result?.error?.toLowerCase().includes('pending access request'))
        ) {
          setSuccess(true);
          toast.success('You already have a pending admin access request. Please wait for approval.');
          return;
        }

        const message = result?.error || 'Failed to submit access request';
        console.warn('Signup request failed:', {
          status: response.status,
          error: message,
          result,
        });
        toast.error(message);
        return;
      }

      if (!result.success) {
        const message = result?.error || 'Failed to submit access request';
        console.warn('Signup request returned unsuccessful response:', {
          status: response.status,
          error: message,
          result,
        });
        toast.error(message);
        return;
      }

      setSuccess(true);
      toast.success('Access request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit access request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (success) {
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
                    Request Submitted!
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Your access request has been submitted successfully
                  </p>
                </div>

                {/* Info Message */}
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-green-800">
                    Your request will be reviewed by a super admin. You will be notified via email once your
                    access has been approved. This typically takes 1-2 business days.
                  </p>
                </div>

                {/* Back to Login Button */}
                <Link href="/admin/login">
                  <button className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg">
                    Return to Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Form Container */}
          <div className="w-full max-w-2xl mx-auto">
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
                  Request Admin Access
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Submit a request to access the CircleTel Admin Panel
                </p>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm sm:text-base font-semibold text-gray-700">
                      Full Name <span className="text-red-600">*</span>
                    </Label>
                    <Controller
                      name="full_name"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="full_name"
                          type="text"
                          placeholder="John Doe"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-xs text-red-600">{form.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-gray-700">
                      Email Address <span className="text-red-600">*</span>
                    </Label>
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="your.email@circletel.co.za"
                          className="w-full text-sm sm:text-base"
                          required
                        />
                      )}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                    )}
                    <p className="text-xs text-gray-500">Use your work email address</p>
                  </div>
                </div>

                {/* Role Selection Section */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm sm:text-base font-semibold text-gray-700">
                    Requested Role <span className="text-red-600">*</span>
                  </Label>
                  <Controller
                    name="requested_role_template_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full text-sm sm:text-base">
                          <SelectValue placeholder="Select a role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Group by Department */}
                          {DEPARTMENTS.map((department) => {
                            const rolesInDept = Object.values(ROLE_TEMPLATES).filter(
                              (role) => role.department === department
                            );

                            if (rolesInDept.length === 0) return null;

                            return (
                              <React.Fragment key={department}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                  {department}
                                </div>
                                {rolesInDept.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{role.name}</span>
                                      <span className="ml-2 text-xs text-gray-500 capitalize">
                                        ({role.level})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.requested_role_template_id && (
                    <p className="text-xs text-red-600">{form.formState.errors.requested_role_template_id.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Choose the role that best matches your responsibilities. Your request will be reviewed by an administrator.
                  </p>
                </div>

                {/* Reason Section */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm sm:text-base font-semibold text-gray-700">
                    Reason for Access (Optional)
                  </Label>
                  <Controller
                    name="reason"
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="reason"
                        placeholder="Briefly explain why you need admin access and what you'll be working on..."
                        className="w-full text-sm sm:text-base"
                        rows={3}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">
                    Providing context helps administrators review your request faster
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                      Submit Access Request
                    </>
                  )}
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

              {/* Login Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-2">
                Already have an account?{' '}
                <Link
                  href="/admin/login"
                  className="text-[#F5831F] hover:underline font-bold"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
