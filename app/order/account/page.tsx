'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { TopProgressBar } from '@/components/order/TopProgressBar';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FloatingInput } from '@/components/ui/floating-input';
import { toast } from 'sonner';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

// Simplified form validation schema - only basic fields, no password
const accountSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const { signUp } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<'signup' | 'signin'>('signup');
  const [checkingEmail, setCheckingEmail] = React.useState(false);

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Initialize form with existing data from OrderContext
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: state.orderData.account?.firstName || '',
      lastName: state.orderData.account?.lastName || '',
      email: state.orderData.account?.email || '',
      phone: state.orderData.account?.phone || '',
    },
  });

  // Check if customer exists by email
  const handleCheckEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setCheckingEmail(true);
    try {
      const response = await fetch(`/api/customers?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (result.success && result.customer) {
        // Customer exists - switch to sign-in mode
        setMode('signin');
        toast.success('Welcome back! Please verify your email to continue.');

        // Pre-fill form with existing customer data
        setValue('firstName', result.customer.first_name || '');
        setValue('lastName', result.customer.last_name || '');
        setValue('phone', result.customer.phone || '');

        // Send OTP for sign-in
        await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type: 'signin' }),
        });
      } else {
        // New customer - stay in signup mode
        setMode('signup');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setMode('signup');
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      // Generate a temporary password for account creation
      // User will set their own password during email verification
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!1A`;

      // Sign up with Supabase Auth
      const result = await signUp(
        data.email,
        tempPassword,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          accountType: 'personal', // Default to personal
        }
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Save account data to OrderContext
      actions.updateOrderData({
        account: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          accountType: 'personal',
          isAuthenticated: true,
        } as any,
      });

      // Store customer ID for order creation
      if (result.customer?.id) {
        actions.updateOrderData({
          payment: {
            ...state.orderData.payment,
            customerId: result.customer.id,
          } as any,
        });
      }

      // Mark step 2 as complete
      actions.markStepComplete(2);

      // Move to next stage
      actions.setCurrentStage(3);

      // Show success message
      toast.success('Account created! Please check your email to verify your account.');

      // Navigate to email verification page
      router.push('/order/verify-email');
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
      actions.setErrors({
        account: ['Failed to create account. Please try again.'],
      });
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

      {/* Top Progress Bar */}
      <TopProgressBar currentStep={1} />

      {/* Main Content */}
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Step Label */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-circleTel-orange text-xs sm:text-sm font-bold uppercase tracking-wide">
            STEP 1
          </p>
        </div>

        {/* Main Heading */}
        <h1 className="text-webafrica-blue text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12">
          Create your CircleTel account
        </h1>

        {/* White Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
          {/* Personal Details Section */}
          <div className="mb-8">
            <h3 className="text-circleTel-orange font-bold text-lg sm:text-xl mb-2">
              Personal Details
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              To safely complete your online check out, we need a few details.
              Your information is stored securely and is not shared.
            </p>

            {/* Already a Customer Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex items-center justify-between">
              <span className="text-webafrica-blue font-medium text-sm sm:text-base">
                Already a Customer?
              </span>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-webafrica-blue font-bold hover:underline text-sm sm:text-base"
              >
                Log In
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <FloatingInput
                      {...field}
                      label="Name"
                      required
                      placeholder=" "
                      error={errors.firstName?.message}
                    />
                  )}
                />

                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <FloatingInput
                      {...field}
                      label="Surname"
                      required
                      placeholder=" "
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </div>

              {/* Email and Phone - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <FloatingInput
                        {...field}
                        type="email"
                        label="Email Address"
                        required
                        placeholder=" "
                        error={errors.email?.message}
                        onBlur={(e) => {
                          field.onBlur();
                          handleCheckEmail(e.target.value);
                        }}
                      />
                      {checkingEmail && (
                        <div className="absolute right-3 top-5">
                          <svg className="animate-spin h-5 w-5 text-circleTel-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <FloatingInput
                      {...field}
                      type="tel"
                      label="Cellphone Number"
                      required
                      placeholder=" "
                      error={errors.phone?.message}
                    />
                  )}
                />
              </div>

              {/* Submit Button - Right Aligned */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-webafrica-blue text-white font-extrabold px-8 py-3.5 rounded-full hover:bg-webafrica-blue-dark transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
